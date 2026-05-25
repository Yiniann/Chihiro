import nodemailer from "nodemailer";
import { getResolvedEmailSettings } from "@/server/mail/config";

export async function createMailTransport() {
  const settings = await getResolvedEmailSettings();

  if (!settings) {
    throw new Error("邮件配置不完整，请先填写 SMTP 设置。");
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });

  return {
    transporter,
    settings,
  };
}
