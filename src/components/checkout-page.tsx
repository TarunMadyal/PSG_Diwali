"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/i18n";
import { money } from "@/lib/format";
import { isDemoMode } from "@/lib/demo-data";
import type { Order } from "@/lib/types";
import { useApp } from "./app-providers";
import { CustomerHeader } from "./customer-header";

export function CheckoutPage() {
  const router = useRouter(); const { language, cart, totalPaise, clearCart } = useApp(); const t = copy[language];
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!cart.length || name.trim().length < 2) return; setBusy(true); setError("");
    try {
      const idempotencyKey = crypto.randomUUID(); let order: Pick<Order, "token" | "trackingKey" | "id">;
      if (isDemoMode()) {
        const stored = JSON.parse(localStorage.getItem("psg-demo-orders") ?? "[]") as Order[];
        order = { id: crypto.randomUUID(), token: `A${String(stored.length + 15).padStart(3, "0")}`, trackingKey: crypto.randomUUID() };
        const complete: Order = { ...order, customerName: name.trim(), customerPhone: phone.trim() || undefined, status: "placed", source: "customer", totalPaise, paymentStatus: "due", placedAt: new Date().toISOString(), items: cart.map((line) => ({ id: crypto.randomUUID(), productNameEn: line.nameEn, productNameKn: line.nameKn, size: line.size, colorEn: line.colorEn, colorKn: line.colorKn, quantity: line.quantity, unitPricePaise: line.unitPricePaise, lineTotalPaise: line.unitPricePaise * line.quantity })) };
        localStorage.setItem("psg-demo-orders", JSON.stringify([complete, ...stored]));
      } else {
        const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey }, body: JSON.stringify({ customerName: name.trim(), customerPhone: phone.trim() || null, language, items: cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity })) }) });
        if (!response.ok) throw new Error((await response.json()).error ?? "Order could not be placed"); order = await response.json();
      }
      clearCart(); router.push(`/track/${order.trackingKey}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Order could not be placed"); setBusy(false); }
  }
  return <div className="customer-shell"><CustomerHeader /><main className="main cart-panel"><Link className="back-link" href="/cart"><ArrowLeft size={20} />{t.back}</Link><section className="hero"><h1>{t.checkout}</h1></section><form onSubmit={submit}><label className="field">{t.name}<input required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label><label className="field">{t.phone}<input inputMode="tel" maxLength={20} autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /><small>{t.phoneHelp}</small></label><div className="summary"><div className="summary-row"><span>{t.total}</span><span>{money(totalPaise, language)}</span></div></div>{isDemoMode() && <p className="notice">Demo mode: this order is saved only in this browser, not to the cloud.</p>}{error && <p className="notice" role="alert">{error}</p>}<button className="primary full" disabled={busy || !cart.length}>{busy ? t.placing : t.checkout}</button></form></main></div>;
}
