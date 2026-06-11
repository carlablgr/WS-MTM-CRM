import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMtoItemData } from "@/lib/mtoOrderUtils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const orders = await prisma.mtoOrder.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(search
        ? {
            customer: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const dec = (v: unknown) =>
    v !== undefined && v !== "" && v !== null ? parseFloat(String(v)) : null;

  const order = await prisma.mtoOrder.create({
    data: {
      customerId: body.customerId,
      conductedBy: body.conductedBy ?? "Carla",
      date: body.date ? new Date(body.date) : undefined,
      shop: body.shop ?? "Covent Garden Ladieswear",
      depositPaid: dec(body.depositPaid),
      depositPaidDate: body.depositPaidDate ? new Date(body.depositPaidDate) : null,
      balancePaidDate: body.balancePaidDate ? new Date(body.balancePaidDate) : null,
      fullyPaid: body.fullyPaid ?? false,
      dateRequired: body.dateRequired ? new Date(body.dateRequired) : null,
      submissionDate: body.submissionDate ? new Date(body.submissionDate) : null,
      status: body.status ?? "DEPOSIT_TAKEN",
      notes: body.notes || null,
      items: body.items?.length
        ? {
            create: body.items.map((item: Record<string, unknown>, i: number) =>
              buildMtoItemData(item, i)
            ),
          }
        : undefined,
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
