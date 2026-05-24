import type {
  CollectionMap,
  TradeCart,
  TradeProposal,
  CollectionSnapshot,
} from '../types/stickers';
import { getEntry } from './collection';
import { getAllStickers } from './stickers';

export function calculateTradeProposal(
  myCollection: CollectionMap,
  partnerSnapshot: CollectionSnapshot
): TradeProposal {
  const allStickers = getAllStickers();
  const allIds = new Set(allStickers.map((s) => s.id));

  // I can receive: my missing stickers that partner has as spares
  const iCanReceive = partnerSnapshot.missing
    ? allStickers
        .filter((s) => {
          const myEntry = getEntry(myCollection, s.id);
          return !myEntry.owned && (partnerSnapshot.spares[s.id] ?? 0) > 0;
        })
        .map((s) => s.id)
    : [];

  // I can give: partner's missing stickers that I have as spares
  const iCanGive = partnerSnapshot.missing
    ? allStickers
        .filter((s) => {
          if (!partnerSnapshot.missing.includes(s.id)) return false;
          if (!allIds.has(s.id)) return false;
          const myEntry = getEntry(myCollection, s.id);
          return myEntry.duplicateCount > 0;
        })
        .map((s) => s.id)
    : [];

  return { iCanReceive, iCanGive };
}

export function applyTradeToCollection(
  collection: CollectionMap,
  cart: TradeCart
): CollectionMap {
  let updated = { ...collection };

  for (const stickerId of cart.receiving) {
    const entry = getEntry(updated, stickerId);
    updated = {
      ...updated,
      [stickerId]: {
        ...entry,
        owned: true,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  for (const stickerId of cart.giving) {
    const entry = getEntry(updated, stickerId);
    const newCount = Math.max(0, entry.duplicateCount - 1);
    updated = {
      ...updated,
      [stickerId]: {
        ...entry,
        duplicateCount: newCount,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  return updated;
}

export function getTradeSnapshot(collection: CollectionMap): CollectionSnapshot {
  const allStickers = getAllStickers();
  const missing: string[] = [];
  const spares: Record<string, number> = {};

  for (const sticker of allStickers) {
    const entry = collection[sticker.id];
    if (!entry?.owned) {
      missing.push(sticker.id);
    } else if (entry.duplicateCount > 0) {
      spares[sticker.id] = entry.duplicateCount;
    }
  }

  return {
    app: 'stickerswap-2026',
    type: 'collection-snapshot',
    v: 1,
    missing,
    spares,
  };
}

export function addToCart(cart: TradeCart, side: 'receiving' | 'giving', stickerId: string): TradeCart {
  const list = cart[side];
  if (list.includes(stickerId)) return cart;
  return { ...cart, [side]: [...list, stickerId] };
}

export function removeFromCart(cart: TradeCart, side: 'receiving' | 'giving', stickerId: string): TradeCart {
  return { ...cart, [side]: cart[side].filter((id) => id !== stickerId) };
}

export function clearCart(): TradeCart {
  return { receiving: [], giving: [] };
}
