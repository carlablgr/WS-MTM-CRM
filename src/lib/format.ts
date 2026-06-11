export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (Number.isNaN(n)) return "£0.00";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function garmentTypeLabel(type: string | null | undefined): string {
  if (!type) return "—";
  const map: Record<string, string> = {
    JACKET: "Jacket",
    TROUSERS: "Trousers",
    SKIRT: "Skirt",
    WAISTCOAT: "Waistcoat",
    THREE_QUARTER_COAT: "¾ Coat",
    FULL_LENGTH_COAT: "Full Length Coat",
  };
  return map[type] ?? type;
}

export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    CONSULTATION_BOOKED: "Consultation Booked",
    DEPOSIT_TAKEN: "Deposit Taken",
    BRIEF_SENT_TO_TAILOR: "Brief Sent to Tailor",
    IN_PRODUCTION: "In Production",
    FITTING_SCHEDULED: "Fitting Scheduled",
    COMPLETE: "Complete",
    DELIVERED: "Delivered",
  };
  return map[status] ?? status;
}

export function orderStatusColor(status: string): string {
  const map: Record<string, string> = {
    CONSULTATION_BOOKED: "bg-stone-100 text-stone-700",
    DEPOSIT_TAKEN: "bg-amber-50 text-amber-800",
    BRIEF_SENT_TO_TAILOR: "bg-blue-50 text-blue-800",
    IN_PRODUCTION: "bg-indigo-50 text-indigo-800",
    FITTING_SCHEDULED: "bg-purple-50 text-purple-800",
    COMPLETE: "bg-green-50 text-green-800",
    DELIVERED: "bg-emerald-50 text-emerald-800",
  };
  return map[status] ?? "bg-stone-100 text-stone-700";
}

export function preConsultationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "Draft",
    SENT_TO_CUSTOMER: "Sent to Customer",
    COMPLETED: "Completed",
  };
  return map[status] ?? status;
}

export function appointmentTypeLabel(type: string): string {
  const map: Record<string, string> = {
    CONSULTATION: "Consultation",
    MADE_TO_MEASURE: "Made to Measure",
    FITTING: "Fitting",
    SECOND_FITTING: "Second Fitting",
    FINAL_FITTING: "Final Fitting",
  };
  return map[type] ?? type;
}

export function appointmentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    NO_SHOW: "No Show",
  };
  return map[status] ?? status;
}

export function mtoStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DEPOSIT_TAKEN: "Deposit Taken",
    SUBMITTED_TO_FACTORY: "Submitted to Factory",
    IN_PRODUCTION: "In Production",
    ARRIVED: "Arrived",
    COLLECTED: "Collected",
  };
  return map[status] ?? status;
}

export function mtoStatusColor(status: string): string {
  const map: Record<string, string> = {
    DEPOSIT_TAKEN: "bg-amber-50 text-amber-800",
    SUBMITTED_TO_FACTORY: "bg-blue-50 text-blue-800",
    IN_PRODUCTION: "bg-indigo-50 text-indigo-800",
    ARRIVED: "bg-purple-50 text-purple-800",
    COLLECTED: "bg-emerald-50 text-emerald-800",
  };
  return map[status] ?? "bg-stone-100 text-stone-700";
}

export function reminderTypeLabel(type: string): string {
  const map: Record<string, string> = {
    FOLLOW_UP_WITH_CUSTOMER: "Follow Up with Customer",
    CHASE_ANTHONY: "Chase Tailor",
    FITTING_TO_BOOK: "Fitting to Book",
    BALANCE_PAYMENT_DUE: "Balance Payment Due",
    ORDER_READY_TO_COLLECT: "Order Ready to Collect",
    CUSTOM: "Custom",
  };
  return map[type] ?? type;
}
