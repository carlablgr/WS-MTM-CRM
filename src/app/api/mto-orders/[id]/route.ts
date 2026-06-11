import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMtoItemData } from "@/lib/mtoOrderUtils";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.mtoOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const dec = (v: unknown) =>
    v !== undefined && v !== "" && v !== null ? parseFloat(String(v)) : null;

  await prisma.mtoOrderItem.deleteMany({ where: { mtoOrderId: params.id } });

  const order = await prisma.mtoOrder.update({
    where: { id: params.id },
    data: {
      conductedBy: body.conductedBy,
      date: body.date ? new Date(body.date) : undefined,
      shop: body.shop ?? "Covent Garden Ladieswear",
      depositPaid: dec(body.depositPaid),
      depositPaidDate: body.depositPaidDate ? new Date(body.depositPaidDate) : null,
      balancePaidDate: body.balancePaidDate ? new Date(body.balancePaidDate) : null,
      fullyPaid: body.fullyPaid ?? false,
      dateRequired: body.dateRequired ? new Date(body.dateRequired) : null,
      submissionDate: body.submissionDate ? new Date(body.submissionDate) : null,
      status: body.status,
      notes: body.notes || null,
      items: body.items?.length
        ? {
            create: body.items.map((item: Record<string, unknown>, i: number) =>
              buildMtoItemData(item, i)
            ),
          }
        : undefined,
    },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  return NextResponse.json(order);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.mtoOrder.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
