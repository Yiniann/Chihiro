"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  submitPostCommentAction,
  type SubmitCommentState,
} from "@/app/(site)/posts/[...slug]/comment-actions";

const initialState: SubmitCommentState = {
  error: null,
  success: null,
};

type PostCommentFormProps = {
  postId: number;
  pathname: string;
  showGuestFields?: boolean;
};

export function PostCommentForm({ postId, pathname, showGuestFields = false }: PostCommentFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(async (previousState: SubmitCommentState, formData: FormData) => {
    const nextState = await submitPostCommentAction(previousState, formData);

    if (!nextState.error) {
      formRef.current?.reset();
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
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              邮箱
            </span>
            <input
              type="email"
              name="authorEmail"
              maxLength={254}
              required
              className="h-10 rounded-md border border-zinc-200/80 bg-white/45 px-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-primary/45 focus:bg-white/70 dark:border-zinc-800/80 dark:bg-zinc-950/35 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950/55"
              placeholder="you@example.com"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              昵称
            </span>
            <input
              name="authorName"
              maxLength={40}
              className="h-10 rounded-md border border-zinc-200/80 bg-white/45 px-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-primary/45 focus:bg-white/70 dark:border-zinc-800/80 dark:bg-zinc-950/35 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950/55"
              placeholder="可选"
            />
          </label>
        </div>
      ) : null}
      <label className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
          留言
        </span>
        <textarea
          name="body"
          rows={4}
          maxLength={2000}
          required
          className="min-h-28 resize-y rounded-md border border-zinc-200/80 bg-white/45 px-3 py-2 text-sm leading-7 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-primary/45 focus:bg-white/70 dark:border-zinc-800/80 dark:bg-zinc-950/35 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950/55"
          placeholder="写下你的想法..."
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-300">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-300">{state.success}</p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
    >
      {pending ? "提交中..." : "提交评论"}
    </button>
  );
}
