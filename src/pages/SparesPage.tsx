import { useState, useMemo } from 'react';
import { SectionPicker } from '../components/SectionPicker';
import { StickerCard, StickerGrid } from '../components/StickerGrid';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useCollection } from '../lib/CollectionContext';
import { getEntry, incrementDuplicate, decrementDuplicate } from '../lib/collection';
import { getStickersBySection, getAllSections, getAllStickers } from '../lib/stickers';

export function SparesPage() {
  const { collection, updateCollection } = useCollection();
  const defaultSection = useMemo(() => getAllSections()[0]?.code ?? '', []);
  const [section, setSection] = useState(defaultSection);
  const [onlySpares, setOnlySpares] = useState(false);
  const [confirmSpareSticker, setConfirmSpareSticker] = useState<string | null>(null);

  function handleIncrement(stickerId: string) {
    const entry = getEntry(collection, stickerId);
    if (!entry.owned) {
      setConfirmSpareSticker(stickerId);
      return;
    }
    updateCollection(incrementDuplicate(collection, stickerId));
  }

  function handleConfirmAddSpare() {
    if (!confirmSpareSticker) return;
    updateCollection(incrementDuplicate(collection, confirmSpareSticker));
    setConfirmSpareSticker(null);
  }

  const spareSections = useMemo(() => {
    const set = new Set<string>();
    for (const sticker of getAllStickers()) {
      if ((collection[sticker.id]?.duplicateCount ?? 0) > 0) {
        set.add(sticker.sectionCode);
      }
    }
    return set;
  }, [collection]);

  const stickers = useMemo(() => {
    const all = getStickersBySection(section);
    if (!onlySpares) return all;
    return all.filter((s) => (collection[s.id]?.duplicateCount ?? 0) > 0);
  }, [section, onlySpares, collection]);

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Spares</h1>

      <SectionPicker selected={section} onChange={setSection} spareSections={spareSections} />

      {/* Filter toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setOnlySpares(false)}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            !onlySpares ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setOnlySpares(true)}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            onlySpares ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          Only Spares
        </button>
      </div>

      {stickers.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No spares in this section.</p>
      ) : (
        <StickerGrid stickers={stickers}>
          {(sticker) => {
            const entry = getEntry(collection, sticker.id);
            return (
              <StickerCard
                sticker={sticker}
                owned={entry.owned}
                duplicateCount={entry.duplicateCount}
                mode="spares"
                onIncrement={() => handleIncrement(sticker.id)}
                onDecrement={() => updateCollection(decrementDuplicate(collection, sticker.id))}
              />
            );
          }}
        </StickerGrid>
      )}

      {confirmSpareSticker && (
        <ConfirmDialog
          title="Add spare?"
          message="This sticker is not part of your collection. Adding a spare will also add it to your collection. Continue?"
          confirmLabel="Continue"
          onConfirm={handleConfirmAddSpare}
          onCancel={() => setConfirmSpareSticker(null)}
        />
      )}
    </div>
  );
}
