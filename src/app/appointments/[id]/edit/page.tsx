import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AppointmentFormComp from "@/components/AppointmentFormComp";

export const dynamic = "force-dynamic";

export default async function EditAppointmentPage({ params }: { params: { id: string } }) {
  const appt = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: { customer: true },
  });
  if (!appt) notFound();

  const customers = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });

  const orders = await prisma.orderForm.findMany({
    where: { customerId: appt.customerId },
    orderBy: { createdAt: "desc" },
    select: { id: true, garmentType: true, customerId: true },
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
          <Link href="/appointments" className="hover:text-gold">Appointments</Link> /
        </p>
        <h1 className="text-3xl font-medium text-green">Edit Appointment</h1>
      </div>
      <AppointmentFormComp
        customers={customers}
        orders={orders as never}
        existing={appt as never}
      />
    </div>
  );
}
