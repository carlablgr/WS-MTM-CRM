import { prisma } from "@/lib/prisma";
import Link from "next/link";
import OrderFormWizard from "@/components/OrderFormWizard";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: { customerId?: string; preConsultationId?: string };
}) {
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
    where: searchParams.customerId ? { customerId: searchParams.customerId } : undefined,
    orderBy: { createdAt: "desc" },
    select: { id: true, customerId: true, garmentType: true, occasionOrPurpose: true },
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
          <Link href="/orders" className="hover:text-gold">Orders</Link> /
        </p>
        <h1 className="text-3xl font-medium text-green">New Order</h1>
      </div>
      <OrderFormWizard
        customers={customers}
        preConsultations={preConsultations}
        defaultCustomerId={searchParams.customerId}
        defaultPreConsultationId={searchParams.preConsultationId}
      />
    </div>
  );
}
