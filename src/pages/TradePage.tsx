import { useState, useMemo } from 'react';
import { ShoppingCart, QrCode, ClipboardPaste, ChevronRight, X, AlertTriangle, Check, Camera } from 'lucide-react';
import { QRScanner } from '../components/QRScanner';
import { useCollection } from '../lib/CollectionContext';
import { useTradeCart } from '../lib/TradeCartContext';
import { getEntry, getMissingStickers, getSparesMap } from '../lib/collection';
import { applyTradeToCollection, getTradeSnapshot, calculateTradeProposal } from '../lib/trade';
import { parseAndValidatePayload, stringifyPayload } from '../lib/qrPayloads';
import { getAllStickers, getStickersBySection, getAllSections } from '../lib/stickers';
import { StickerCard, StickerGrid } from '../components/StickerGrid';
import { SectionPicker } from '../components/SectionPicker';
import { QRModal } from '../components/QRModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { CollectionSnapshot, FinalTradePayload, TradeProposal } from '../types/stickers';

type TradeMode = 'manual' | 'qr';
type ManualSide = 'receive' | 'give';

export function TradePage() {
  const [mode, setMode] = useState<TradeMode>('manual');

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Trade</h1>

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          Manual Trade
        </button>
        <button
          onClick={() => setMode('qr')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mode === 'qr' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          QR Trade
        </button>
      </div>

      {mode === 'manual' ? <ManualTrade /> : <QRTrade />}
    </div>
  );
}

// ─── Manual Trade ──────────────────────────────────────────────────────────

