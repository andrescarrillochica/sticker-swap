import type { CollectionMap } from '../types/stickers';

const COLLECTION_KEY = 'stickerswap_2026_collection';

export function loadCollection(): CollectionMap {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CollectionMap;
  } catch {
    return {};
  }
}

export function saveCollection(collection: CollectionMap): void {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  } catch {
    // Storage quota exceeded or unavailable — fail silently
  }
}

export function clearCollection(): void {
  localStorage.removeItem(COLLECTION_KEY);
}

export function exportCollectionJson(collection: CollectionMap): string {
  return JSON.stringify({ version: 1, collection }, null, 2);
}

export function importCollectionJson(json: string): CollectionMap {
  const parsed = JSON.parse(json);
  if (parsed.version === 1 && parsed.collection && typeof parsed.collection === 'object') {
    return parsed.collection as CollectionMap;
  }
  // Support bare collection maps exported from older versions
  if (typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as CollectionMap;
  }
  throw new Error('Unrecognized collection format');
}
