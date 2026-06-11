import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lightweight endpoint for changing just the MTO order status (e.g. from
// the order detail page) without touching items or other fields.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (!body.status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const order = await prisma.mtoOrder.update({
    where: { id: params.id },
    data: { status: body.status },
  });
  return NextResponse.json(order);
}
