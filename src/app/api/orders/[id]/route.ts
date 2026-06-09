import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.orderForm.findUnique({
    where: { id: params.id },
    include: {
      customer: { include: { measurements: true } },
      preConsultation: true,
      appointments: { orderBy: { appointmentDate: "asc" } },
      reminders: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const dec = (v: unknown) => (v !== undefined && v !== "" && v !== null ? parseFloat(String(v)) : null);

  const order = await prisma.orderForm.update({
    where: { id: params.id },
    data: {
      preConsultationId: body.preConsultationId || null,
      conductedBy: body.conductedBy,
      appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : null,
      garmentType: body.garmentType,
      fabricDescription: body.fabricDescription || null,
      fabricCode: body.fabricCode || null,
      fabricColour: body.fabricColour || null,
      fabricPricePerMetre: dec(body.fabricPricePerMetre),
      fabricMeterage: dec(body.fabricMeterage),
      lining: body.lining ?? false,
      liningColour: body.liningColour || null,
      liningDescription: body.liningDescription || null,
      buttons: body.buttons || null,
      buttonCount: body.buttonCount ? parseInt(body.buttonCount) : null,
      pockets: body.pockets || null,
      lapelStyle: body.lapelStyle || null,
      ventStyle: body.ventStyle || null,
      sleeveButtons: body.sleeveButtons ? parseInt(body.sleeveButtons) : null,
      waistbandStyle: body.waistbandStyle || null,
      hemStyle: body.hemStyle || null,
      additionalConstructionNotes: body.additionalConstructionNotes || null,
      useStoredMeasurements: body.useStoredMeasurements ?? true,
      measurementNotes: body.measurementNotes || null,
      sketchUrl: body.sketchUrl || null,
      inspirationImageUrls: body.inspirationImageUrls ?? null,
      fabricSwatchUrl: body.fabricSwatchUrl || null,
      makingRate: dec(body.makingRate),
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
      estimatedCompletionDate: body.estimatedCompletionDate
        ? new Date(body.estimatedCompletionDate)
        : null,
      briefSentAt: body.briefSentAt ? new Date(body.briefSentAt) : null,
      fittingDate: body.fittingDate ? new Date(body.fittingDate) : null,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : null,
      internalNotes: body.internalNotes || null,
    },
    include: {
      customer: { include: { measurements: true } },
      preConsultation: true,
    },
  });
  return NextResponse.json(order);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.orderForm.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
