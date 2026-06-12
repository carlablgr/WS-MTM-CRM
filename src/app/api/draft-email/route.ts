import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnthropicClient, DRAFT_EMAIL_MODEL } from "@/lib/anthropic";
import { formatCurrency, formatDate, formatDateTime, garmentTypeLabel, appointmentTypeLabel } from "@/lib/format";
import { calculateMtoOrderTotals, mtoEstimatedArrival } from "@/lib/mtoUtils";

export const dynamic = "force-dynamic";

const SIGN_OFF = "Walker Slater Covent Garden";
const ADDRESS = "38 Great Queen Street, London WC2B 5AA";
const PHONE = "+44 (0) 203 754 9787";

interface Draft {
  to: string;
  subject: string;
  body: string;
}

const SYSTEM_PROMPT = `You are an assistant for Walker Slater Covent Garden, a bespoke and made-to-measure tailoring studio at ${ADDRESS} (phone: ${PHONE}).

You write short, polite, professional email drafts for staff to review, edit and send, matching the house style of Walker Slater's existing customer-service emails — clear, courteous British retail tone (e.g. "We are pleased to let you know...", "Thank you for choosing Walker Slater", "please do not hesitate to contact us"). The drafts are based on real customer and order data provided to you.

Rules:
- Polite, warm, professional tone — like a trusted tailor writing to a valued customer or colleague. No marketing language, no exclamation-mark enthusiasm, no sales pitches.
- Be concise — a few short paragraphs at most.
- Where relevant, invite the customer to call ${PHONE} with any questions or to arrange/amend appointments.
- Always sign off with "Kind regards," on its own line, followed by "${SIGN_OFF}" on the next line.
- Use only the facts provided. Do not invent dates, prices, or details that aren't given.
- If a piece of information (e.g. an email address) is missing, leave the "to" field blank.

Respond with ONLY a JSON object, no other text, in this exact shape:
{"to": "...", "subject": "...", "body": "..."}

The "body" should use \\n for line breaks (including a blank line between paragraphs and before/after the sign-off).`;

function extractJson(text: string): Draft {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  const parsed = JSON.parse(cleaned);
  return {
    to: String(parsed.to ?? ""),
    subject: String(parsed.subject ?? ""),
    body: String(parsed.body ?? ""),
  };
}

