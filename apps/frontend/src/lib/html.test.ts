import { sanitizeHtml } from './html';

describe('sanitizeHtml', () => {
  it('removes scripts and unsafe attributes', () => {
    const dirty = '<p onclick="alert(1)">Hi<script>alert(2)</script><img src=x onerror=alert(3)></p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain('<p>Hi');
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('<img');
  });

  it('allows basic formatting and links', () => {
    const html = '<h2>Title</h2><p><strong>bold</strong> and <em>em</em> <a href="https://example.com" target="_blank">link</a></p>';
    const clean = sanitizeHtml(html);
    expect(clean).toContain('<h2>');
    expect(clean).toContain('<strong>');
    expect(clean).toContain('<em>');
    expect(clean).toContain('<a');
  });
});

