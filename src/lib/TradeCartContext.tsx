import React, { createContext, useContext, useState, useCallback } from 'react';
import type { TradeCart } from '../types/stickers';
import { addToCart, removeFromCart, clearCart } from './trade';

interface TradeCartContextValue {
  cart: TradeCart;
  addToReceiving: (id: string) => void;
  addToGiving: (id: string) => void;
  removeFromReceiving: (id: string) => void;
  removeFromGiving: (id: string) => void;
  resetCart: () => void;
}

const TradeCartContext = createContext<TradeCartContextValue | null>(null);

export function TradeCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<TradeCart>({ receiving: [], giving: [] });

  const addToReceiving = useCallback(
    (id: string) => setCart((c) => addToCart(c, 'receiving', id)),
    []
  );
  const addToGiving = useCallback(
    (id: string) => setCart((c) => addToCart(c, 'giving', id)),
    []
  );
  const removeFromReceiving = useCallback(
    (id: string) => setCart((c) => removeFromCart(c, 'receiving', id)),
    []
  );
  const removeFromGiving = useCallback(
    (id: string) => setCart((c) => removeFromCart(c, 'giving', id)),
    []
  );
  const resetCart = useCallback(() => setCart(clearCart()), []);

  return (
    <TradeCartContext.Provider
      value={{ cart, addToReceiving, addToGiving, removeFromReceiving, removeFromGiving, resetCart }}
    >
      {children}
    </TradeCartContext.Provider>
  );
}

export function useTradeCart(): TradeCartContextValue {
  const ctx = useContext(TradeCartContext);
  if (!ctx) throw new Error('useTradeCart must be used inside TradeCartProvider');
  return ctx;
}
