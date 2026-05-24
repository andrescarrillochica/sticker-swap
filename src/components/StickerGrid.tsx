import { Check } from 'lucide-react';
import type { Sticker } from '../types/stickers';

interface StickerCardProps {
  sticker: Sticker;
  owned: boolean;
  duplicateCount?: number;
  mode: 'collection' | 'spares' | 'trade-receive' | 'trade-give';
  selected?: boolean;
  onTap?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function StickerCard({
  sticker,
  owned,
  duplicateCount = 0,
  mode,
  selected = false,
  onTap,
  onIncrement,
  onDecrement,
}: StickerCardProps) {
  if (mode === 'collection') {
    return (
      <button
        onClick={onTap}
        className={`relative flex flex-col items-center justify-center rounded-xl p-2 min-h-[64px] transition-all duration-150 active:scale-95 border-2 overflow-hidden ${
          owned
            ? 'bg-blue-500 border-blue-600 shadow-sm shadow-blue-200'
            : 'bg-white border-gray-200'
        }`}
      >
        {owned && (
          <div className="absolute top-1 right-1 bg-white/25 rounded-full p-0.5">
            <Check size={10} className="text-white" strokeWidth={3} />
          </div>
        )}
        <span className={`text-xs font-bold leading-tight tracking-wide ${owned ? 'text-white' : 'text-gray-600'}`}>
          {sticker.label}
        </span>
      </button>
    );
  }

  if (mode === 'spares') {
    const hasSpares = duplicateCount > 0;
    return (
      <div className={`flex flex-col items-center rounded-xl p-2 gap-1 border-2 ${
        hasSpares
          ? 'bg-blue-500 border-blue-600 shadow-sm shadow-blue-200'
          : 'bg-white border-gray-200'
      }`}>
        <span className={`text-xs font-semibold leading-tight ${hasSpares ? 'text-white' : 'text-gray-700'}`}>
          {sticker.label}
        </span>
        <span className={`text-base font-bold ${hasSpares ? 'text-white' : 'text-gray-300'}`}>
          {duplicateCount}
        </span>
        <div className="flex gap-1 w-full">
          <button
            onClick={onDecrement}
            disabled={duplicateCount === 0}
            className={`flex-1 rounded-lg py-1 text-lg font-bold disabled:opacity-30 active:opacity-80 ${
              hasSpares
                ? 'bg-white/25 text-white'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            }`}
          >
            −
          </button>
          <button
            onClick={onIncrement}
            className={`flex-1 rounded-lg py-1 text-lg font-bold ${
              hasSpares
                ? 'bg-white/25 text-white active:bg-white/40'
                : 'bg-blue-500 text-white active:bg-blue-600'
            }`}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  // trade-receive / trade-give
  return (
    <button
      onClick={onTap}
      className={`relative flex flex-col items-center justify-center rounded-xl p-2 min-h-[64px] transition-all active:scale-95 border ${
        selected
          ? 'bg-emerald-50 border-emerald-400'
          : 'bg-white border-gray-200'
      }`}
    >
      {selected && (
        <div className="absolute top-1 right-1">
          <Check size={12} className="text-emerald-500" strokeWidth={3} />
        </div>
      )}
      <span className="text-xs font-semibold text-gray-700 leading-tight">{sticker.label}</span>
      {duplicateCount > 0 && (
        <span className="text-[10px] text-gray-400">×{duplicateCount}</span>
      )}
    </button>
  );
}

interface StickerGridProps {
  stickers: Sticker[];
  children: (sticker: Sticker) => React.ReactNode;
}

export function StickerGrid({ stickers, children }: StickerGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {stickers.map((s) => (
        <div key={s.id}>{children(s)}</div>
      ))}
    </div>
  );
}


