import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, reminderTypeLabel } from "@/lib/format";
import RemindersClient from "@/components/RemindersClient";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const reminders = await prisma.reminder.findMany({
    where: { completed: false },
    orderBy: { dueDate: "asc" },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      orderForm: { select: { id: true, garmentType: true } },
    },
  });

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">Made to Measure</p>
          <h1 className="text-3xl font-medium text-green">Reminders & Tasks</h1>
        </div>
        <Link href="/reminders/new" className="btn-primary">
          + New Reminder
        </Link>
      </div>

      <RemindersClient reminders={reminders as never} />
    </div>
  );
}
