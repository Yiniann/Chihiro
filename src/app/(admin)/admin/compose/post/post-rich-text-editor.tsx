"use client";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { parseStoredRichTextContent } from "@/lib/rich-text-content";

type PostRichTextEditorProps = {
  initialContent: unknown;
  initialContentHtml?: string | null;
  placeholder?: string;
};

export function PostRichTextEditor({
  initialContent,
  initialContentHtml,
  placeholder,
}: PostRichTextEditorProps) {
  void placeholder;
  const parsedContent =
    typeof initialContent === "string"
      ? parseStoredRichTextContent(initialContent)
      : initialContent;

  return (
    <SimpleEditor
      initialContent={parsedContent as Parameters<typeof SimpleEditor>[0]["initialContent"]}
      initialContentHtml={initialContentHtml}
      contentFieldName="content"
      htmlFieldName="contentHtml"
      showThemeToggle={false}
    />
  );
}
