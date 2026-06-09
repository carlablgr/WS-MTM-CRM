import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const pending = searchParams.get("pending");

  const reminders = await prisma.reminder.findMany({
    where: {
      ...(customerId ? { customerId } : {}),
      ...(pending === "true" ? { completed: false } : {}),
    },
    orderBy: { dueDate: "asc" },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      orderForm: { select: { id: true, garmentType: true } },
    },
  });
  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const reminder = await prisma.reminder.create({
    data: {
      customerId: body.customerId || null,
      orderFormId: body.orderFormId || null,
      dueDate: new Date(body.dueDate),
      type: body.type,
      description: body.description || null,
      completed: false,
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json(reminder, { status: 201 });
}
