import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const forms = await prisma.preConsultationForm.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json(forms);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const form = await prisma.preConsultationForm.create({
    data: {
      customerId: body.customerId,
      completedBy: body.completedBy ?? "Carla",
      occasionOrPurpose: body.occasionOrPurpose || null,
      garmentType: body.garmentType || null,
      stylePreferences: body.stylePreferences || null,
      fabricPreferences: body.fabricPreferences || null,
      inspirationNotes: body.inspirationNotes || null,
      budgetRange: body.budgetRange || null,
      existingFitIssues: body.existingFitIssues || null,
      additionalNotes: body.additionalNotes || null,
      status: body.status ?? "DRAFT",
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json(form, { status: 201 });
}
