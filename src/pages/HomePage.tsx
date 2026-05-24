import { useMemo } from 'react';
import { BookOpen, Copy, ArrowLeftRight } from 'lucide-react';
import { useCollection } from '../lib/CollectionContext';
import { getCollectionSummary } from '../lib/collection';
import type { Tab } from '../App';

interface Props {
  onNavigate: (tab: Tab) => void;
}

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function RingProgress({ percentage }: { percentage: number }) {
  const filled = (percentage / 100) * CIRCUMFERENCE;
  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
      <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#2a2a2a" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        stroke="#22c55e"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

export function HomePage({ onNavigate }: Props) {
  const { collection } = useCollection();
  const summary = useMemo(() => getCollectionSummary(collection), [collection]);

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col gap-3 bg-[#111] min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Sticker album</h1>
        <p className="text-sm text-gray-500 mt-0.5">FIFA World Cup 2026</p>
      </div>

      {/* Row 1: Left column (image + progress) + Right column (Collected + Duplicates) */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Left column: Album image + Progress ring */}
        <div className="flex flex-col gap-3">
          {/* Album image */}
          <div className="rounded-2xl overflow-hidden flex-1">
            <img
              src="/panini-logo.png"
              alt="FIFA World Cup 2026 Panini"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Progress ring card */}
          <div className="bg-[#1c1c1c] rounded-2xl p-4 flex-1 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Progress</p>
            <div className="relative flex items-center justify-center">
              <RingProgress percentage={summary.percentage} />
              <div className="absolute flex flex-col items-center">
                <span className="text-white text-2xl font-black leading-none">{summary.percentage}%</span>
                <span className="text-gray-500 text-[10px] font-medium mt-0.5">Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Collected + Duplicates */}
        <div className="flex flex-col gap-3">
          <div
            className="bg-emerald-600 rounded-2xl p-4 flex-1 flex flex-col cursor-pointer active:opacity-90"
            onClick={() => onNavigate('collection')}
          >
            <div className="flex items-start justify-between">
              <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide">Collected</p>
              <div className="bg-white/20 rounded-full p-1.5">
                <BookOpen size={12} className="text-white" />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-white font-black leading-none text-center" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>{summary.owned}</p>
              <p className="text-emerald-200 text-xs mt-1 text-center">{summary.percentage}% complete</p>
            </div>
          </div>

          <div
            className="bg-amber-500 rounded-2xl p-4 flex-1 flex flex-col cursor-pointer active:opacity-90"
            onClick={() => onNavigate('spares')}
          >
            <div className="flex items-start justify-between">
              <p className="text-amber-100 text-xs font-semibold uppercase tracking-wide">Duplicates</p>
              <div className="bg-white/20 rounded-full p-1.5">
                <Copy size={12} className="text-white" />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-white font-black leading-none text-center" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>{summary.spares}</p>
              <p className="text-amber-100 text-xs mt-1 text-center">Tradeable stickers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Trade (left) + Still Missing (right) */}
      <div className="grid grid-cols-2 gap-3" style={{ minHeight: '140px' }}>
        {/* Trade */}
        <div
          className="bg-blue-600 rounded-2xl p-5 flex flex-col justify-between cursor-pointer active:opacity-90"
          onClick={() => onNavigate('trade')}
        >
          <div className="flex items-start justify-between">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Trade</p>
            <div className="bg-white/20 rounded-full p-1.5">
              <ArrowLeftRight size={12} className="text-white" />
            </div>
          </div>
          <p className="text-white font-black leading-none mt-auto" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>{summary.spares}</p>
          <p className="text-blue-200 text-xs mt-1">Swap with others</p>
        </div>

        {/* Still Missing */}
        <div className="bg-red-600 rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-red-200 text-xs font-semibold uppercase tracking-wide">Still Missing</p>
          <p className="text-white font-black leading-none mt-auto" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>{summary.missing}</p>
          <p className="text-red-200 text-xs mt-1">Keep hunting!</p>
        </div>
      </div>
    </div>
  );
}