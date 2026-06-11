import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEtaChaseEmail } from "@/lib/email/sendEtaChase";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 21);

  const orders = await prisma.orderForm.findMany({
    where: {
      status: "IN_PRODUCTION",
      etaReminderSent: false,
      createdAt: { lte: cutoff },
    },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  let sent = 0;
  for (const order of orders) {
    try {
      await sendEtaChaseEmail(order);
      await prisma.orderForm.update({
        where: { id: order.id },
        data: { etaReminderSent: true },
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send ETA chase email for order ${order.id}:`, err);
    }
  }

  return NextResponse.json({ checked: orders.length, sent });
}
