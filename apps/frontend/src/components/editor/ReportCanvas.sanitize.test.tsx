import { render, screen } from '@testing-library/react';
import { ReportCanvas } from './ReportCanvas';

describe('ReportCanvas text_box sanitization', () => {
  it('does not render script tags from text_box', () => {
    const items = [
      { type: 'text_box', content: '<p>Safe</p><script>evil()</script>' },
    ];
    render(<ReportCanvas items={items as any} onReorder={() => {}} onRemove={() => {}} />);
    const container = screen.getByText('Safe');
    expect(container).toBeInTheDocument();
    // Ensure no script tag present in DOM
    expect(document.querySelector('script')).toBeNull();
  });
});

