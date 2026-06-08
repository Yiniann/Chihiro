import {
  MailJobContentType,
  MailJobKind,
  MailJobStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/server/db/client";

export type MailJobPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
};

export type EnqueueMailJobInput = {
  kind: MailJobKind;
  contentType: MailJobContentType;
  contentId: number;
  recipientEmail: string;
  dedupeKey: string;
  payload: MailJobPayload;
  scheduledAt?: Date;
  maxAttempts?: number;
};

export async function enqueueMailJobs(jobs: EnqueueMailJobInput[]) {
  let enqueuedCount = 0;

  for (const job of jobs) {
    const existing = await prisma.mailJob.findUnique({
      where: {
        dedupeKey: job.dedupeKey,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      await prisma.mailJob.create({
        data: {
          kind: job.kind,
          contentType: job.contentType,
          contentId: job.contentId,
          recipientEmail: job.recipientEmail,
          dedupeKey: job.dedupeKey,
          payload: job.payload as Prisma.InputJsonValue,
          scheduledAt: job.scheduledAt ?? new Date(),
          maxAttempts: job.maxAttempts ?? 5,
        },
      });
      enqueuedCount += 1;
      continue;
    }

    if (existing.status !== MailJobStatus.FAILED) {
      continue;
    }

    await prisma.mailJob.update({
      where: {
        id: existing.id,
      },
      data: {
        status: MailJobStatus.PENDING,
        payload: job.payload as Prisma.InputJsonValue,
        scheduledAt: job.scheduledAt ?? new Date(),
        lockedAt: null,
        processedAt: null,
        lastAttemptAt: null,
        lastError: null,
        attemptCount: 0,
        maxAttempts: job.maxAttempts ?? 5,
      },
    });
    enqueuedCount += 1;
  }

  return {
    count: enqueuedCount,
  };
}
