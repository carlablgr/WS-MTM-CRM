import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      measurements: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: { preConsultation: { select: { id: true, garmentType: true } } },
      },
      preConsultations: { orderBy: { createdAt: "desc" } },
      appointments: { orderBy: { appointmentDate: "asc" } },
      reminders: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      notes: body.notes || null,
      hasBlock: body.hasBlock,
      blockCreatedAt: body.blockCreatedAt ? new Date(body.blockCreatedAt) : null,
    },
  });
  return NextResponse.json(customer);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.customer.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
