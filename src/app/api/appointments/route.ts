import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const upcoming = searchParams.get("upcoming");

  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(customerId ? { customerId } : {}),
      ...(upcoming ? { appointmentDate: { gte: now }, status: "SCHEDULED" } : {}),
    },
    orderBy: { appointmentDate: "asc" },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      orderForm: { select: { id: true, garmentType: true } },
    },
  });
  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const appointment = await prisma.appointment.create({
    data: {
      customerId: body.customerId,
      orderFormId: body.orderFormId || null,
      appointmentDate: new Date(body.appointmentDate),
      appointmentType: body.appointmentType,
      location: body.location ?? "19 Great Queen Street, London WC2B",
      conductedBy: body.conductedBy ?? "Carla",
      notes: body.notes || null,
      reminderSent: body.reminderSent ?? false,
      status: body.status ?? "SCHEDULED",
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json(appointment, { status: 201 });
}