async function generateWithAi(prompt: string): Promise<Draft> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: DRAFT_EMAIL_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text response from model");
  return extractJson(block.text);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { kind } = body;

  try {
    let dataLines: string[] = [];
    let prompt = "";
    let fallback: Draft;

    switch (kind) {
      case "order-confirmation":
      case "order-ready":
      case "chase-update": {
        const { orderId, orderType } = body;

        if (orderType === "mto") {
          const order = await prisma.mtoOrder.findUnique({
            where: { id: orderId },
            include: { customer: true, items: { orderBy: { sortOrder: "asc" } } },
          });
          if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

          const totals = calculateMtoOrderTotals(order.items.map((it) => Number(it.totalIncVat ?? 0)));
          const balanceDue = order.fullyPaid ? 0 : totals.grandTotal - Number(order.depositPaid ?? 0);
          const estimatedArrival = mtoEstimatedArrival(order.submissionDate);
          const garments = order.items.map((it) => it.garmentName).join(", ") || "garment";
          const fabrics = order.items
            .map((it) => [it.cloth, it.lining].filter(Boolean).join(" / "))
            .filter(Boolean)
            .join("; ");

          const fields = {
            to: order.customer.email || "",
            firstName: order.customer.firstName,
            customerName: `${order.customer.firstName} ${order.customer.lastName}`,
            garments,
            fabrics,
            total: formatCurrency(totals.grandTotal),
            depositPaid: order.depositPaid ? formatCurrency(Number(order.depositPaid)) : null,
            balanceDue: Math.max(0, balanceDue),
            estimatedCompletion: estimatedArrival ? formatDate(estimatedArrival) : null,
            createdDate: formatDate(order.createdAt),
          };

          dataLines = [
            `Customer name: ${fields.customerName}`,
            `Customer email: ${order.customer.email || "(none on file)"}`,
            `Order type: Made to Order (MTO)`,
            `Garment(s): ${garments}`,
            fabrics ? `Fabric/lining: ${fabrics}` : "",
            `Total inc. VAT: ${fields.total}`,
            `Deposit paid: ${fields.depositPaid ?? "none recorded"}`,
            `Balance due: ${formatCurrency(fields.balanceDue)}`,
            `Date required: ${order.dateRequired ? formatDate(order.dateRequired) : "not specified"}`,
            `Estimated arrival (guide): ${fields.estimatedCompletion ?? "not yet known"}`,
            `Collection location: ${SIGN_OFF}, ${ADDRESS}`,
          ].filter(Boolean);

          fallback = buildOrderTemplate(kind, fields);
          prompt = buildOrderPrompt(kind, dataLines);
        } else {
          const order = await prisma.orderForm.findUnique({
            where: { id: orderId },
            include: { customer: true, items: { orderBy: { sortOrder: "asc" } } },
          });
          if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

          const garments = order.items.length
            ? order.items.map((it) => garmentTypeLabel(it.garmentType)).join(", ")
            : garmentTypeLabel(order.garmentType);
          const fabrics = order.items
            .map((it) => [it.fabricDescription, it.fabricCode, it.fabricColour].filter(Boolean).join(", "))
            .filter(Boolean)
            .join("; ");
          const balanceDue =
            order.totalIncVat && order.depositPaid
              ? Number(order.totalIncVat) - Number(order.depositPaid)
              : order.totalIncVat
              ? Number(order.totalIncVat)
              : null;

          const fields = {
            to: order.customer.email || "",
            firstName: order.customer.firstName,
            customerName: `${order.customer.firstName} ${order.customer.lastName}`,
            garments,
            fabrics,
            total: order.totalIncVat ? formatCurrency(Number(order.totalIncVat)) : null,
            depositPaid: order.depositPaid ? formatCurrency(Number(order.depositPaid)) : null,
            balanceDue: balanceDue !== null ? Math.max(0, balanceDue) : null,
            estimatedCompletion: order.estimatedCompletionDate ? formatDate(order.estimatedCompletionDate) : null,
            createdDate: formatDate(order.createdAt),
          };

          dataLines = [
            `Customer name: ${fields.customerName}`,
            `Customer email: ${order.customer.email || "(none on file)"}`,
            `Order type: Made to Measure (MTM)`,
            `Garment(s): ${garments}`,
            fabrics ? `Fabric: ${fabrics}` : "",
            `Total inc. VAT: ${fields.total ?? "not yet finalised"}`,
            `Deposit required: ${order.depositRequired ? formatCurrency(Number(order.depositRequired)) : "not specified"}`,
            `Deposit paid: ${fields.depositPaid ?? "none recorded"}`,
            `Balance due: ${fields.balanceDue !== null ? formatCurrency(fields.balanceDue) : "to be confirmed"}`,
            `Estimated completion date: ${fields.estimatedCompletion ?? "not yet known"}`,
            `Order created: ${fields.createdDate}`,
            `Tailor / staff member handling order: ${order.conductedBy}`,
            `Collection location: ${SIGN_OFF}, ${ADDRESS}`,
          ].filter(Boolean);

          fallback = buildOrderTemplate(kind, fields);
          prompt = buildOrderPrompt(kind, dataLines);
        }
        break;
      }

      case "appointment-reminder": {
        const { appointmentId } = body;
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: { customer: true, orderForm: { include: { items: { orderBy: { sortOrder: "asc" } } } } },
        });
        if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

        const isFitting = ["FITTING", "SECOND_FITTING", "FINAL_FITTING"].includes(appointment.appointmentType);
        const isConsultationOrMtm = ["CONSULTATION", "MADE_TO_MEASURE"].includes(appointment.appointmentType);

        const garments = appointment.orderForm?.items?.length
          ? appointment.orderForm.items.map((it) => garmentTypeLabel(it.garmentType)).join(", ")
          : appointment.orderForm?.garmentType
          ? garmentTypeLabel(appointment.orderForm.garmentType)
          : null;

        const prepNote = isFitting
          ? "Ahead of your fitting, please wear the correct undergarments (e.g. the bra or shapewear you'd normally wear with this garment) and bring along the shoes you plan to wear with it, as both affect the fit."
          : isConsultationOrMtm
          ? "Ahead of your appointment, it would help to bring along any inspiration images, fabric ideas or style references you have in mind."
          : "";

        const fields = {
          to: appointment.customer.email || "",
          firstName: appointment.customer.firstName,
          customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
          appointmentType: appointmentTypeLabel(appointment.appointmentType),
          dateTime: formatDateTime(appointment.appointmentDate),
          dateOnly: formatDate(appointment.appointmentDate),
          location: appointment.location,
          prepNote,
          garments,
        };

        dataLines = [
          `Customer name: ${fields.customerName}`,
          `Customer email: ${appointment.customer.email || "(none on file)"}`,
          `Appointment type: ${fields.appointmentType}`,
          `Date and time: ${fields.dateTime}`,
          `Location: ${fields.location}`,
          garments ? `Related order garment(s): ${garments}` : "",
          appointment.notes ? `Notes: ${appointment.notes}` : "",
          prepNote ? `Prep instructions to include: ${prepNote}` : "",
        ].filter(Boolean);

        fallback = buildAppointmentTemplate(fields);
        prompt = `Write a friendly appointment reminder email to the customer below, to be sent ahead of their appointment at ${SIGN_OFF}.

${dataLines.join("\n")}

The email should confirm the date, time and location, and include the relevant preparation note. Keep it brief and warm. The subject line should reference the appointment date.`;
        break;
      }

      case "customer-follow-up":
      case "customer-new-collection": {
        const { customerId } = body;
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
          include: {
            orders: { orderBy: { createdAt: "desc" }, include: { items: { orderBy: { sortOrder: "asc" } } } },
            mtoOrders: { orderBy: { createdAt: "desc" }, include: { items: { orderBy: { sortOrder: "asc" } } } },
          },
        });
        if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

        const allGarments = [
          ...customer.orders.flatMap((o) =>
            o.items.length ? o.items.map((it) => garmentTypeLabel(it.garmentType)) : [garmentTypeLabel(o.garmentType)]
          ),
          ...customer.mtoOrders.flatMap((o) => o.items.map((it) => it.garmentName)),
        ].filter(Boolean);

        const allFabrics = [
          ...customer.orders.flatMap((o) =>
            o.items.map((it) => [it.fabricDescription, it.fabricColour].filter(Boolean).join(" "))
          ),
          ...customer.mtoOrders.flatMap((o) => o.items.map((it) => it.cloth)),
        ].filter(Boolean) as string[];

        const mostRecentMtm = customer.orders[0];
        const mostRecentMto = customer.mtoOrders[0];
        const mostRecentCollected =
          mostRecentMtm?.status === "DELIVERED"
            ? {
                type: "MTM",
                garments: mostRecentMtm.items.length
                  ? mostRecentMtm.items.map((it) => garmentTypeLabel(it.garmentType)).join(", ")
                  : garmentTypeLabel(mostRecentMtm.garmentType),
                date: mostRecentMtm.deliveredAt,
              }
            : mostRecentMto?.status === "COLLECTED"
            ? {
                type: "MTO",
                garments: mostRecentMto.items.map((it) => it.garmentName).join(", "),
                date: mostRecentMto.balancePaidDate,
              }
            : null;

        const uniqueGarments = Array.from(new Set(allGarments));
        const uniqueFabrics = Array.from(new Set(allFabrics));

        const fields = {
          to: customer.email || "",
          firstName: customer.firstName,
          customerName: `${customer.firstName} ${customer.lastName}`,
          garments: uniqueGarments,
          fabrics: uniqueFabrics,
          mostRecentCollected,
        };

        dataLines = [
          `Customer name: ${fields.customerName}`,
          `Customer email: ${customer.email || "(none on file)"}`,
          `Has bespoke block on file: ${customer.hasBlock ? "yes" : "no"}`,
          uniqueGarments.length ? `Garment types ordered previously: ${uniqueGarments.join(", ")}` : "No previous orders on file.",
          uniqueFabrics.length ? `Fabrics/cloths previously chosen: ${uniqueFabrics.join(", ")}` : "",
          mostRecentCollected
            ? `Most recently collected order: ${mostRecentCollected.type} — ${mostRecentCollected.garments}${mostRecentCollected.date ? ` (collected ${formatDate(mostRecentCollected.date)})` : ""}`
            : "No recently collected order on file.",
          `Collection location: ${SIGN_OFF}, ${ADDRESS}`,
        ].filter(Boolean);

        if (kind === "customer-follow-up") {
          fallback = buildFollowUpTemplate(fields);
          prompt = `Write a warm follow-up email to the customer below, checking in after they collected their order, asking how the garment is wearing and whether they're happy with the fit.

${dataLines.join("\n")}

If there is no recently collected order on file, write a general warm check-in instead, referencing their order history if any. Keep it short and personal.`;
        } else {
          fallback = buildNewCollectionTemplate(fields);
          prompt = `Write a short, personalised note to the customer below, introducing a new fabric or collection now available at ${SIGN_OFF}, tying it back to their previous order history (e.g. complementary to garments or fabrics they've chosen before) where possible.

${dataLines.join("\n")}

Keep it informative and personal, not salesy — like a tailor genuinely thinking of a returning customer. If there's no order history, write a general friendly note inviting them in to see what's new.`;
        }
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown draft kind" }, { status: 400 });
    }

    // Use the Anthropic API if a key is configured; otherwise fall back to a
    // plain template built from the same data, so the feature works for free.
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const draft = await generateWithAi(prompt);
        return NextResponse.json(draft);
      } catch (err) {
        console.error("Anthropic draft generation failed, using template fallback:", err);
        return NextResponse.json(fallback);
      }
    }

    return NextResponse.json(fallback);
  } catch (err) {
    console.error("Failed to generate email draft:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate draft" },
      { status: 500 }
    );
  }
}

