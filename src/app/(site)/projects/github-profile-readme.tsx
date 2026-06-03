"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function GitHubProfileReadme({ markdown }: { markdown: string }) {
  return (
    <div className="mt-6 overflow-x-auto text-sm leading-7 text-zinc-700 dark:text-zinc-300 sm:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        allowedElements={[
          "p",
          "br",
          "strong",
          "em",
          "del",
          "code",
          "pre",
          "blockquote",
          "ul",
          "ol",
          "li",
          "a",
          "hr",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
        ]}
        components={{
          p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer nofollow noopener"
              className="text-blue-600 underline decoration-blue-300 underline-offset-4 transition hover:decoration-blue-600 dark:text-blue-300 dark:decoration-blue-700"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className);

            if (isBlock) {
              return (
                <code className="block whitespace-pre overflow-x-auto font-mono text-[13px] leading-6 text-zinc-800 dark:text-zinc-100 sm:text-sm">
                  {children}
                </code>
              );
            }

            return (
              <code className="rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-[0.9em] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-950">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-zinc-300 pl-3 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
          table: ({ children }) => (
            <table className="my-3 min-w-full border-collapse text-left text-sm">{children}</table>
          ),
          th: ({ children }) => (
            <th className="border border-zinc-200 px-3 py-2 font-semibold dark:border-zinc-800">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              {children}
            </td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
