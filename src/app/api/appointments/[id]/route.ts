import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const appt = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      orderForm: { select: { id: true, garmentType: true } },
    },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(appt);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const appt = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      orderFormId: body.orderFormId || null,
      appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : undefined,
      appointmentType: body.appointmentType,
      location: body.location,
      conductedBy: body.conductedBy,
      notes: body.notes || null,
      reminderSent: body.reminderSent,
      status: body.status,
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json(appt);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.appointment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
