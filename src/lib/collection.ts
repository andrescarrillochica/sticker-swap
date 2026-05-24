import type { CollectionEntry, CollectionMap, CollectionSummary } from '../types/stickers';
import { getAllStickers } from './stickers';

export function getEntry(collection: CollectionMap, stickerId: string): CollectionEntry {
  return (
    collection[stickerId] ?? {
      stickerId,
      owned: false,
      duplicateCount: 0,
      updatedAt: new Date().toISOString(),
    }
  );
}

export function setOwned(
  collection: CollectionMap,
  stickerId: string,
  owned: boolean
): CollectionMap {
  const entry = getEntry(collection, stickerId);
  return {
    ...collection,
    [stickerId]: {
      ...entry,
      owned,
      duplicateCount: owned ? entry.duplicateCount : 0,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function incrementDuplicate(collection: CollectionMap, stickerId: string): CollectionMap {
  const entry = getEntry(collection, stickerId);
  return {
    ...collection,
    [stickerId]: {
      ...entry,
      owned: true,
      duplicateCount: entry.duplicateCount + 1,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function decrementDuplicate(collection: CollectionMap, stickerId: string): CollectionMap {
  const entry = getEntry(collection, stickerId);
  if (entry.duplicateCount <= 0) return collection;
  return {
    ...collection,
    [stickerId]: {
      ...entry,
      duplicateCount: entry.duplicateCount - 1,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function getCollectionSummary(collection: CollectionMap): CollectionSummary {
  const all = getAllStickers();
  const total = all.length;
  let owned = 0;
  let spares = 0;
  for (const sticker of all) {
    const entry = collection[sticker.id];
    if (entry?.owned) owned++;
    if (entry?.duplicateCount) spares += entry.duplicateCount;
  }
  const missing = total - owned;
  const percentage = total > 0 ? Math.round((owned / total) * 100) : 0;
  return { total, owned, missing, spares, percentage };
}

export function getMissingStickers(collection: CollectionMap): string[] {
  return getAllStickers()
    .filter((s) => !collection[s.id]?.owned)
    .map((s) => s.id);
}

export function getSparesMap(collection: CollectionMap): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, entry] of Object.entries(collection)) {
    if (entry.duplicateCount > 0) result[id] = entry.duplicateCount;
  }
  return result;
}
