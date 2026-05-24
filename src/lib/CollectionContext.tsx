import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CollectionMap } from '../types/stickers';
import { loadCollection, saveCollection } from './storage';

interface CollectionContextValue {
  collection: CollectionMap;
  updateCollection: (next: CollectionMap) => void;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [collection, setCollection] = useState<CollectionMap>(() => loadCollection());

  const updateCollection = useCallback((next: CollectionMap) => {
    setCollection(next);
    saveCollection(next);
  }, []);

  return (
    <CollectionContext.Provider value={{ collection, updateCollection }}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection(): CollectionContextValue {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used inside CollectionProvider');
  return ctx;
}
