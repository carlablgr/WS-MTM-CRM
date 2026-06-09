import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerForm from "@/components/CustomerForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
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
        <h1 className="text-3xl font-medium text-green">Edit Customer</h1>
      </div>
      <CustomerForm customer={customer} />
    </div>
  );
}
