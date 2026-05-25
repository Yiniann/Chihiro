import { createMailTransport } from "@/server/mail/transport";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
};

export async function sendMail(input: SendMailInput) {
  const { transporter, settings } = await createMailTransport();

  return transporter.sendMail({
    from: formatFrom(settings.smtpFromEmail, settings.smtpFromName),
    to: input.to,
    replyTo: input.replyTo ?? settings.subscriptionReplyTo ?? undefined,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

function formatFrom(email: string, name: string | null) {
  if (!name) {
    return email;
  }

  return `"${name.replace(/"/g, '\\"')}" <${email}>`;
}
