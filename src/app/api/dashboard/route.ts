import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalCustomers,
    activeOrders,
    ordersByStatus,
    upcomingAppointments,
    overdueReminders,
    recentCustomers,
    unpaidDepositOrders,
    unpaidBalanceOrders,
  ] = await Promise.all([
    prisma.customer.count(),

    prisma.orderForm.count({
      where: { status: { notIn: ["COMPLETE", "DELIVERED"] } },
    }),

    prisma.orderForm.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: now, lte: weekFromNow },
        status: "SCHEDULED",
      },
      orderBy: { appointmentDate: "asc" },
      take: 10,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),

    prisma.reminder.findMany({
      where: { completed: false, dueDate: { lt: now } },
      orderBy: { dueDate: "asc" },
      take: 10,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),

    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { orders: true } } },
    }),

    prisma.orderForm.findMany({
      where: {
        status: { notIn: ["DELIVERED"] },
        depositPaid: null,
        depositRequired: { gt: 0 },
      },
      select: {
        id: true,
        depositRequired: true,
        depositPaid: true,
        garmentType: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 20,
    }),

    prisma.orderForm.findMany({
      where: {
        fullyPaid: false,
        status: { in: ["COMPLETE", "DELIVERED", "FITTING_SCHEDULED"] },
      },
      select: {
        id: true,
        totalIncVat: true,
        depositPaid: true,
        garmentType: true,
        status: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    totalCustomers,
    activeOrders,
    ordersByStatus,
    upcomingAppointments,
    overdueReminders,
    recentCustomers,
    unpaidDepositOrders,
    unpaidBalanceOrders,
  });
}
