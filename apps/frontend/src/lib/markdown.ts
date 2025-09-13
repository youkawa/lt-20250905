import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function markdownToSafeHtml(md: string): string {
  // 先にHTMLを除去してからMarkdownをHTML化し、最後に再サニタイズ
  const stripped = DOMPurify.sanitize(md || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  const raw = marked.parse(stripped, { async: false }) as string;
  return DOMPurify.sanitize(raw);
}
