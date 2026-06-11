import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lightweight endpoint for changing just the order status (e.g. from the
// order detail page) without touching items or other fields.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (!body.status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const data: Record<string, unknown> = { status: body.status };

  // Auto-stamp relevant timeline dates the first time a status is reached.
  const existing = await prisma.orderForm.findUnique({
    where: { id: params.id },
    select: {
      briefSentAt: true,
      fittingDate: true,
      completedAt: true,
      deliveredAt: true,
    },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  if (body.status === "BRIEF_SENT_TO_TAILOR" && !existing.briefSentAt) {
    data.briefSentAt = now;
  }
  if (body.status === "COMPLETE" && !existing.completedAt) {
    data.completedAt = now;
  }
  if (body.status === "DELIVERED" && !existing.deliveredAt) {
    data.deliveredAt = now;
  }

  const order = await prisma.orderForm.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(order);
}
