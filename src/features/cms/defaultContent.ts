import type { CmsContent } from './types';
import { buildDefaultContent } from './defaultContentFixture';

let _cache: CmsContent | null = null;

export function getDefaultContent(): CmsContent {
  if (!_cache) _cache = buildDefaultContent();
  return _cache;
}
