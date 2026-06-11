import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const form = await prisma.preConsultationForm.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (form.finalized) {
    return NextResponse.json({ ok: true, alreadyFinalized: true });
  }

  const updated = await prisma.preConsultationForm.update({
    where: { id: params.id },
    data: { finalized: true },
  });

  return NextResponse.json({ ok: true, finalized: updated.finalized });
}
