import "server-only";
import { Resend } from "resend";

export type Email = { to: string | string[]; subject: string; text: string; replyTo?: string };

/** Committee inbox for notifications, if configured. */
export const committeeEmail = () => process.env.EMAIL_ADMIN || undefined;

/** Sends a plain-text email via Resend. Without RESEND_API_KEY/EMAIL_FROM (local, preview) it logs and skips. */
export async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn(`Email skipped (RESEND_API_KEY/EMAIL_FROM not set): ${email.subject}`);
    return;
  }
  const { error } = await new Resend(apiKey).emails.send({ from, ...email });
  if (error) throw new Error(`Failed to send email "${email.subject}": ${error.message}`);
}
