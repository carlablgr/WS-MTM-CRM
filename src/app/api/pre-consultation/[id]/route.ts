import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const form = await prisma.preConsultationForm.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
    },
  });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(form);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const form = await prisma.preConsultationForm.update({
    where: { id: params.id },
    data: {
      completedBy: body.completedBy,
      occasionOrPurpose: body.occasionOrPurpose || null,
      garmentType: body.garmentType || null,
      stylePreferences: body.stylePreferences || null,
      fabricPreferences: body.fabricPreferences || null,
      inspirationNotes: body.inspirationNotes || null,
      budgetRange: body.budgetRange || null,
      existingFitIssues: body.existingFitIssues || null,
      additionalNotes: body.additionalNotes || null,
      status: body.status,
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json(form);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.preConsultationForm.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
