import { Resend } from "resend";

let _resend: Resend | null = null;

// Lazily construct the Resend client so importing this module never throws
// (e.g. during `next build` page-data collection, when env vars may not be
// available). The client is only created when an email is actually sent.
export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    if (!_resend) {
      _resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");
    }
    const value = (_resend as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(_resend) : value;
  },
});

export const FROM_EMAIL = process.env.FROM_EMAIL || "";
export const STUDIO_EMAIL = process.env.STUDIO_EMAIL || "";
