import { useState, useMemo } from 'react';
import { SectionPicker } from '../components/SectionPicker';
import { StickerCard, StickerGrid } from '../components/StickerGrid';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useCollection } from '../lib/CollectionContext';
import { setOwned, getEntry } from '../lib/collection';
import { getStickersBySection, getAllSections } from '../lib/stickers';
import { albumSections } from '../data/albumCatalog';

export function CollectionPage() {
  const { collection, updateCollection } = useCollection();
  const defaultSection = useMemo(() => getAllSections()[0]?.code ?? '', []);
  const [section, setSection] = useState(defaultSection);
  const [confirmSticker, setConfirmSticker] = useState<string | null>(null);

  const stickers = useMemo(() => getStickersBySection(section), [section]);

  const sectionMeta = useMemo(
    () => albumSections.find((s) => s.code === section),
    [section]
  );

  const sectionStats = useMemo(() => {
    if (!sectionMeta || sectionMeta.type !== 'country') return null;
    const total = sectionMeta.count;
    const owned = stickers.filter((s) => collection[s.id]?.owned).length;
    return { owned, total };
  }, [sectionMeta, stickers, collection]);

  function handleTap(stickerId: string) {
    const entry = getEntry(collection, stickerId);
    if (entry.owned && entry.duplicateCount > 0) {
      setConfirmSticker(stickerId);
      return;
    }
    updateCollection(setOwned(collection, stickerId, !entry.owned));
  }

  function handleConfirmUnmark() {
    if (!confirmSticker) return;
    updateCollection(setOwned(collection, confirmSticker, false));
    setConfirmSticker(null);
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Collection</h1>

      <SectionPicker selected={section} onChange={setSection} />

      <StickerGrid stickers={stickers}>
        {(sticker) => {
          const entry = getEntry(collection, sticker.id);
          return (
            <StickerCard
              sticker={sticker}
              owned={entry.owned}
              duplicateCount={entry.duplicateCount}
              mode="collection"
              onTap={() => handleTap(sticker.id)}
            />
          );
        }}
      </StickerGrid>

      {sectionStats && (
        <div className="pt-2 pb-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              {sectionStats.owned === sectionStats.total ? (
                <span className="font-semibold text-emerald-600">Complete! All {sectionStats.total} stickers collected.</span>
              ) : (
                <>
                  <span className="font-semibold text-gray-800">{sectionStats.owned}</span>
                  <span className="text-gray-400"> of </span>
                  <span className="font-semibold text-gray-800">{sectionStats.total}</span>
                  <span className="text-gray-500"> stickers collected</span>
                </>
              )}
            </span>
            <span className="text-sm font-bold text-blue-600">
              {Math.round((sectionStats.owned / sectionStats.total) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                sectionStats.owned === sectionStats.total ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(sectionStats.owned / sectionStats.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {confirmSticker && (
        <ConfirmDialog
          title="Remove sticker?"
          message="This sticker has duplicates recorded. Marking it as missing will also clear the duplicate count. Continue?"
          confirmLabel="Yes, mark missing"
          onConfirm={handleConfirmUnmark}
          onCancel={() => setConfirmSticker(null)}
        />
      )}
    </div>
  );
}
