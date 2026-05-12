"use client";

import { Send } from "lucide-react";
import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  submitPostCommentAction,
  type SubmitCommentState,
} from "@/app/(site)/posts/[...slug]/comment-actions";
import { useToast } from "@/components/toast-provider";

const initialState: SubmitCommentState = {
  error: null,
  success: null,
};
const commentMaxLength = 512;

type PostCommentFormProps = {
  postId: number;
  pathname: string;
  showGuestFields?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

export function PostCommentForm({
  postId,
  pathname,
  showGuestFields = false,
  user = null,
}: PostCommentFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [bodyLength, setBodyLength] = useState(0);
  const { showToast } = useToast();
  const [, formAction] = useActionState(async (previousState: SubmitCommentState, formData: FormData) => {
    const nextState = await submitPostCommentAction(previousState, formData);

    if (!nextState.error) {
      formRef.current?.reset();
      setBodyLength(0);
    }

    if (nextState.error) {
      showToast(nextState.error, "error");
    } else if (nextState.success) {
      showToast(nextState.success, "success");
    }

    return nextState;
  }, initialState);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="pathname" value={pathname} />
      {showGuestFields ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
              邮箱
            </span>
            <input
              type="email"
              name="authorEmail"
              maxLength={254}
              required
              className="h-10 rounded-md border border-zinc-200/80 bg-white/70 px-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-zinc-800/80 dark:bg-zinc-950/55 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950/80"
              placeholder="you@example.com"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
              昵称
            </span>
            <input
              name="authorName"
              maxLength={40}
              className="h-10 rounded-md border border-zinc-200/80 bg-white/70 px-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-zinc-800/80 dark:bg-zinc-950/55 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950/80"
              placeholder="可选"
            />
          </label>
        </div>
      ) : null}
      <div className={user ? "grid grid-cols-[2.25rem_1fr] gap-3" : "grid gap-2"}>
        {user ? <UserAvatar user={user} /> : null}
        <label className="grid gap-2">
          {!user ? (
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
              留言
            </span>
          ) : null}
          <div className="overflow-hidden rounded-md border border-zinc-200/80 bg-transparent transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 dark:border-zinc-800/80">
            <textarea
              name="body"
              rows={user ? 3 : 4}
              maxLength={commentMaxLength}
              required
              onChange={(event) => setBodyLength(event.currentTarget.value.length)}
              className="block min-h-28 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-7 text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="写下你的想法..."
            />
            <div className="flex h-9 items-center justify-end gap-3 border-t border-zinc-200/70 px-3 dark:border-zinc-800/70">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {bodyLength}/{commentMaxLength}
              </span>
              <SubmitButton />
            </div>
          </div>
        </label>
      </div>
    </form>
  );
}

function UserAvatar({
  user,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}) {
  const label = user.name ?? user.email ?? "你";

  if (user.image) {
    return (
      <Image
        src={user.image}
        alt=""
        width={36}
        height={36}
        className="mt-1 size-9 rounded-full"
      />
    );
  }

  return (
    <span className="mt-1 inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-7 items-center justify-center gap-1.5 px-1 text-sm font-medium text-primary transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Send className="size-3.5" aria-hidden="true" />
      {pending ? "提交中..." : "提交评论"}
    </button>
  );
}
