import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PreConsultationFormComp from "@/components/PreConsultationFormComp";

export const dynamic = "force-dynamic";

export default async function EditPreConsultationPage({ params }: { params: { id: string } }) {
  const form = await prisma.preConsultationForm.findUnique({
    where: { id: params.id },
    include: { customer: true },
  });
  if (!form) notFound();

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
        <h1 className="text-3xl font-medium text-green">Edit Pre-Consultation Form</h1>
      </div>
      <PreConsultationFormComp customers={customers} existing={form} />
    </div>
  );
}
