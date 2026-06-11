import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MtoOrderFormWizard from "@/components/MtoOrderFormWizard";

export const dynamic = "force-dynamic";

export default async function EditMtoOrderPage({ params }: { params: { id: string } }) {
  const order = await prisma.mtoOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!order) notFound();

  const customersRaw = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
          <Link href="/mto-orders" className="hover:text-gold">MTO Orders</Link> /{" "}
          <Link href={`/mto-orders/${order.id}`} className="hover:text-gold">View</Link> /
        </p>
        <h1 className="text-3xl font-medium text-green">Edit MTO Order</h1>
      </div>
      <MtoOrderFormWizard customers={customersRaw} existing={order as never} />
    </div>
  );
}
