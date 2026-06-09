import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import OrderFormWizard from "@/components/OrderFormWizard";

export const dynamic = "force-dynamic";

export default async function EditOrderPage({ params }: { params: { id: string } }) {
  const order = await prisma.orderForm.findUnique({
    where: { id: params.id },
    include: { customer: { include: { measurements: true } } },
  });
  if (!order) notFound();

  const customersRaw = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
    include: { measurements: true },
  });
  const customers = customersRaw.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    hasBlock: c.hasBlock,
    measurements: c.measurements,
  }));

  const preConsultations = await prisma.preConsultationForm.findMany({
    where: { customerId: order.customerId },
    orderBy: { createdAt: "desc" },
    select: { id: true, customerId: true, garmentType: true, occasionOrPurpose: true },
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
          <Link href="/orders" className="hover:text-gold">Orders</Link> /{" "}
          <Link href={`/orders/${order.id}`} className="hover:text-gold">View</Link> /
        </p>
        <h1 className="text-3xl font-medium text-green">Edit Order</h1>
      </div>
      <OrderFormWizard
        customers={customers}
        preConsultations={preConsultations}
        existing={order as never}
      />
    </div>
  );
}
