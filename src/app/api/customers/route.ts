import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { lastName: "asc" },
    include: {
      _count: { select: { orders: true } },
      measurements: { select: { updatedAt: true } },
    },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const customer = await prisma.customer.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      notes: body.notes || null,
      hasBlock: body.hasBlock ?? false,
      blockCreatedAt: body.blockCreatedAt ? new Date(body.blockCreatedAt) : null,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
