import { Resend } from "resend";

import type { AppEnv } from "../config/env.js";

interface SendResetPasswordEmailInput {
  to: string;
  token: string;
}

export async function sendResetPasswordEmail(
  env: AppEnv,
  input: SendResetPasswordEmailInput
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    if (env.NODE_ENV === "production") {
      console.warn("[email] RESEND not configured in production — password reset email skipped for %s", input.to);
    } else {
      const resetUrl = `${env.WEB_APP_URL}/reset-password?token=${encodeURIComponent(input.token)}`;
      console.log("[email] RESEND not configured — skipping send. to=%s resetUrl=%s", input.to, resetUrl);
    }
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const resetUrl = `${env.WEB_APP_URL}/reset-password?token=${encodeURIComponent(input.token)}`;

  await resend.emails.send({
    from: env.RESEND_FROM,
    to: input.to,
    subject: "Password Reset",
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a></p>`,
    text: `You requested a password reset. Open: ${resetUrl}`
  });
}
