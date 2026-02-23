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
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const resetUrl = `${env.WEB_APP_URL}/reset-password?token=${encodeURIComponent(input.token)}`;

  await resend.emails.send({
    from: env.RESEND_FROM,
    to: input.to,
    subject: "Redefinicao de senha",
    html: `<p>Voce solicitou redefinicao de senha.</p><p><a href="${resetUrl}">Clique aqui para redefinir</a></p>`,
    text: `Voce solicitou redefinicao de senha. Abra: ${resetUrl}`
  });
}
