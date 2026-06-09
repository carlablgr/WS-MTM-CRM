import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const reminder = await prisma.reminder.update({
    where: { id: params.id },
    data: {
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      type: body.type,
      description: body.description || null,
      completed: body.completed,
      completedAt: body.completed ? new Date() : null,
    },
  });
  return NextResponse.json(reminder);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.reminder.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
