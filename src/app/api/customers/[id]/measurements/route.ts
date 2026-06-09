import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const measurements = await prisma.measurements.findUnique({
    where: { customerId: params.id },
  });
  return NextResponse.json(measurements ?? {});
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const decimalFields = [
    "height", "weight", "neck", "chest", "underChest", "waist", "highHip", "hip",
    "shoulderWidth", "shoulderToWaist", "shoulderToHip", "shoulderToKnee", "shoulderToFloor",
    "backLength", "sleeveLength", "sleeveWidth", "wristWidth", "frontChestWidth", "backChestWidth",
    "napeToWaist", "waistToHip", "waistToKnee", "waistToFloor", "thigh", "knee", "calf", "ankle",
    "inseam", "outseam", "rise", "trouserWidth", "skirtLength", "bustPointToBustPoint",
    "shoulderToBust", "underarm", "armhole", "necklineDepth",
  ];

  const data: Record<string, number | null> = {};
  for (const field of decimalFields) {
    const val = body[field];
    data[field] = val !== undefined && val !== "" && val !== null ? parseFloat(val) : null;
  }

  const measurements = await prisma.measurements.upsert({
    where: { customerId: params.id },
    create: { customerId: params.id, ...data },
    update: data,
  });

  return NextResponse.json(measurements);
}
