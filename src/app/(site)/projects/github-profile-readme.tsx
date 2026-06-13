"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function GitHubProfileReadme({ markdown }: { markdown: string }) {
  return (
    <div className="reading-copy site-body mt-6 overflow-x-auto text-n-5">
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
                <code className="block whitespace-pre overflow-x-auto font-mono text-sm leading-6 text-n-6">
                  {children}
                </code>
              );
            }

            return (
              <code className="inline-code">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-md bg-n-1 px-4 py-3 dark:bg-n-1">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="quote my-3">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
          table: ({ children }) => (
            <table className="site-meta my-3 min-w-full border-collapse text-left">{children}</table>
          ),
          th: ({ children }) => (
            <th className="border border-n-2 px-3 py-2 font-semibold dark:border-n-2">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-n-2 px-3 py-2 dark:border-n-2">
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
