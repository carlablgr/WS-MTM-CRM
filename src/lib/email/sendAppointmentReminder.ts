import { sendMail, STUDIO_EMAIL } from "@/lib/mailer";
import { renderEmailLayout, paragraph, field } from "./layout";
import { formatDate } from "@/lib/format";
import type { Appointment, Customer } from "@prisma/client";

type AppointmentWithCustomer = Appointment & {
  customer: Customer;
};

export async function sendAppointmentReminderEmail(appointment: AppointmentWithCustomer) {
  if (!appointment.customer.email) {
    throw new Error(`Customer ${appointment.customer.id} has no email address`);
  }

  const time = appointment.appointmentDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let prepHtml = "";
  if (appointment.appointmentType === "CONSULTATION" || appointment.appointmentType === "MADE_TO_MEASURE") {
    prepHtml = paragraph(
      "Ahead of your appointment, it would help to think about any fabric preferences, style references, or inspiration you'd like to bring along."
    );
  } else if (
    appointment.appointmentType === "FITTING" ||
    appointment.appointmentType === "SECOND_FITTING" ||
    appointment.appointmentType === "FINAL_FITTING"
  ) {
    prepHtml = paragraph(
      "For your fitting, please wear a well-fitted bra and bring the shoes, or heel height, you plan to wear with the garment."
    );
  }

  const bodyHtml =
    paragraph("This is a reminder of your upcoming appointment with Walker Slater.") +
    field("Date", formatDate(appointment.appointmentDate)) +
    field("Time", time) +
    field("Location", appointment.location) +
    prepHtml +
    paragraph("If you need to reschedule, please reply to this email or contact Carla directly.") +
    paragraph("Looking forward to seeing you.") +
    paragraph("Walker Slater Covent Garden");

  const html = renderEmailLayout({
    heading: `Your appointment at Walker Slater — ${formatDate(appointment.appointmentDate)}`,
    bodyHtml,
  });

  await sendMail({
    to: appointment.customer.email,
    cc: STUDIO_EMAIL,
    subject: `Your appointment at Walker Slater — ${formatDate(appointment.appointmentDate)}`,
    html,
  });
}
