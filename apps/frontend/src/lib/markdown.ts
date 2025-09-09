import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function markdownToSafeHtml(md: string): string {
  const raw = marked.parse(md || '', { async: false }) as string;
  return DOMPurify.sanitize(raw);
}

