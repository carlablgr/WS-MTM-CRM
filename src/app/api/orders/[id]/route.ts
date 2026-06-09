import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildItemData } from "@/lib/orderUtils";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.orderForm.findUnique({
    where: { id: params.id },
    include: {
      customer: { include: { measurements: true } },
      preConsultation: true,
      items: { orderBy: { sortOrder: "asc" } },
      appointments: { orderBy: { appointmentDate: "asc" } },
      reminders: { where: { completed: false }, orderBy: { dueDate: "asc" } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const dec = (v: unknown) =>
    v !== undefined && v !== "" && v !== null ? parseFloat(String(v)) : null;

  // Delete existing items and recreate (simplest approach for small item counts)
  await prisma.orderItem.deleteMany({ where: { orderFormId: params.id } });

  const order = await prisma.orderForm.update({
    where: { id: params.id },
    data: {
      preConsultationId: body.preConsultationId || null,
      conductedBy: body.conductedBy,
      appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : null,
      garmentType: body.garmentType || null,
      blockFee: dec(body.blockFee),
      subtotalExVat: dec(body.subtotalExVat),
      vatAmount: dec(body.vatAmount),
      totalIncVat: dec(body.totalIncVat),
      depositRequired: dec(body.depositRequired),
      depositPaid: dec(body.depositPaid),
      depositPaidDate: body.depositPaidDate ? new Date(body.depositPaidDate) : null,
      balancePaidDate: body.balancePaidDate ? new Date(body.balancePaidDate) : null,
      fullyPaid: body.fullyPaid ?? false,
      status: body.status,
      estimatedCompletionDate: body.estimatedCompletionDate ? new Date(body.estimatedCompletionDate) : null,
      briefSentAt: body.briefSentAt ? new Date(body.briefSentAt) : null,
      fittingDate: body.fittingDate ? new Date(body.fittingDate) : null,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : null,
      internalNotes: body.internalNotes || null,
      items: body.items?.length
        ? {
            create: body.items.map((item: Record<string, unknown>, i: number) =>
              buildItemData(item, i)
            ),
          }
        : undefined,
    },
    include: {
      customer: { include: { measurements: true } },
      preConsultation: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  return NextResponse.json(order);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.orderForm.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
