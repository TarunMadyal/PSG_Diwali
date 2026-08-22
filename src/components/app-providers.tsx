"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine, Language } from "@/lib/types";

type Value = { language: Language; setLanguage: (language: Language) => void; cart: CartLine[]; addLine: (line: CartLine) => void; updateQuantity: (id: string, quantity: number) => void; clearCart: () => void; count: number; totalPaise: number };
const Context = createContext<Value | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedLanguage = localStorage.getItem("psg-language");
      if (savedLanguage === "en" || savedLanguage === "kn") setLanguageState(savedLanguage);
      try { setCart(JSON.parse(localStorage.getItem("psg-cart") ?? "[]") as CartLine[]); } catch { localStorage.removeItem("psg-cart"); }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("psg-cart", JSON.stringify(cart)); }, [cart, ready]);
  const value = useMemo<Value>(() => ({ language, setLanguage: (next) => { setLanguageState(next); localStorage.setItem("psg-language", next); document.documentElement.lang = next; }, cart, addLine: (line) => setCart((items) => { const old = items.find((item) => item.lineId === line.lineId); return old ? items.map((item) => item.lineId === line.lineId ? { ...item, quantity: item.quantity + line.quantity } : item) : [...items, line]; }), updateQuantity: (id, quantity) => setCart((items) => quantity < 1 ? items.filter((item) => item.lineId !== id) : items.map((item) => item.lineId === id ? { ...item, quantity } : item)), clearCart: () => setCart([]), count: cart.reduce((sum, line) => sum + line.quantity, 0), totalPaise: cart.reduce((sum, line) => sum + line.quantity * line.unitPricePaise, 0) }), [cart, language]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp() { const value = useContext(Context); if (!value) throw new Error("Missing AppProviders"); return value; }
