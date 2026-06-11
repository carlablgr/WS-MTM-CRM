import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.orderForm.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (order.finalized) {
    return NextResponse.json({ ok: true, alreadyFinalized: true });
  }

  const updated = await prisma.orderForm.update({
    where: { id: params.id },
    data: { finalized: true },
  });

  return NextResponse.json({ ok: true, finalized: updated.finalized });
}
