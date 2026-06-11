import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnthropicClient, DRAFT_EMAIL_MODEL } from "@/lib/anthropic";
import { formatCurrency, formatDate, formatDateTime, garmentTypeLabel, appointmentTypeLabel } from "@/lib/format";
import { calculateMtoOrderTotals, mtoEstimatedArrival } from "@/lib/mtoUtils";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an assistant for Walker Slater Covent Garden, a bespoke and made-to-measure tailoring studio at 38 Great Queen Street, London WC2B 5AA.

You write short, warm, professional email drafts for staff to review, edit and send. The drafts are based on real customer and order data provided to you.

Rules:
- Warm, professional, personal tone — like a trusted tailor writing to a valued customer or colleague.
- No marketing language, no exclamation-mark enthusiasm, no sales pitches.
- Be concise — a few short paragraphs at most.
- Always sign off as "Walker Slater Covent Garden".
- Use only the facts provided. Do not invent dates, prices, or details that aren't given.
- If a piece of information (e.g. an email address) is missing, leave the "to" field blank.

Respond with ONLY a JSON object, no other text, in this exact shape:
{"to": "...", "subject": "...", "body": "..."}

The "body" should use \\n for line breaks (including a blank line between paragraphs and before/after the sign-off).`;

function extractJson(text: string): { to: string; subject: string; body: string } {
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

async function generateDraft(prompt: string) {
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { kind } = body;

  try {
    let prompt = "";

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

          const dataLines = [
            `Customer name: ${order.customer.firstName} ${order.customer.lastName}`,
            `Customer email: ${order.customer.email || "(none on file)"}`,
            `Order type: Made to Order (MTO)`,
            `Garment(s): ${garments}`,
            fabrics ? `Fabric/lining: ${fabrics}` : "",
            `Total inc. VAT: ${formatCurrency(totals.grandTotal)}`,
            `Deposit paid: ${order.depositPaid ? formatCurrency(Number(order.depositPaid)) : "none recorded"}`,
            `Balance due: ${formatCurrency(Math.max(0, balanceDue))}`,
            `Date required: ${order.dateRequired ? formatDate(order.dateRequired) : "not specified"}`,
            `Estimated arrival (guide): ${estimatedArrival ? formatDate(estimatedArrival) : "not yet known"}`,
            `Collection location: Walker Slater Covent Garden, 38 Great Queen Street, London WC2B 5AA`,
          ].filter(Boolean);

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

          const dataLines = [
            `Customer name: ${order.customer.firstName} ${order.customer.lastName}`,
            `Customer email: ${order.customer.email || "(none on file)"}`,
            `Order type: Made to Measure (MTM)`,
            `Garment(s): ${garments}`,
            fabrics ? `Fabric: ${fabrics}` : "",
            `Total inc. VAT: ${order.totalIncVat ? formatCurrency(Number(order.totalIncVat)) : "not yet finalised"}`,
            `Deposit required: ${order.depositRequired ? formatCurrency(Number(order.depositRequired)) : "not specified"}`,
            `Deposit paid: ${order.depositPaid ? formatCurrency(Number(order.depositPaid)) : "none recorded"}`,
            `Balance due: ${balanceDue !== null ? formatCurrency(Math.max(0, balanceDue)) : "to be confirmed"}`,
            `Estimated completion date: ${order.estimatedCompletionDate ? formatDate(order.estimatedCompletionDate) : "not yet known"}`,
            `Order created: ${formatDate(order.createdAt)}`,
            `Tailor / staff member handling order: ${order.conductedBy}`,
            `Collection location: Walker Slater Covent Garden, 38 Great Queen Street, London WC2B 5AA`,
          ].filter(Boolean);

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

        const dataLines = [
          `Customer name: ${appointment.customer.firstName} ${appointment.customer.lastName}`,
          `Customer email: ${appointment.customer.email || "(none on file)"}`,
          `Appointment type: ${appointmentTypeLabel(appointment.appointmentType)}`,
          `Date and time: ${formatDateTime(appointment.appointmentDate)}`,
          `Location: ${appointment.location}`,
          garments ? `Related order garment(s): ${garments}` : "",
          appointment.notes ? `Notes: ${appointment.notes}` : "",
          isConsultationOrMtm
            ? "Prep instructions to include: ask the customer to bring along any inspiration images, fabric ideas or style references they have in mind."
            : "",
          isFitting
            ? "Prep instructions to include: ask the customer to wear the correct undergarments (e.g. appropriate bra/shapewear) and to bring the shoes they intend to wear with the garment, as fit is affected by both."
            : "",
        ].filter(Boolean);

        prompt = `Write a friendly appointment reminder email to the customer below, to be sent ahead of their appointment at Walker Slater Covent Garden.

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
            ? { type: "MTM", garments: mostRecentMtm.items.length ? mostRecentMtm.items.map((it) => garmentTypeLabel(it.garmentType)).join(", ") : garmentTypeLabel(mostRecentMtm.garmentType), date: mostRecentMtm.deliveredAt }
            : mostRecentMto?.status === "COLLECTED"
            ? { type: "MTO", garments: mostRecentMto.items.map((it) => it.garmentName).join(", "), date: mostRecentMto.balancePaidDate }
            : null;

        const dataLines = [
          `Customer name: ${customer.firstName} ${customer.lastName}`,
          `Customer email: ${customer.email || "(none on file)"}`,
          `Has bespoke block on file: ${customer.hasBlock ? "yes" : "no"}`,
          allGarments.length ? `Garment types ordered previously: ${Array.from(new Set(allGarments)).join(", ")}` : "No previous orders on file.",
          allFabrics.length ? `Fabrics/cloths previously chosen: ${Array.from(new Set(allFabrics)).join(", ")}` : "",
          mostRecentCollected
            ? `Most recently collected order: ${mostRecentCollected.type} — ${mostRecentCollected.garments}${mostRecentCollected.date ? ` (collected ${formatDate(mostRecentCollected.date)})` : ""}`
            : "No recently collected order on file.",
          `Collection location: Walker Slater Covent Garden, 38 Great Queen Street, London WC2B 5AA`,
        ].filter(Boolean);

        if (kind === "customer-follow-up") {
          prompt = `Write a warm follow-up email to the customer below, checking in after they collected their order, asking how the garment is wearing and whether they're happy with the fit.

${dataLines.join("\n")}

If there is no recently collected order on file, write a general warm check-in instead, referencing their order history if any. Keep it short and personal.`;
        } else {
          prompt = `Write a short, personalised note to the customer below, introducing a new fabric or collection now available at Walker Slater Covent Garden, tying it back to their previous order history (e.g. complementary to garments or fabrics they've chosen before) where possible.

${dataLines.join("\n")}

Keep it informative and personal, not salesy — like a tailor genuinely thinking of a returning customer. If there's no order history, write a general friendly note inviting them in to see what's new.`;
        }
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown draft kind" }, { status: 400 });
    }

    const draft = await generateDraft(prompt);
    return NextResponse.json(draft);
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
