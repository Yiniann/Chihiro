"use server";

import { SubscriberStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isOwnerAuthenticated } from "@/server/auth";
import { setSubscriberStatusById } from "@/server/repositories/subscribers";

export async function unsubscribeSubscriberAction(formData: FormData) {
  if (!(await isOwnerAuthenticated())) {
    throw new Error("只有 Owner 才能管理订阅者。");
  }

  const subscriberId = getRequiredString(formData, "subscriberId", "订阅者编号");
  await setSubscriberStatusById(subscriberId, SubscriberStatus.UNSUBSCRIBED);

  revalidatePath("/admin/subscribers");
}

export async function activateSubscriberAction(formData: FormData) {
  if (!(await isOwnerAuthenticated())) {
    throw new Error("只有 Owner 才能管理订阅者。");
  }

  const subscriberId = getRequiredString(formData, "subscriberId", "订阅者编号");
  await setSubscriberStatusById(subscriberId, SubscriberStatus.ACTIVE);

  revalidatePath("/admin/subscribers");
}

function getRequiredString(formData: FormData, key: string, label: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`请填写${label}。`);
  }

  return value.trim();
}
