import { describe, expect, it } from 'vitest';

import { sanitizeProductDescriptionHtml } from '@/components/shop/productDetailHtml';

describe('sanitizeProductDescriptionHtml', () => {
  it('keeps product paragraphs and lists renderable', () => {
    const html = '<p>Built for the streets.</p><ul><li>240gsm cotton</li><li>Tapered leg</li></ul>';

    expect(sanitizeProductDescriptionHtml(html)).toBe(
      '<p>Built for the streets.</p><ul><li>240gsm cotton</li><li>Tapered leg</li></ul>'
    );
  });

  it('removes unsafe tags and javascript links', () => {
    const html = '<p onclick="alert(1)">Safe</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>';

    expect(sanitizeProductDescriptionHtml(html)).toBe('<p>Safe</p><a>bad</a>');
  });

  it('wraps plain text without exposing markup', () => {
    expect(sanitizeProductDescriptionHtml('Line <one>\nLine two')).toBe('<p>Line &lt;one&gt;<br>Line two</p>');
  });
});
