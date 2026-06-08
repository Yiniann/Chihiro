import { Pool } from "pg";
import nodemailer from "nodemailer";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const POLL_INTERVAL_MS = getPositiveInteger(process.env.MAIL_WORKER_POLL_INTERVAL_MS, 2000);
const RETRY_BASE_DELAY_MS = getPositiveInteger(process.env.MAIL_WORKER_RETRY_DELAY_MS, 30000);
const STALE_PROCESSING_MS = getPositiveInteger(process.env.MAIL_WORKER_STALE_MS, 5 * 60 * 1000);

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error("[mail-worker] DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

let isShuttingDown = false;
let cachedTransportSignature = null;
let cachedTransporter = null;
let cachedSettings = null;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    isShuttingDown = true;
  });
}

main().catch(async (error) => {
  console.error("[mail-worker] fatal error", error);
  await shutdown(1);
});

async function main() {
  console.log("[mail-worker] started");

  while (!isShuttingDown) {
    const job = await claimNextMailJob();

    if (!job) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    try {
      await deliverMailJob(job);
      await markMailJobSent(job);
      await markSubscriberLastEmailSent(job.recipientEmail);
      await markContentNotificationSentIfComplete(job);
      console.log(`[mail-worker] sent ${job.kind} to ${job.recipientEmail}`);
    } catch (error) {
      await failMailJob(job, error);
      console.error(`[mail-worker] failed ${job.kind} to ${job.recipientEmail}`, error);
    }
  }

  await shutdown(0);
}

async function claimNextMailJob() {
  const now = new Date();
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);

  while (!isShuttingDown) {
    const candidate = await prisma.mailJob.findFirst({
      where: {
        OR: [
          {
            status: "PENDING",
            scheduledAt: {
              lte: now,
            },
          },
          {
            status: "PROCESSING",
            lockedAt: {
              lte: staleBefore,
            },
          },
        ],
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    });

    if (!candidate) {
      return null;
    }

    const claimedAt = new Date();
    const updateResult =
      candidate.status === "PENDING"
        ? await prisma.mailJob.updateMany({
            where: {
              id: candidate.id,
              status: "PENDING",
            },
            data: {
              status: "PROCESSING",
              lockedAt: claimedAt,
              lastAttemptAt: claimedAt,
              processedAt: null,
              lastError: null,
              attemptCount: {
                increment: 1,
              },
            },
          })
        : await prisma.mailJob.updateMany({
            where: {
              id: candidate.id,
              status: "PROCESSING",
              lockedAt: candidate.lockedAt,
            },
            data: {
              lockedAt: claimedAt,
              lastAttemptAt: claimedAt,
              processedAt: null,
              lastError: null,
              attemptCount: {
                increment: 1,
              },
            },
          });

    if (updateResult.count !== 1) {
      continue;
    }

    const claimedJob = await prisma.mailJob.findUnique({
      where: {
        id: candidate.id,
      },
    });

    if (claimedJob) {
      return claimedJob;
    }
  }

  return null;
}

