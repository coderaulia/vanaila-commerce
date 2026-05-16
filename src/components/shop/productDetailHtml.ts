const allowedTextTags = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u']);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeHref(value: string): string {
  const href = value.trim();
  if (/^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('/') || href.startsWith('#')) {
    return href;
  }
  return '';
}

function sanitizeAnchorAttributes(attributes: string): string {
  const hrefMatch = attributes.match(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const href = normalizeHref(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? '');
  if (!href) return '';
  return ` href="${escapeHtml(href)}" rel="noopener noreferrer"`;
}

export function sanitizeProductDescriptionHtml(value: string): string {
  const raw = value.trim();
  if (!raw) return '';

  const containsHtml = /<\/?(?:p|br|ul|ol|li|strong|b|em|i|u|a)\b/i.test(raw);
  const source = containsHtml ? raw : `<p>${escapeHtml(raw).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;

  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|svg|math)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*\/?>/gi, '')
    .replace(/<\/?([a-z][a-z0-9-]*)([^>]*)>/gi, (match, rawTag: string, attributes: string) => {
      const tag = rawTag.toLowerCase();
      const isClosing = match.startsWith('</');

      if (tag === 'a') {
        return isClosing ? '</a>' : `<a${sanitizeAnchorAttributes(attributes)}>`;
      }

      if (!allowedTextTags.has(tag)) return '';
      if (tag === 'br') return '<br>';
      return isClosing ? `</${tag}>` : `<${tag}>`;
    });
}
