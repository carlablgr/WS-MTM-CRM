import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  garmentTypeLabel,
  orderStatusLabel,
  orderStatusColor,
  appointmentTypeLabel,
  appointmentStatusLabel,
  reminderTypeLabel,
  preConsultationStatusLabel,
  mtoStatusLabel,
  mtoStatusColor,
} from "@/lib/format";
import { calculateMtoOrderTotals } from "@/lib/mtoUtils";
import CustomerActions from "@/components/CustomerActions";
import NewOrderMenu from "@/components/NewOrderMenu";
import DraftEmailButton from "@/components/DraftEmailButton";

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      measurements: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: { preConsultation: { select: { id: true } } },
      },
      mtoOrders: {
        orderBy: { createdAt: "desc" },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      },
      preConsultations: { orderBy: { createdAt: "desc" } },
      appointments: { orderBy: { appointmentDate: "asc" } },
      reminders: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!customer) notFound();

  const measurementFields: [string, string][] = [
    ["height", "Height"], ["weight", "Weight"], ["chest", "Chest"], ["underChest", "Under Chest"],
    ["waist", "Waist"], ["highHip", "High Hip"], ["hip", "Hip"], ["shoulderWidth", "Shoulder Width"],
    ["shoulderToWaist", "Shoulder to Waist"], ["shoulderToHip", "Shoulder to Hip"],
    ["shoulderToKnee", "Shoulder to Knee"], ["shoulderToFloor", "Shoulder to Floor"],
    ["backLength", "Back Length"], ["sleeveLength", "Sleeve Length"], ["sleeveWidth", "Sleeve Width"],
    ["wristWidth", "Wrist Width"], ["frontChestWidth", "Front Chest Width"],
    ["backChestWidth", "Back Chest Width"], ["napeToWaist", "Nape to Waist"],
    ["neck", "Neck"], ["bustPointToBustPoint", "Bust Point to Bust Point"],
    ["shoulderToBust", "Shoulder to Bust"], ["underarm", "Underarm"],
    ["armhole", "Armhole"], ["necklineDepth", "Neckline Depth"],
    ["waistToHip", "Waist to Hip"], ["waistToKnee", "Waist to Knee"],
    ["waistToFloor", "Waist to Floor"], ["thigh", "Thigh"], ["knee", "Knee"],
    ["calf", "Calf"], ["ankle", "Ankle"], ["inseam", "Inseam"], ["outseam", "Outseam"],
    ["rise", "Rise"], ["trouserWidth", "Trouser Width"], ["skirtLength", "Skirt Length"],
  ];

  const m = customer.measurements as Record<string, unknown> | null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
            <Link href="/customers" className="hover:text-gold">Customers</Link> /
          </p>
          <h1 className="text-3xl font-medium text-green">
            {customer.firstName} {customer.lastName}
          </h1>
          {customer.hasBlock && (
            <span className="inline-block mt-2 text-xs bg-green text-cream px-2 py-0.5 uppercase tracking-widest">
              Block Cut
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DraftEmailButton
            label="Draft Email"
            options={[
              { label: "Follow Up", kind: "customer-follow-up" },
              { label: "New Collection", kind: "customer-new-collection" },
            ]}
            payload={{ customerId: customer.id }}
          />
          <CustomerActions customerId={customer.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Contact details */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Contact Details</h2>
            <dl className="space-y-3">
              {customer.email && (
                <div>
                  <dt className="text-xs text-green-muted">Email</dt>
                  <dd className="text-sm text-green">{customer.email}</dd>
                </div>
              )}
              {customer.phone && (
                <div>
                  <dt className="text-xs text-green-muted">Phone</dt>
                  <dd className="text-sm text-green">{customer.phone}</dd>
                </div>
              )}
              {customer.address && (
                <div>
                  <dt className="text-xs text-green-muted">Address</dt>
                  <dd className="text-sm text-green whitespace-pre-line">{customer.address}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-green-muted">Added</dt>
                <dd className="text-sm text-green">{formatDate(customer.createdAt)}</dd>
              </div>
              {customer.blockCreatedAt && (
                <div>
                  <dt className="text-xs text-green-muted">Block Created</dt>
                  <dd className="text-sm text-green">{formatDate(customer.blockCreatedAt)}</dd>
                </div>
              )}
            </dl>
            {customer.notes && (
              <div className="mt-4 pt-4 border-t border-cream-dark">
                <dt className="text-xs text-green-muted mb-1">Notes</dt>
                <dd className="text-sm text-green whitespace-pre-line">{customer.notes}</dd>
              </div>
            )}
            <div className="mt-4">
              <Link href={`/customers/${customer.id}/edit`} className="text-xs text-gold hover:underline">
                Edit details →
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/pre-consultation/new?customerId=${customer.id}`}
                className="block w-full btn-secondary text-center text-sm"
              >
                New Pre-Consultation
              </Link>
              <NewOrderMenu customerId={customer.id} />
              <Link
                href={`/appointments/new?customerId=${customer.id}`}
                className="block w-full btn-secondary text-center text-sm"
              >
                New Appointment
              </Link>
              <Link
                href={`/reminders/new?customerId=${customer.id}`}
                className="block w-full btn-secondary text-center text-sm"
              >
                New Reminder
              </Link>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Measurements summary */}
          <div className="bg-white border border-cream-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Measurements</h2>
              <Link
                href={`/customers/${customer.id}/measurements`}
                className="text-xs text-gold hover:underline"
              >
                {m ? "Edit →" : "Add measurements →"}
              </Link>
            </div>
            {m ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                {measurementFields.map(([key, label]) => {
                  const val = m[key];
                  if (!val) return null;
                  return (
                    <div key={key} className="flex justify-between text-sm border-b border-cream-dark pb-1">
                      <span className="text-green-muted text-xs">{label}</span>
                      <span className="text-green font-medium">{String(val)}&Prime;</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-green-muted">No measurements recorded yet.</p>
            )}
          </div>

          {/* MTM Orders */}
          <div className="bg-white border border-cream-dark">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
              <h2 className="section-title mb-0">MTM Orders ({customer.orders.length})</h2>
              <Link
                href={`/orders/new?customerId=${customer.id}`}
                className="text-xs text-gold hover:underline"
              >
                New MTM order →
              </Link>
            </div>
            {customer.orders.length === 0 ? (
              <div className="px-6 py-6 text-sm text-green-muted">No MTM orders yet.</div>
            ) : (
              <ul className="divide-y divide-cream-dark">
                {customer.orders.map((o) => (
                  <li key={o.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green">
                        {garmentTypeLabel(o.garmentType)}
                      </div>
                      <div className="text-xs text-green-muted mt-0.5">
                        {formatDate(o.createdAt)}
                        {o.totalIncVat ? ` · ${formatCurrency(Number(o.totalIncVat))} inc. VAT` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 ${orderStatusColor(o.status)}`}>
                        {orderStatusLabel(o.status)}
                      </span>
                      <Link href={`/orders/${o.id}`} className="text-xs text-gold hover:underline">
                        View →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* MTO Orders */}
          <div className="bg-white border border-cream-dark">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
              <h2 className="section-title mb-0">MTO Orders ({customer.mtoOrders.length})</h2>
              <Link
                href={`/mto-orders/new?customerId=${customer.id}`}
                className="text-xs text-gold hover:underline"
              >
                New MTO order →
              </Link>
            </div>
            {customer.mtoOrders.length === 0 ? (
              <div className="px-6 py-6 text-sm text-green-muted">No MTO orders yet.</div>
            ) : (
              <ul className="divide-y divide-cream-dark">
                {customer.mtoOrders.map((o) => {
                  const totals = calculateMtoOrderTotals(o.items.map((it) => Number(it.totalIncVat ?? 0)));
                  return (
                    <li key={o.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-green">
                          {o.items.map((it) => it.garmentName).join(", ") || "MTO Order"}
                        </div>
                        <div className="text-xs text-green-muted mt-0.5">
                          {formatDate(o.createdAt)} · {formatCurrency(totals.grandTotal)} inc. VAT
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 ${mtoStatusColor(o.status)}`}>
                          {mtoStatusLabel(o.status)}
                        </span>
                        <Link href={`/mto-orders/${o.id}`} className="text-xs text-gold hover:underline">
                          View →
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pre-consultation forms */}
          {customer.preConsultations.length > 0 && (
            <div className="bg-white border border-cream-dark">
              <div className="px-6 py-4 border-b border-cream-dark">
                <h2 className="section-title mb-0">Pre-Consultation Forms</h2>
              </div>
              <ul className="divide-y divide-cream-dark">
                {customer.preConsultations.map((f) => (
                  <li key={f.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green">
                        {f.garmentType ? garmentTypeLabel(f.garmentType) : "General"}
                      </div>
                      <div className="text-xs text-green-muted mt-0.5">{formatDate(f.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-green-muted">
                        {preConsultationStatusLabel(f.status)}
                      </span>
                      <Link href={`/pre-consultation/${f.id}`} className="text-xs text-gold hover:underline">
                        View →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Appointments */}
          {customer.appointments.length > 0 && (
            <div className="bg-white border border-cream-dark">
              <div className="px-6 py-4 border-b border-cream-dark">
                <h2 className="section-title mb-0">Appointments</h2>
              </div>
              <ul className="divide-y divide-cream-dark">
                {customer.appointments.map((a) => (
                  <li key={a.id} className="px-6 py-4">
                    <div className="text-sm font-medium text-green">
                      {appointmentTypeLabel(a.appointmentType)}
                    </div>
                    <div className="text-xs text-green-muted mt-0.5">
                      {formatDateTime(a.appointmentDate)} · {appointmentStatusLabel(a.status)}
                    </div>
                    {a.notes && <div className="text-xs text-green-muted/70 mt-1">{a.notes}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reminders */}
          {customer.reminders.length > 0 && (
            <div className="bg-white border border-cream-dark">
              <div className="px-6 py-4 border-b border-cream-dark">
                <h2 className="section-title mb-0">Reminders</h2>
              </div>
              <ul className="divide-y divide-cream-dark">
                {customer.reminders.map((r) => (
                  <li key={r.id} className={`px-6 py-4 ${r.completed ? "opacity-50" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-green">{reminderTypeLabel(r.type)}</div>
                      <div className="text-xs text-green-muted">Due {formatDate(r.dueDate)}</div>
                    </div>
                    {r.description && (
                      <div className="text-xs text-green-muted mt-1">{r.description}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