async function deliverMailJob(job) {
  const payload = parsePayload(job.payload);
  const { transporter, settings } = await getMailTransport();

  await transporter.sendMail({
    from: formatFrom(settings.smtpFromEmail, settings.smtpFromName),
    to: payload.to,
    replyTo: payload.replyTo ?? settings.subscriptionReplyTo ?? undefined,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

async function markMailJobSent(job) {
  await prisma.mailJob.update({
    where: {
      id: job.id,
    },
    data: {
      status: "SENT",
      lockedAt: null,
      processedAt: new Date(),
      lastError: null,
    },
  });
}

async function failMailJob(job, error) {
  const message = getErrorMessage(error);
  const shouldRetry = job.attemptCount < job.maxAttempts;

  await prisma.mailJob.update({
    where: {
      id: job.id,
    },
    data: shouldRetry
      ? {
          status: "PENDING",
          lockedAt: null,
          scheduledAt: new Date(Date.now() + RETRY_BASE_DELAY_MS * job.attemptCount),
          lastError: message,
        }
      : {
          status: "FAILED",
          lockedAt: null,
          processedAt: new Date(),
          lastError: message,
        },
  });
}

async function markSubscriberLastEmailSent(email) {
  await prisma.subscriber.updateMany({
    where: {
      email,
    },
    data: {
      lastEmailSentAt: new Date(),
    },
  });
}

async function markContentNotificationSentIfComplete(job) {
  const remaining = await prisma.mailJob.count({
    where: {
      contentType: job.contentType,
      contentId: job.contentId,
      status: {
        not: "SENT",
      },
    },
  });

  if (remaining > 0) {
    return;
  }

  if (job.contentType === "POST") {
    await prisma.post.updateMany({
      where: {
        id: job.contentId,
        subscriptionEmailSentAt: null,
      },
      data: {
        subscriptionEmailSentAt: new Date(),
      },
    });
    return;
  }

  if (job.contentType === "UPDATE") {
    await prisma.update.updateMany({
      where: {
        id: job.contentId,
        subscriptionEmailSentAt: null,
      },
      data: {
        subscriptionEmailSentAt: new Date(),
      },
    });
  }
}

async function getMailTransport() {
  const settings = await getResolvedEmailSettings();

  if (!settings) {
    throw new Error("邮件配置不完整，请先填写 SMTP 设置。");
  }

  const signature = JSON.stringify(settings);

  if (cachedTransporter && cachedTransportSignature === signature) {
    return {
      transporter: cachedTransporter,
      settings: cachedSettings,
    };
  }

  cachedTransporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });
  cachedTransportSignature = signature;
  cachedSettings = settings;

  return {
    transporter: cachedTransporter,
    settings,
  };
}

async function getResolvedEmailSettings() {
  const dbSettings = await prisma.emailSettings.findUnique({
    where: {
      id: "default",
    },
  });
  const envSettings = getEmailSettingsFromEnv();

  if (!dbSettings && !envSettings) {
    return null;
  }

  const merged = {
    smtpHost: dbSettings?.smtpHost ?? envSettings?.smtpHost ?? "",
    smtpPort: dbSettings?.smtpPort ?? envSettings?.smtpPort ?? 587,
    smtpSecure: dbSettings?.smtpSecure ?? envSettings?.smtpSecure ?? false,
    smtpUser: dbSettings?.smtpUser ?? envSettings?.smtpUser ?? "",
    smtpPass: dbSettings?.smtpPass ?? envSettings?.smtpPass ?? "",
    smtpFromEmail: dbSettings?.smtpFromEmail ?? envSettings?.smtpFromEmail ?? "",
    smtpFromName: dbSettings?.smtpFromName ?? envSettings?.smtpFromName ?? null,
    subscriptionReplyTo:
      dbSettings?.subscriptionReplyTo ?? envSettings?.subscriptionReplyTo ?? null,
  };

  if (
    !merged.smtpHost ||
    !merged.smtpPort ||
    !merged.smtpUser ||
    !merged.smtpPass ||
    !merged.smtpFromEmail
  ) {
    return null;
  }

  return merged;
}

function getEmailSettingsFromEnv() {
  const smtpHost = normalizeString(process.env.SMTP_HOST);
  const smtpPort = parsePort(process.env.SMTP_PORT);
  const smtpSecure = parseBoolean(process.env.SMTP_SECURE);
  const smtpUser = normalizeString(process.env.SMTP_USER);
  const smtpPass = normalizeString(process.env.SMTP_PASS);
  const smtpFromEmail = normalizeString(process.env.SMTP_FROM_EMAIL);
  const smtpFromName = normalizeString(process.env.SMTP_FROM_NAME);
  const subscriptionReplyTo = normalizeString(process.env.SMTP_REPLY_TO);

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFromEmail) {
    return null;
  }

  return {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    smtpFromEmail,
    smtpFromName,
    subscriptionReplyTo,
  };
}

function parsePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("邮件任务缺少有效 payload。");
  }

  if (
    typeof payload.to !== "string" ||
    typeof payload.subject !== "string" ||
    typeof payload.html !== "string" ||
    typeof payload.text !== "string"
  ) {
    throw new Error("邮件任务 payload 结构不完整。");
  }

  return {
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: typeof payload.replyTo === "string" ? payload.replyTo : null,
  };
}

function formatFrom(email, name) {
  if (!name) {
    return email;
  }

  return `"${String(name).replace(/"/g, '\\"')}" <${email}>`;
}

function normalizeString(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parsePort(value) {
  const normalized = normalizeString(value);

  if (!normalized || !/^\d+$/.test(normalized)) {
    return null;
  }

  const port = Number(normalized);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
}

function parseBoolean(value) {
  const normalized = normalizeString(value)?.toLowerCase();
  return normalized === "true" || normalized === "1";
}

function getPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > 1000 ? `${message.slice(0, 997)}...` : message;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function shutdown(code) {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("[mail-worker] failed to disconnect prisma", error);
  }

  try {
    await pool.end();
  } catch (error) {
    console.error("[mail-worker] failed to close pg pool", error);
  }

  process.exit(code);
}