function buildOrderPrompt(kind: string, dataLines: string[]): string {
  if (kind === "order-confirmation") {
    return `Write an order confirmation email to the customer below, confirming the details of their order, the deposit they've paid, and the estimated completion date.

${dataLines.join("\n")}

The subject line should reference the order confirmation.`;
  }
  if (kind === "order-ready") {
    return `Write an email to the customer below letting them know their garment is ready to collect, and reminding them of the balance due (if any) and the collection location.

${dataLines.join("\n")}

The subject line should make clear the order is ready for collection.`;
  }
  // chase-update
  return `Write a brief, polite email to the tailor/factory asking for a progress update on the order below. The recipient is internal/the tailor, not the customer, so do not address it as if writing to the customer — instead reference the customer's order by name. Leave the "to" field blank since the tailor's email isn't on file.

${dataLines.join("\n")}

The subject line should reference requesting a progress update for this order.`;
}

interface OrderFields {
  to: string;
  firstName: string;
  customerName: string;
  garments: string;
  fabrics: string;
  total: string | null;
  depositPaid: string | null;
  balanceDue: number | null;
  estimatedCompletion: string | null;
  createdDate: string;
}

function buildOrderTemplate(kind: string, f: OrderFields): Draft {
  if (kind === "order-confirmation") {
    const lines = [
      `Dear ${f.firstName},`,
      "",
      `Thank you for your order with Walker Slater. Please find your order details confirmed below:`,
      "",
      `Garment(s): ${f.garments}`,
      ...(f.fabrics ? [`Fabric: ${f.fabrics}`] : []),
      `Total (inc. VAT): ${f.total ?? "to be confirmed"}`,
      `Deposit paid: ${f.depositPaid ?? "none recorded"}`,
      `Estimated completion: ${f.estimatedCompletion ?? "to be confirmed"}`,
      "",
      `If you have any questions in the meantime, please do not hesitate to contact us on ${PHONE}.`,
      "",
      "Kind regards,",
      SIGN_OFF,
    ];
    return { to: f.to, subject: `Your Order Confirmation — ${f.garments}`, body: lines.join("\n") };
  }

  if (kind === "order-ready") {
    const balanceLine =
      f.balanceDue && f.balanceDue > 0
        ? `There is a balance of ${formatCurrency(f.balanceDue)} outstanding, which can be settled when you collect your order.`
        : "Your order is fully paid, so there is nothing further to settle.";
    const lines = [
      `Dear ${f.firstName},`,
      "",
      `We are pleased to let you know that your ${f.garments} has now returned from tailoring and is ready for collection from our studio at ${ADDRESS}.`,
      "",
      "We will hold your order for 14 days from this date.",
      "",
      balanceLine,
      "",
      `If you have a specific date you would like to collect your order, or have any questions before your visit, please call us on ${PHONE} and we will be happy to assist.`,
      "",
      "Thank you for choosing Walker Slater. We look forward to welcoming you back in-store soon.",
      "",
      "Kind regards,",
      SIGN_OFF,
    ];
    return { to: f.to, subject: `Your Walker Slater Order is Ready for Collection — ${f.garments}`, body: lines.join("\n") };
  }

  // chase-update — internal note to the tailor
  const lines = [
    `Hi,`,
    "",
    `Could you let us know how ${f.customerName}'s order (${f.garments}) is progressing?`,
    "",
    `Order placed: ${f.createdDate}`,
    `Estimated completion: ${f.estimatedCompletion ?? "not yet known"}`,
    "",
    "Please let us know if there's anything outstanding or if the timeline has changed.",
    "",
    "Kind regards,",
    SIGN_OFF,
  ];
  return { to: "", subject: `Progress Update Request — ${f.customerName} — ${f.garments}`, body: lines.join("\n") };
}

