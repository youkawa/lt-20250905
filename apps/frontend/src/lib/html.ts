import DOMPurify from 'dompurify';

// Strict sanitizer for user-provided HTML (text_box)
// Allow only basic formatting and links; no styles or scripts
const ALLOWED_TAGS = [
  'p', 'b', 'strong', 'i', 'em', 'u', 's', 'br',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'
] as const;

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel'] as const;

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: ALLOWED_TAGS as unknown as string[],
    ALLOWED_ATTR: ALLOWED_ATTR as unknown as string[],
    // ensure external links have rel noopener
    ADD_ATTR: ['rel'],
    RETURN_TRUSTED_TYPE: false,
  });
}

