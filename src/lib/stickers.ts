import { generateStickersFromCatalog, albumSections } from '../data/albumCatalog';
import type { Sticker } from '../data/albumCatalog';

let _cache: Sticker[] | null = null;

export function getAllStickers(): Sticker[] {
  if (!_cache) _cache = generateStickersFromCatalog();
  return _cache;
}

export function getStickerById(id: string): Sticker | undefined {
  return getAllStickers().find((s) => s.id === id);
}

export function getStickersBySection(sectionCode: string): Sticker[] {
  return getAllStickers().filter((s) => s.sectionCode === sectionCode);
}

export function getAllSections(): { code: string; name: string; group: string }[] {
  return albumSections.map((s) => ({ code: s.code, name: s.name, group: s.group }));
}

export function getSectionsByGroup(): Map<string, { code: string; name: string; group: string }[]> {
  const map = new Map<string, { code: string; name: string; group: string }[]>();
  for (const section of getAllSections()) {
    const list = map.get(section.group) ?? [];
    list.push(section);
    map.set(section.group, list);
  }
  return map;
}
