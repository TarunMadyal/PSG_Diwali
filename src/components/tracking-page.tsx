"use client";
import { Check, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { demoOrders, isDemoMode } from "@/lib/demo-data";
import { copy } from "@/lib/i18n";
import { statusLabel } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { useApp } from "./app-providers";
import { CustomerHeader } from "./customer-header";

const path: OrderStatus[] = ["placed", "accepted", "preparing", "ready", "collected"];
export function TrackingPage({ trackingKey }: { trackingKey: string }) {
  const { language } = useApp(); const [order, setOrder] = useState<Order | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const refresh = useCallback(async () => { setLoading(true); setError(""); try { if (isDemoMode()) { const stored = JSON.parse(localStorage.getItem("psg-demo-orders") ?? "[]") as Order[]; setOrder([...stored, ...demoOrders].find((item) => item.trackingKey === trackingKey) ?? null); } else { const response = await fetch(`/api/orders/track/${trackingKey}`, { cache: "no-store" }); if (!response.ok) throw new Error("Order not found"); setOrder(await response.json()); } } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not refresh"); } finally { setLoading(false); } }, [trackingKey]);
  useEffect(() => { const timer=window.setTimeout(()=>void refresh(),0); const interval = window.setInterval(refresh, 15000); return () => { window.clearTimeout(timer); window.clearInterval(interval); }; }, [refresh]);
  if (!order && !loading) return <div className="customer-shell"><CustomerHeader /><main className="main"><div className="empty-state"><h1>{error || "Order not found"}</h1></div></main></div>;
  if (!order) return <div className="customer-shell"><CustomerHeader /><main className="main"><div className="empty-state">Loading…</div></main></div>;
  const current = path.indexOf(order.status); const exceptional = order.status === "cancelled" || order.status === "expired";
  return <div className="customer-shell"><CustomerHeader /><main className="main"><section className="success-card"><p className="eyebrow">{copy[language].token}</p><div className="token">{order.token}</div><h1>{statusLabel[order.status][language]}</h1><p>{exceptional ? (language === "kn" ? "ಸಹಾಯಕ್ಕಾಗಿ ಅಂಗಡಿಯವರನ್ನು ಸಂಪರ್ಕಿಸಿ." : "Please ask shop staff for help.") : copy[language].readyHelp}</p><div className="status-steps">{exceptional ? <div className="status-step current"><span className="status-dot">!</span><strong>{statusLabel[order.status][language]}</strong></div> : path.map((status, index) => <div className={`status-step ${index < current ? "done" : index === current ? "current" : ""}`} key={status}><span className="status-dot">{index <= current ? <Check size={18} /> : index + 1}</span><div><strong>{statusLabel[status][language]}</strong></div></div>)}</div><button className="secondary full" onClick={refresh} disabled={loading}><RefreshCw size={18} style={{ verticalAlign: "middle" }} /> {copy[language].refresh}</button><p style={{ color: "var(--muted)", fontSize: ".85rem" }}>{copy[language].keepOpen}</p></section></main></div>;
}
