"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/public-auth";
import { createCommentForPost, type CommentTargetType } from "@/server/repositories/comments";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import { getPublicPostById } from "@/server/repositories/posts";
import { getPublicStandalonePageById } from "@/server/repositories/standalone-pages";

export type SubmitCommentState = {
  error: string | null;
  success: string | null;
};
const commentMaxLength = 512;

export async function submitPostCommentAction(
  _previousState: SubmitCommentState,
  formData: FormData,
): Promise<SubmitCommentState> {
  const settings = await getPublicInteractionSettings();

  if (!settings.commentsEnabled) {
    return {
      error: "评论暂未开放。",
      success: null,
    };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const bypassModeration = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  if (settings.loginRequiredToComment && !userId) {
    return {
      error: "请先登录后再评论。",
      success: null,
    };
  }

  let targetId;
  let targetType;
  let parentId;
  let body;
  let pathname;
  let authorName;
  let authorEmail;

  try {
    targetType = getTargetType(formData);
    targetId = getTargetId(formData);
    parentId = getParentCommentId(formData);
    body = getCommentBody(formData);
    pathname = getOptionalString(formData, "pathname");
    authorName = getAuthorName(formData);
    authorEmail = getAuthorEmail(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "评论内容无效。",
      success: null,
    };
  }

  if (!targetId) {
    return {
      error: "内容信息无效。",
      success: null,
    };
  }

  const target =
    targetType === "post"
      ? await getPublicPostById(targetId)
      : await getPublicStandalonePageById(targetId);

  if (!target || !target.commentsEnabled) {
    return {
      error: targetType === "post" ? "这篇文章暂未开放评论。" : "这个页面暂未开放评论。",
      success: null,
    };
  }

  if (!body) {
    return {
      error: "请填写评论内容。",
      success: null,
    };
  }

  if (!userId && !authorEmail) {
    return {
      error: "请填写邮箱。",
      success: null,
    };
  }

  try {
    const comment = await createCommentForPost({
      targetType,
      targetId,
      userId,
      parentId,
      authorName: userId ? null : authorName,
      authorEmail: userId ? null : authorEmail,
      body,
      requiresModeration: settings.commentModeration && !bypassModeration,
    });

    if (pathname) {
      revalidatePath(pathname);
    }

    return {
      error: null,
      success:
        comment.status === "PENDING"
          ? "评论已提交，审核通过后会展示。"
          : "评论已发布。",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "提交评论时出错了。",
      success: null,
    };
  }
}

function getParentCommentId(formData: FormData) {
  const value = getOptionalString(formData, "parentId");
  return value ?? null;
}

function getAuthorEmail(formData: FormData) {
  const value = getOptionalString(formData, "authorEmail");

  if (!value) {
    return null;
  }

  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("请填写有效邮箱。");
  }

  return value.toLowerCase();
}

function getAuthorName(formData: FormData) {
  const value = getOptionalString(formData, "authorName");

  if (!value) {
    return null;
  }

  if (value.length > 40) {
    throw new Error("昵称最多 40 个字符。");
  }

  return value;
}

function getTargetType(formData: FormData) {
  const value = getOptionalString(formData, "targetType");
  const targetType: CommentTargetType = value === "standalone-page" ? "standalone-page" : "post";
  return targetType;
}

function getTargetId(formData: FormData) {
  const value = Number(formData.get("targetId"));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function getCommentBody(formData: FormData) {
  const value = getOptionalString(formData, "body");

  if (!value) {
    return null;
  }

  if (value.length > commentMaxLength) {
    throw new Error(`评论最多 ${commentMaxLength} 个字符。`);
  }

  return value;
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
