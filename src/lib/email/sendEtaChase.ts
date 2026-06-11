import { resend, FROM_EMAIL, STUDIO_EMAIL } from "@/lib/resend";
import { renderEmailLayout, field, paragraph } from "./layout";
import { formatDate, garmentTypeLabel } from "@/lib/format";
import type { Customer, OrderForm, OrderItem } from "@prisma/client";

type OrderWithDetails = OrderForm & {
  customer: Customer;
  items: OrderItem[];
};

export async function sendEtaChaseEmail(order: OrderWithDetails) {
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
  const garmentSummary = order.items.length
    ? order.items.map((it) => garmentTypeLabel(it.garmentType)).join(", ")
    : garmentTypeLabel(order.garmentType);

  const bodyHtml =
    paragraph("This order has been in production for 21 days. Please check the ETA with the Tailor and update the customer.") +
    field("Customer", customerName) +
    field("Garment Type", garmentSummary) +
    field("Order Date", formatDate(order.createdAt)) +
    field("Estimated Completion", formatDate(order.estimatedCompletionDate)) +
    field("Customer Email", order.customer.email || "—") +
    field("Customer Phone", order.customer.phone || "—");

  const html = renderEmailLayout({
    heading: `Chase Tailor — ${customerName} — ${garmentSummary}`,
    bodyHtml,
  });

  await resend.emails.send({
    from: FROM_EMAIL,
    to: STUDIO_EMAIL,
    subject: `Chase Tailor — ${customerName} — ${garmentSummary}`,
    html,
  });
}
