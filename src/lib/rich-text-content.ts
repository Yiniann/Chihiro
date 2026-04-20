import { getContentText, getRenderedContentHtml } from "@/lib/content";

export function getEditorInitialHtml(content: unknown, contentHtml?: string | null) {
  return getRenderedContentHtml(contentHtml ?? null, content) ?? "<p></p>";
}

export function parseStoredRichTextContent(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export function getRichTextPreviewTitle(
  contentHtml: string | null,
  content: unknown,
  fallback = "未命名内容",
) {
  const firstLine = getContentText(contentHtml, content)
    .split(/\n+/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ? firstLine.slice(0, 32) : fallback;
}
