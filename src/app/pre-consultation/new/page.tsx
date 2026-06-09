import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PreConsultationFormComponent from "@/components/PreConsultationFormComp";

export const dynamic = "force-dynamic";

export default async function NewPreConsultationPage({
  searchParams,
}: {
  searchParams: { customerId?: string };
}) {
  const customers = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
          <Link href="/pre-consultation" className="hover:text-gold">Pre-Consultations</Link> /
        </p>
        <h1 className="text-3xl font-medium text-green">New Pre-Consultation Form</h1>
      </div>
      <PreConsultationFormComponent
        customers={customers}
        defaultCustomerId={searchParams.customerId}
      />
    </div>
  );
}
