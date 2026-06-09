import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildItemData } from "@/lib/orderUtils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");

  const orders = await prisma.orderForm.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(customerId ? { customerId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      items: { orderBy: { sortOrder: "asc" }, select: { id: true, garmentType: true } },
    },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const dec = (v: unknown) =>
    v !== undefined && v !== "" && v !== null ? parseFloat(String(v)) : null;

  const order = await prisma.orderForm.create({
    data: {
      customerId: body.customerId,
      preConsultationId: body.preConsultationId || null,
      conductedBy: body.conductedBy ?? "Carla",
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
      status: body.status ?? "CONSULTATION_BOOKED",
      estimatedCompletionDate: body.estimatedCompletionDate ? new Date(body.estimatedCompletionDate) : null,
      briefSentAt: body.briefSentAt ? new Date(body.briefSentAt) : null,
      fittingDate: body.fittingDate ? new Date(body.fittingDate) : null,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : null,
      internalNotes: body.internalNotes || null,
      // Create items inline
      items: body.items?.length
        ? {
            create: body.items.map((item: Record<string, unknown>, i: number) =>
              buildItemData(item, i)
            ),
          }
        : undefined,
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}