function ManualTrade() {
  const { collection, updateCollection } = useCollection();
  const { cart, addToReceiving, addToGiving, removeFromReceiving, removeFromGiving, resetCart } =
    useTradeCart();
  const [activeSide, setActiveSide] = useState<ManualSide>('receive');
  const defaultSection = useMemo(() => getAllSections()[0]?.code ?? '', []);
  const [section, setSection] = useState(defaultSection);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const stickers = useMemo(() => getStickersBySection(section), [section]);

  const missingIds = useMemo(() => new Set(getMissingStickers(collection)), [collection]);
  const sparesMap = useMemo(() => getSparesMap(collection), [collection]);

  const filteredStickers = useMemo(() => {
    if (activeSide === 'receive') return stickers.filter((s) => missingIds.has(s.id));
    return stickers.filter((s) => (sparesMap[s.id] ?? 0) > 0);
  }, [stickers, activeSide, missingIds, sparesMap]);

  const cartTotal = cart.receiving.length + cart.giving.length;
  const unequal = cart.receiving.length !== cart.giving.length;

  const finalTradePayload: FinalTradePayload | null =
    cartTotal > 0
      ? {
          app: 'stickerswap-2026',
          type: 'final-trade',
          v: 1,
          deviceReceives: cart.receiving,
          deviceGives: cart.giving,
          createdAt: new Date().toISOString(),
        }
      : null;

  function handleConfirmTrade() {
    updateCollection(applyTradeToCollection(collection, cart));
    resetCart();
    setShowConfirm(false);
  }

  return (
    <div className="space-y-4">
      {/* Trading Cart */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-blue-600" />
            <span className="font-semibold text-sm text-gray-900">Trading Cart</span>
            {cartTotal > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                {cartTotal}
              </span>
            )}
          </div>
          {cartTotal > 0 && (
            <button onClick={resetCart} className="text-xs text-gray-400 active:text-gray-600">
              Clear
            </button>
          )}
        </div>

        <CartSection
          label="I receive"
          ids={cart.receiving}
          onRemove={removeFromReceiving}
          color="text-emerald-600"
        />
        <CartSection
          label="I give"
          ids={cart.giving}
          onRemove={removeFromGiving}
          color="text-orange-500"
        />

        {cartTotal === 0 && (
          <p className="text-xs text-gray-400 text-center py-3">
            Browse below and tap stickers to add them
          </p>
        )}

        {unequal && cartTotal > 0 && (
          <div className="mx-4 mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              Unequal trade: receiving {cart.receiving.length}, giving {cart.giving.length}
            </p>
          </div>
        )}

        {cartTotal > 0 && (
          <div className="px-4 pb-4 flex gap-2">
            {finalTradePayload && (
              <button
                onClick={() => setShowQR(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-blue-200 text-blue-600 text-sm font-medium active:bg-blue-50"
              >
                <QrCode size={15} />
                Final QR
              </button>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:bg-blue-700"
            >
              Confirm Trade
            </button>
          </div>
        )}
      </div>

      {/* Browse side toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setActiveSide('receive')}
          className={`flex-1 py-2.5 text-sm font-medium ${
            activeSide === 'receive' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          Browse Missing
        </button>
        <button
          onClick={() => setActiveSide('give')}
          className={`flex-1 py-2.5 text-sm font-medium ${
            activeSide === 'give' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'
          }`}
        >
          Browse Spares
        </button>
      </div>

      <SectionPicker selected={section} onChange={setSection} />

      {filteredStickers.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">
          {activeSide === 'receive'
            ? 'No missing stickers in this section.'
            : 'No spares in this section.'}
        </p>
      ) : (
        <StickerGrid stickers={filteredStickers}>
          {(sticker) => {
            const entry = getEntry(collection, sticker.id);
            const inCart =
              activeSide === 'receive'
                ? cart.receiving.includes(sticker.id)
                : cart.giving.includes(sticker.id);
            return (
              <StickerCard
                sticker={sticker}
                owned={entry.owned}
                duplicateCount={entry.duplicateCount}
                mode={activeSide === 'receive' ? 'trade-receive' : 'trade-give'}
                selected={inCart}
                onTap={() => {
                  if (activeSide === 'receive') {
                    inCart ? removeFromReceiving(sticker.id) : addToReceiving(sticker.id);
                  } else {
                    inCart ? removeFromGiving(sticker.id) : addToGiving(sticker.id);
                  }
                }}
              />
            );
          }}
        </StickerGrid>
      )}

      {showConfirm && (
        <ConfirmDialog
          title="Confirm Trade"
          message={`You are receiving ${cart.receiving.length} sticker(s) and giving ${cart.giving.length} sticker(s). This updates only your device.${unequal ? '\n\nNote: The trade is unequal.' : ''}`}
          confirmLabel="Apply Trade"
          onConfirm={handleConfirmTrade}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showQR && finalTradePayload && (
        <QRModal
          title="Final Trade QR"
          payload={stringifyPayload(finalTradePayload)}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}

function CartSection({
  label,
  ids,
  onRemove,
  color,
}: {
  label: string;
  ids: string[];
  onRemove: (id: string) => void;
  color: string;
}) {
  const allStickers = useMemo(() => {
    const map = new Map(getAllStickers().map((s) => [s.id, s]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, [ids]);

  if (ids.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-gray-50">
      <p className={`text-xs font-semibold mb-1.5 ${color}`}>
        {label} ({ids.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {allStickers.map((s) =>
          s ? (
            <button
              key={s.id}
              onClick={() => onRemove(s.id)}
              className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs text-gray-700 active:bg-gray-200"
            >
              {s.label}
              <X size={10} className="text-gray-400" />
            </button>
          ) : null
        )}
      </div>
    </div>
  );
}

// ─── QR Trade ──────────────────────────────────────────────────────────────

function QRTrade() {
  const { collection } = useCollection();
  const { addToReceiving, addToGiving, resetCart } = useTradeCart();

  const [showMyQR, setShowMyQR] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [parseError, setParseError] = useState('');
  const [proposal, setProposal] = useState<TradeProposal | null>(null);
  const [partnerSnapshot, setPartnerSnapshot] = useState<CollectionSnapshot | null>(null);
  const [selectedReceive, setSelectedReceive] = useState<Set<string>>(new Set());
  const [selectedGive, setSelectedGive] = useState<Set<string>>(new Set());
  const [finalPaste, setFinalPaste] = useState('');
  const [finalError, setFinalError] = useState('');
  const [finalReview, setFinalReview] = useState<FinalTradePayload | null>(null);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [showPartnerScanner, setShowPartnerScanner] = useState(false);
  const [showFinalScanner, setShowFinalScanner] = useState(false);
  const { updateCollection } = useCollection();

  const mySnapshot = useMemo(() => getTradeSnapshot(collection), [collection]);
  const mySnapshotStr = useMemo(() => stringifyPayload(mySnapshot), [mySnapshot]);

  function handleParsePartner() {
    setParseError('');
    try {
      const payload = parseAndValidatePayload(pasteValue.trim());
      if (payload.type !== 'collection-snapshot') {
        setParseError('Expected a collection snapshot payload.');
        return;
      }
      const snap = payload as CollectionSnapshot;
      setPartnerSnapshot(snap);
      const p = calculateTradeProposal(collection, snap);
      setProposal(p);
      setSelectedReceive(new Set(p.iCanReceive));
      setSelectedGive(new Set(p.iCanGive));
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  function handleCreateCart() {
    if (!proposal) return;
    resetCart();
    for (const id of selectedReceive) addToReceiving(id);
    for (const id of selectedGive) addToGiving(id);
    setProposal(null);
    setPartnerSnapshot(null);
    setPasteValue('');
  }

  function handleParseFinal() {
    setFinalError('');
    try {
      const payload = parseAndValidatePayload(finalPaste.trim());
      if (payload.type !== 'final-trade') {
        setFinalError('Expected a final-trade payload.');
        return;
      }
      setFinalReview(payload as FinalTradePayload);
    } catch (e) {
      setFinalError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  function handleApplyFinalTrade() {
    if (!finalReview) return;
    // reversed: partner's deviceReceives = what they want from me (I give)
    // partner's deviceGives = what they give me (I receive)
    const reversedCart = {
      receiving: finalReview.deviceGives,
      giving: finalReview.deviceReceives,
    };
    updateCollection(applyTradeToCollection(collection, reversedCart));
    setFinalReview(null);
    setFinalPaste('');
    setShowFinalConfirm(false);
  }

  return (
    <div className="space-y-4">
      {/* My QR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">My Collection Snapshot</h3>
        <p className="text-xs text-gray-500">
          Share your missing and spare stickers with a trade partner.
        </p>
        <button
          onClick={() => setShowMyQR(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:bg-blue-700"
        >
          <QrCode size={16} />
          Show My Trade QR
        </button>
      </div>

      {/* Partner paste/scan */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">Partner's Collection QR</h3>
        <p className="text-xs text-gray-500">Scan or paste your partner's collection snapshot.</p>
        <button
          onClick={() => setShowPartnerScanner(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold active:bg-gray-800"
        >
          <Camera size={16} />
          Scan Partner's QR
        </button>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or paste manually</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <textarea
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          placeholder="Paste partner QR payload here..."
          className="w-full h-20 px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
        />
        {parseError && <p className="text-xs text-red-500">{parseError}</p>}
        <button
          onClick={handleParsePartner}
          disabled={!pasteValue.trim()}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40 active:bg-emerald-700"
        >
          <ClipboardPaste size={14} className="inline mr-1.5" />
          Process Partner Payload
        </button>
      </div>

      {/* Trade proposal */}
      {proposal && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-900">Trade Proposal</h3>

          <ProposalSection
            label="I can receive"
            ids={Array.from(selectedReceive)}
            allIds={proposal.iCanReceive}
            color="text-emerald-600"
            onToggle={(id) => {
              const next = new Set(selectedReceive);
              next.has(id) ? next.delete(id) : next.add(id);
              setSelectedReceive(next);
            }}
          />
          <ProposalSection
            label="I can give"
            ids={Array.from(selectedGive)}
            allIds={proposal.iCanGive}
            color="text-orange-500"
            onToggle={(id) => {
              const next = new Set(selectedGive);
              next.has(id) ? next.delete(id) : next.add(id);
              setSelectedGive(next);
            }}
          />

          {proposal.iCanReceive.length === 0 && proposal.iCanGive.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">
              No matching stickers found for a trade.
            </p>
          )}

          <button
            onClick={handleCreateCart}
            disabled={selectedReceive.size === 0 && selectedGive.size === 0}
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-40 active:bg-blue-700"
          >
            Create Trading Cart from Proposal
          </button>
        </div>
      )}

      {/* Scan final trade */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">Apply Partner's Final Trade QR</h3>
        <p className="text-xs text-gray-500">
          Scan or paste your partner's Final Trade QR to apply the trade to your device.
        </p>
        <button
          onClick={() => setShowFinalScanner(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold active:bg-gray-800"
        >
          <Camera size={16} />
          Scan Final Trade QR
        </button>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or paste manually</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <textarea
          value={finalPaste}
          onChange={(e) => setFinalPaste(e.target.value)}
          placeholder="Paste final trade payload here..."
          className="w-full h-20 px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
        />
        {finalError && <p className="text-xs text-red-500">{finalError}</p>}
        <button
          onClick={handleParseFinal}
          disabled={!finalPaste.trim()}
          className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-40 active:bg-amber-600"
        >
          Review Final Trade
        </button>
      </div>

      {/* Final trade review */}
      {finalReview && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-900">Review Final Trade</h3>
          <p className="text-xs text-gray-500">
            Created {new Date(finalReview.createdAt).toLocaleString()}
          </p>

          <div>
            <p className="text-xs font-semibold text-emerald-600 mb-1">
              You receive ({finalReview.deviceGives.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {finalReview.deviceGives.map((id) => (
                <span key={id} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-lg">
                  {id}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-orange-500 mb-1">
              You give ({finalReview.deviceReceives.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {finalReview.deviceReceives.map((id) => (
                <span key={id} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-lg">
                  {id}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFinalReview(null)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 active:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowFinalConfirm(true)}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:bg-blue-700"
            >
              Apply Trade
            </button>
          </div>
        </div>
      )}

      {showMyQR && (
        <QRModal
          title="My Collection Snapshot"
          payload={mySnapshotStr}
          onClose={() => setShowMyQR(false)}
        />
      )}

      {showPartnerScanner && (
        <QRScanner
          onScan={(value) => {
            setShowPartnerScanner(false);
            setPasteValue(value);
            setParseError('');
            try {
              const payload = parseAndValidatePayload(value.trim());
              if (payload.type !== 'collection-snapshot') {
                setParseError('Expected a collection snapshot payload.');
                return;
              }
              const snap = payload as CollectionSnapshot;
              setPartnerSnapshot(snap);
              const p = calculateTradeProposal(collection, snap);
              setProposal(p);
              setSelectedReceive(new Set(p.iCanReceive));
              setSelectedGive(new Set(p.iCanGive));
            } catch (e) {
              setParseError(e instanceof Error ? e.message : 'Unknown error');
            }
          }}
          onClose={() => setShowPartnerScanner(false)}
        />
      )}

      {showFinalScanner && (
        <QRScanner
          onScan={(value) => {
            setShowFinalScanner(false);
            setFinalPaste(value);
            setFinalError('');
            try {
              const payload = parseAndValidatePayload(value.trim());
              if (payload.type !== 'final-trade') {
                setFinalError('Expected a final-trade payload.');
                return;
              }
              setFinalReview(payload as FinalTradePayload);
            } catch (e) {
              setFinalError(e instanceof Error ? e.message : 'Unknown error');
            }
          }}
          onClose={() => setShowFinalScanner(false)}
        />
      )}

      {showFinalConfirm && (
        <ConfirmDialog
          title="Apply Final Trade"
          message="This will update your device: add received stickers and decrement given spares. This cannot be undone."
          confirmLabel="Apply"
          onConfirm={handleApplyFinalTrade}
          onCancel={() => setShowFinalConfirm(false)}
        />
      )}
    </div>
  );
}

function ProposalSection({
  label,
  ids,
  allIds,
  color,
  onToggle,
}: {
  label: string;
  ids: string[];
  allIds: string[];
  color: string;
  onToggle: (id: string) => void;
}) {
  const selectedSet = new Set(ids);

  if (allIds.length === 0) return null;

  return (
    <div>
      <p className={`text-xs font-semibold mb-1.5 ${color}`}>
        {label} ({allIds.length} available, {ids.length} selected):
      </p>
      <div className="flex flex-wrap gap-1.5">
        {allIds.map((id) => (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
              selectedSet.has(id)
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-500 border border-transparent'
            }`}
          >
            {selectedSet.has(id) && <Check size={10} />}
            {id}
          </button>
        ))}
      </div>
    </div>
  );
}
