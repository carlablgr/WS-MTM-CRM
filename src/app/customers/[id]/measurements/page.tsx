import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MeasurementsForm from "@/components/MeasurementsForm";

export const dynamic = "force-dynamic";

export default async function MeasurementsPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: { measurements: true },
  });
  if (!customer) notFound();

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
          <Link href="/customers" className="hover:text-gold">Customers</Link>{" "}
          /{" "}
          <Link href={`/customers/${customer.id}`} className="hover:text-gold">
            {customer.firstName} {customer.lastName}
          </Link>{" "}
          /
        </p>
        <h1 className="text-3xl font-medium text-green">Measurements</h1>
        <p className="text-sm text-green-muted mt-1">All measurements in inches</p>
      </div>
      <MeasurementsForm customerId={customer.id} measurements={customer.measurements as never} />
    </div>
  );
}
