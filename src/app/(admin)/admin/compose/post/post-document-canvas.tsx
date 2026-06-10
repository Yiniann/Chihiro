"use client";

import { useEffect, useRef } from "react";
import { PostRichTextEditor } from "@/app/(admin)/admin/compose/post/post-rich-text-editor";

type PostDocumentCanvasProps = {
  defaultTitle: string;
  defaultSlug: string;
  defaultSummary: string;
  postUrlPrefix: string;
  initialContent: unknown;
  initialContentHtml?: string | null;
  onDirtyChange?: (isDirty: boolean) => void;
  isCodeView?: boolean;
  onCodeViewChange?: (isCodeView: boolean) => void;
};

export function PostDocumentCanvas({
  defaultTitle,
  defaultSlug,
  defaultSummary,
  postUrlPrefix,
  initialContent,
  initialContentHtml,
  onDirtyChange,
  isCodeView,
  onCodeViewChange,
}: PostDocumentCanvasProps) {
  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const element = titleRef.current;

    if (!element) {
      return;
    }

    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }, [defaultTitle]);

  return (
    <article className="grid gap-0">
      <div className="mx-auto grid w-full max-w-[64rem] gap-5 px-1 pb-2 pt-3 sm:px-2 sm:pb-3 sm:pt-4 2xl:max-w-[72rem]">
        <textarea
          ref={titleRef}
          id="title"
          name="title"
          required
          rows={1}
          defaultValue={defaultTitle}
          placeholder="输入标题..."
          onInput={(event) => {
            const element = event.currentTarget;
            element.style.height = "0px";
            element.style.height = `${element.scrollHeight}px`;
          }}
          className="w-full resize-none overflow-hidden bg-transparent px-0 py-0 text-[2rem] font-semibold leading-[1.2] tracking-tight text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-600 sm:text-[2.7rem]"
        />

        <label className="grid gap-2">
          <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-3 text-sm text-zinc-500 transition focus-within:border-primary/45 dark:border-zinc-800/80 dark:text-zinc-400">
            <span className="shrink-0 whitespace-nowrap">{postUrlPrefix}</span>
            <input
              name="slug"
              type="text"
              defaultValue={defaultSlug}
              placeholder="slug"
              className="min-w-0 flex-1 bg-transparent px-0 text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-600"
            />
          </div>
        </label>

        <textarea
          name="summary"
          rows={3}
          defaultValue={defaultSummary}
          placeholder="在这里写导语或摘要，它会跟着标题一起参与阅读节奏。"
          className="min-h-24 resize-none bg-transparent px-0 py-0 text-lg leading-8 text-zinc-500 outline-none transition placeholder:text-zinc-400 dark:text-zinc-400 dark:placeholder:text-zinc-600"
        />
      </div>

      <div className="mx-auto w-full max-w-[64rem] px-1 pb-5 pt-4 sm:px-2 sm:pb-8 sm:pt-5 2xl:max-w-[72rem]">
        <PostRichTextEditor
          initialContent={initialContent}
          initialContentHtml={initialContentHtml}
          onDirtyChange={onDirtyChange}
          placeholder="开始写正文。支持标题、引用、链接、代码块和图片。"
          appearance="embedded"
          isCodeView={isCodeView}
          onCodeViewChange={onCodeViewChange}
          showModeToggle={false}
        />
      </div>
    </article>
  );
}
