import type { CollectionSnapshot, FinalTradePayload, QRPayload } from '../types/stickers';
import { getAllStickers } from './stickers';

// Compact QR format: "ss26|<base64-owned-bitfield>|<spare-idx:count,...>|<final-trade-indices>"
// Version prefix "ss26" identifies the app/format.
// Owned bitfield: one bit per sticker in catalog order, 1=owned, 0=missing.
// Spares: comma-separated "index:count" pairs (only stickers with duplicates > 0).
// Final trade: "ft|<receive-indices>|<give-indices>" as comma-separated catalog indices.

function stickersIndex(): Map<string, number> {
  const stickers = getAllStickers();
  const map = new Map<string, number>();
  for (let i = 0; i < stickers.length; i++) map.set(stickers[i].id, i);
  return map;
}

function encodeOwnedBitfield(ownedSet: Set<string>): string {
  const stickers = getAllStickers();
  const bytes = new Uint8Array(Math.ceil(stickers.length / 8));
  for (let i = 0; i < stickers.length; i++) {
    if (ownedSet.has(stickers[i].id)) {
      bytes[i >> 3] |= 1 << (7 - (i & 7));
    }
  }
  return btoa(String.fromCharCode(...bytes));
}

function decodeOwnedBitfield(b64: string): Set<string> {
  const stickers = getAllStickers();
  const raw = atob(b64);
  const owned = new Set<string>();
  for (let i = 0; i < stickers.length; i++) {
    const byte = raw.charCodeAt(i >> 3);
    if (byte & (1 << (7 - (i & 7)))) owned.add(stickers[i].id);
  }
  return owned;
}

export function encodeSnapshot(snapshot: CollectionSnapshot): string {
  const stickers = getAllStickers();
  const missingSet = new Set(snapshot.missing);
  const ownedSet = new Set<string>();
  for (const s of stickers) {
    if (!missingSet.has(s.id)) ownedSet.add(s.id);
  }

  const bitfield = encodeOwnedBitfield(ownedSet);

  const idxMap = stickersIndex();
  const spareParts: string[] = [];
  for (const [id, count] of Object.entries(snapshot.spares)) {
    const idx = idxMap.get(id);
    if (idx !== undefined && count > 0) spareParts.push(`${idx}:${count}`);
  }

  return `ss26|${bitfield}|${spareParts.join(',')}`;
}

export function decodeSnapshot(payload: string): CollectionSnapshot {
  const parts = payload.split('|');
  if (parts[0] !== 'ss26' || parts.length < 3) throw new Error('Invalid snapshot format.');

  const stickers = getAllStickers();
  const ownedSet = decodeOwnedBitfield(parts[1]);
  const missing = stickers.filter((s) => !ownedSet.has(s.id)).map((s) => s.id);

  const spares: Record<string, number> = {};
  if (parts[2]) {
    for (const part of parts[2].split(',')) {
      const [idxStr, countStr] = part.split(':');
      const idx = parseInt(idxStr, 10);
      const count = parseInt(countStr, 10);
      if (!isNaN(idx) && !isNaN(count) && count > 0 && stickers[idx]) {
        spares[stickers[idx].id] = count;
      }
    }
  }

  return { app: 'stickerswap-2026', type: 'collection-snapshot', v: 1, missing, spares };
}

export function encodeFinalTrade(payload: FinalTradePayload): string {
  const idxMap = stickersIndex();
  const encode = (ids: string[]) =>
    ids.map((id) => idxMap.get(id)).filter((i): i is number => i !== undefined).join(',');
  return `ss26ft|${encode(payload.deviceReceives)}|${encode(payload.deviceGives)}|${payload.createdAt}`;
}

export function decodeFinalTrade(payload: string): FinalTradePayload {
  const parts = payload.split('|');
  if (parts[0] !== 'ss26ft' || parts.length < 4) throw new Error('Invalid final-trade format.');

  const stickers = getAllStickers();
  const decodeIds = (s: string) =>
    s ? s.split(',').map((n) => stickers[parseInt(n, 10)]?.id).filter(Boolean) as string[] : [];

  return {
    app: 'stickerswap-2026',
    type: 'final-trade',
    v: 1,
    deviceReceives: decodeIds(parts[1]),
    deviceGives: decodeIds(parts[2]),
    createdAt: parts[3] || new Date().toISOString(),
  };
}

export function stringifyPayload(payload: QRPayload): string {
  if (payload.type === 'collection-snapshot') return encodeSnapshot(payload as CollectionSnapshot);
  return encodeFinalTrade(payload as FinalTradePayload);
}

export function parseAndValidatePayload(raw: string): QRPayload {
  if (raw.startsWith('ss26ft|')) return decodeFinalTrade(raw);
  if (raw.startsWith('ss26|')) return decodeSnapshot(raw);

  // Fallback: try legacy JSON format
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Unrecognized QR payload format.');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as Record<string, unknown>).app !== 'stickerswap-2026'
  ) {
    throw new Error('Not a StickerSwap 2026 payload.');
  }

  const obj = parsed as Record<string, unknown>;
  const allIds = new Set(getAllStickers().map((s) => s.id));

  if (obj.type === 'collection-snapshot' && obj.v === 1) {
    const missing = Array.isArray(obj.missing)
      ? (obj.missing as string[]).filter((id) => allIds.has(id))
      : [];
    const spares: Record<string, number> = {};
    if (typeof obj.spares === 'object' && obj.spares !== null) {
      for (const [id, count] of Object.entries(obj.spares as Record<string, unknown>)) {
        if (allIds.has(id) && typeof count === 'number' && count > 0) spares[id] = count;
      }
    }
    return { app: 'stickerswap-2026', type: 'collection-snapshot', v: 1, missing, spares };
  }

  if (obj.type === 'final-trade' && obj.v === 1) {
    const deviceReceives = Array.isArray(obj.deviceReceives)
      ? (obj.deviceReceives as string[]).filter((id) => allIds.has(id))
      : [];
    const deviceGives = Array.isArray(obj.deviceGives)
      ? (obj.deviceGives as string[]).filter((id) => allIds.has(id))
      : [];
    return {
      app: 'stickerswap-2026',
      type: 'final-trade',
      v: 1,
      deviceReceives,
      deviceGives,
      createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    };
  }

  throw new Error('Unrecognized payload type or version.');
}
