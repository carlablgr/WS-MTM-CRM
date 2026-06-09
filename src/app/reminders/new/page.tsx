import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReminderFormComp from "@/components/ReminderFormComp";

export const dynamic = "force-dynamic";

export default async function NewReminderPage({
  searchParams,
}: {
  searchParams: { customerId?: string; orderId?: string };
}) {
  const customers = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });

  const orders = await prisma.orderForm.findMany({
    where: searchParams.customerId ? { customerId: searchParams.customerId } : undefined,
    orderBy: { createdAt: "desc" },
    select: { id: true, garmentType: true, customerId: true },
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
          <Link href="/reminders" className="hover:text-gold">Reminders</Link> /
        </p>
        <h1 className="text-3xl font-medium text-green">New Reminder</h1>
      </div>
      <ReminderFormComp
        customers={customers}
        orders={orders as never}
        defaultCustomerId={searchParams.customerId}
        defaultOrderId={searchParams.orderId}
      />
    </div>
  );
}
