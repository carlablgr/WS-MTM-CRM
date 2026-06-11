import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { calculateMtoOrderTotals } from "@/lib/mtoUtils";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const order = await prisma.mtoOrder.findUnique({
    where: { id: params.id },
    include: { customer: true },
  });
  if (!order) return {};
  return { title: `MTO Order — ${order.customer.firstName} ${order.customer.lastName}` };
}

export default async function MtoOrderPrintPage({ params }: { params: { id: string } }) {
  const order = await prisma.mtoOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!order) notFound();

  const totals = calculateMtoOrderTotals(order.items.map((it) => Number(it.totalIncVat ?? 0)));
  const balanceDue = order.fullyPaid ? 0 : totals.grandTotal - Number(order.depositPaid ?? 0);

  return (
    <div className="print-doc">
      <PrintButton />

      <div className="pd-header">
        <div>
          <div className="pd-brand">Walker Slater</div>
          <div className="pd-title">Made to Order</div>
          <div className="pd-subtitle">{order.shop}</div>
        </div>
        <div className="pd-meta">
          <div>Date: {formatDate(order.date)}</div>
          <div>Staff Member: {order.conductedBy}</div>
          <div className="pd-badge" style={{ marginTop: 6 }}>Made to Order</div>
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-section-title">Customer Details</div>
        <div className="pd-grid">
          <div className="pd-field">
            <div className="pd-label">Full Name</div>
            <div className="pd-value">{order.customer.firstName} {order.customer.lastName}</div>
          </div>
          <div className="pd-field">
            <div className="pd-label">Phone</div>
            <div className="pd-value">{order.customer.phone || "—"}</div>
          </div>
          <div className="pd-field">
            <div className="pd-label">Address</div>
            <div className="pd-value">{order.customer.address || "—"}</div>
          </div>
          <div className="pd-field">
            <div className="pd-label">Email</div>
            <div className="pd-value">{order.customer.email || "—"}</div>
          </div>
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-section-title">Garment Details</div>
        <table>
          <thead>
            <tr>
              <th>Garment</th>
              <th>Block Size</th>
              <th>Cloth</th>
              <th>Lining</th>
              <th>Internal</th>
              <th>Accents</th>
              <th>Buttons</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.garmentName}</td>
                <td>{item.blockSize || "—"}</td>
                <td>{item.cloth || "—"}</td>
                <td>{item.lining || "—"}</td>
                <td>{item.internal || "—"}</td>
                <td>{item.accents || "—"}</td>
                <td>{item.buttons || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.notes && (
        <div className="pd-section">
          <div className="pd-section-title">Notes</div>
          <div className="pd-value">{order.notes}</div>
        </div>
      )}

      <div className="pd-section">
        <div className="pd-section-title">Payment Details</div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.garmentName}</td>
                <td>{item.totalIncVat ? `£${Number(item.totalIncVat).toFixed(2)}` : "—"}</td>
              </tr>
            ))}
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>£{totals.grandTotal.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div className="pd-grid" style={{ marginTop: 16 }}>
          <div className="pd-field">
            <div className="pd-label">Deposit (min. 50%)</div>
            <div className="pd-value">£{totals.depositRequired.toFixed(2)} required — £{Number(order.depositPaid ?? 0).toFixed(2)} paid</div>
          </div>
          <div className="pd-field">
            <div className="pd-label">Date Paid</div>
            <div className="pd-value">{order.depositPaidDate ? formatDate(order.depositPaidDate) : "—"}</div>
          </div>
          <div className="pd-field">
            <div className="pd-label">Balance</div>
            <div className="pd-value">£{Math.max(0, balanceDue).toFixed(2)}{order.fullyPaid ? " (fully paid)" : ""}</div>
          </div>
          <div className="pd-field">
            <div className="pd-label">Date Paid</div>
            <div className="pd-value">{order.balancePaidDate ? formatDate(order.balancePaidDate) : "—"}</div>
          </div>
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-section-title">MTO Progress</div>
        <div className="pd-grid">
          <div className="pd-field">
            <div className="pd-label">Date Required</div>
            <div className="pd-value">{order.dateRequired ? formatDate(order.dateRequired) : "—"}</div>
          </div>
          <div className="pd-field">
            <div className="pd-label">Submission Date</div>
            <div className="pd-value">{order.submissionDate ? formatDate(order.submissionDate) : "—"}</div>
          </div>
        </div>
      </div>

      <div className="pd-footer">
        <span>38 Great Queen Street, London WC2B 5AA</span>
        <span>walkerslatersaville.com</span>
      </div>
    </div>
  );
}