interface AppointmentFields {
  to: string;
  firstName: string;
  customerName: string;
  appointmentType: string;
  dateTime: string;
  dateOnly: string;
  location: string;
  prepNote: string;
  garments: string | null;
}

function buildAppointmentTemplate(f: AppointmentFields): Draft {
  const lines = [
    `Dear ${f.firstName},`,
    "",
    `This is a reminder of your upcoming ${f.appointmentType.toLowerCase()} appointment with us:`,
    "",
    `Date & time: ${f.dateTime}`,
    `Location: ${f.location}`,
    ...(f.garments ? [`Regarding: ${f.garments}`] : []),
    ...(f.prepNote ? ["", f.prepNote] : []),
    "",
    `If you need to amend your appointment time or have any questions before your visit, please feel free to call us directly on ${PHONE}, and we will be happy to assist you.`,
    "",
    "Thank you for choosing Walker Slater. We look forward to welcoming you in-store soon.",
    "",
    "Kind regards,",
    SIGN_OFF,
  ];
  return { to: f.to, subject: `Your Appointment at Walker Slater — ${f.dateOnly}`, body: lines.join("\n") };
}

interface CustomerFields {
  to: string;
  firstName: string;
  customerName: string;
  garments: string[];
  fabrics: string[];
  mostRecentCollected: { type: string; garments: string; date: Date | null } | null;
}

