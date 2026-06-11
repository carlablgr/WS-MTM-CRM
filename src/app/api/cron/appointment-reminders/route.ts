import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentReminderEmail } from "@/lib/email/sendAppointmentReminder";

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

  // Appointments happening in exactly 2 days' time
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 2);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      reminderSent: false,
      status: "SCHEDULED",
      appointmentDate: { gte: startOfDay, lte: endOfDay },
    },
    include: { customer: true },
  });

  let sent = 0;
  for (const appointment of appointments) {
    if (!appointment.customer.email) {
      console.error(`Skipping appointment ${appointment.id}: customer has no email`);
      continue;
    }
    try {
      await sendAppointmentReminderEmail(appointment);
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSent: true },
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send appointment reminder for ${appointment.id}:`, err);
    }
  }

  return NextResponse.json({ checked: appointments.length, sent });
}
