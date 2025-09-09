import { markdownToSafeHtml } from './markdown';

describe('markdownToSafeHtml', () => {
  it('sanitizes script tags', () => {
    const html = markdownToSafeHtml('<script>alert(1)</script>**bold**');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('allows basic markdown formatting', () => {
    const html = markdownToSafeHtml('# Title\n\n- A\n- B');
    expect(html).toContain('<h1');
    expect(html).toContain('<ul');
  });
});

