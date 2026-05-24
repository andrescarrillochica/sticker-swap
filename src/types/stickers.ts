export type { Sticker } from '../data/albumCatalog';

export type StickerType = 'country' | 'special';

export interface CollectionEntry {
  stickerId: string;
  owned: boolean;
  duplicateCount: number;
  updatedAt: string;
}

export interface CollectionMap {
  [stickerId: string]: CollectionEntry;
}

export interface CollectionSummary {
  total: number;
  owned: number;
  missing: number;
  spares: number;
  percentage: number;
}

export interface TradeCart {
  receiving: string[];
  giving: string[];
}

export interface CollectionSnapshot {
  app: 'stickerswap-2026';
  type: 'collection-snapshot';
  v: 1;
  missing: string[];
  spares: Record<string, number>;
}

export interface FinalTradePayload {
  app: 'stickerswap-2026';
  type: 'final-trade';
  v: 1;
  deviceReceives: string[];
  deviceGives: string[];
  createdAt: string;
}

export type QRPayload = CollectionSnapshot | FinalTradePayload;

export interface TradeProposal {
  iCanReceive: string[];
  iCanGive: string[];
}