function buildFollowUpTemplate(f: CustomerFields): Draft {
  const garmentRef = f.mostRecentCollected?.garments ?? f.garments[0];
  const intro = garmentRef
    ? `We hope you're enjoying your ${garmentRef}.`
    : "We hope all is well.";
  const lines = [
    `Dear ${f.firstName},`,
    "",
    intro,
    "",
    `We'd love to hear how it's wearing and whether you're happy with the fit — please don't hesitate to get in touch or call us on ${PHONE} if anything needs adjusting.`,
    "",
    "Thank you for choosing Walker Slater. We look forward to welcoming you back in-store soon.",
    "",
    "Kind regards,",
    SIGN_OFF,
  ];
  return { to: f.to, subject: `Checking In — ${f.customerName}`, body: lines.join("\n") };
}

function buildNewCollectionTemplate(f: CustomerFields): Draft {
  const fabricRef = f.fabrics[0];
  const garmentRef = f.garments[0];
  const tieBack =
    fabricRef && garmentRef
      ? ` which we think would pair nicely with the ${fabricRef} you chose for your ${garmentRef}`
      : "";
  const lines = [
    `Dear ${f.firstName},`,
    "",
    `We wanted to let you know that some new fabrics have just arrived at the studio${tieBack}.`,
    "",
    `You're very welcome to visit us in-store to view them, or call us on ${PHONE} to arrange a personal appointment.`,
    "",
    "Thank you for choosing Walker Slater. We look forward to welcoming you soon.",
    "",
    "Kind regards,",
    SIGN_OFF,
  ];
  return { to: f.to, subject: `New Arrivals at Walker Slater Covent Garden`, body: lines.join("\n") };
}
