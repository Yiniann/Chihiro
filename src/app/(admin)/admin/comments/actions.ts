"use server";

import { CommentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/server/auth";
import { deleteComment, updateCommentStatus } from "@/server/repositories/comments";

export async function approveCommentAction(formData: FormData) {
  await setCommentStatusFromForm(formData, CommentStatus.APPROVED);
}

export async function holdCommentAction(formData: FormData) {
  await setCommentStatusFromForm(formData, CommentStatus.PENDING);
}

export async function markCommentSpamAction(formData: FormData) {
  await setCommentStatusFromForm(formData, CommentStatus.SPAM);
}

export async function deleteCommentAction(formData: FormData) {
  await requireAdminSession();

  const id = getCommentId(formData);
  await deleteComment(id);
  revalidatePath("/admin/comments");
}

async function setCommentStatusFromForm(formData: FormData, status: CommentStatus) {
  await requireAdminSession();

  const id = getCommentId(formData);
  await updateCommentStatus(id, status);
  revalidatePath("/admin/comments");
}

function getCommentId(formData: FormData) {
  const id = formData.get("id");

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("缺少评论 ID。");
  }

  return id;
}
