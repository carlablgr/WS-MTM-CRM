import { prisma } from "@/lib/prisma";
import Link from "next/link";
import MtoOrderFormWizard from "@/components/MtoOrderFormWizard";

export const dynamic = "force-dynamic";

export default async function NewMtoOrderPage({
  searchParams,
}: {
  searchParams: { customerId?: string };
}) {
  const customersRaw = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
          <Link href="/mto-orders" className="hover:text-gold">MTO Orders</Link> /
        </p>
        <h1 className="text-3xl font-medium text-green">New MTO Order</h1>
      </div>
      <MtoOrderFormWizard customers={customersRaw} defaultCustomerId={searchParams.customerId} />
    </div>
  );
}
