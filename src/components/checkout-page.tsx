"use client";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/i18n";
import { money } from "@/lib/format";
import { isDemoMode } from "@/lib/demo-data";
import type { Order } from "@/lib/types";
import { useApp } from "./app-providers";
import { CustomerHeader } from "./customer-header";

export function CheckoutPage() {
  const router = useRouter();
  const { language, cart, subtotalPaise, discountPaise, totalPaise, combos, clearCart } = useApp();
  const t = copy[language];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!cart.length || name.trim().length < 2) return;
    setBusy(true);
    setError("");

    try {
      const idempotencyKey = crypto.randomUUID();
      let order: Pick<Order, "token" | "trackingKey" | "id">;

      if (isDemoMode()) {
        const stored = JSON.parse(localStorage.getItem("psg-demo-orders") ?? "[]") as Order[];
        order = {
          id: crypto.randomUUID(),
          token: `A${String(stored.length + 15).padStart(3, "0")}`,
          trackingKey: crypto.randomUUID(),
        };
        const complete: Order = {
          ...order,
          customerName: name.trim(),
          customerPhone: phone.trim() || undefined,
          status: "placed",
          source: "customer",
          totalPaise,
          paymentStatus: "due",
          placedAt: new Date().toISOString(),
          items: cart.map((line) => ({
            id: crypto.randomUUID(),
            productNameEn: line.nameEn,
            productNameKn: line.nameKn,
            size: line.size,
            colorEn: line.colorEn,
            colorKn: line.colorKn,
            quantity: line.quantity,
            unitPricePaise: line.unitPricePaise,
            lineTotalPaise: line.unitPricePaise * line.quantity,
          })),
        };
        localStorage.setItem("psg-demo-orders", JSON.stringify([complete, ...stored]));
      } else {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "idempotency-key": idempotencyKey,
          },
          body: JSON.stringify({
            customerName: name.trim(),
            customerPhone: phone.trim() || null,
            language,
            items: cart.map((line) => ({
              variantId: line.variantId,
              quantity: line.quantity,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error((await response.json()).error ?? "Order could not be placed");
        }
        order = await response.json();
      }

      try {
        localStorage.setItem(
          "psg-active-order",
          JSON.stringify({
            trackingKey: order.trackingKey,
            token: order.token,
            customerName: name.trim(),
            placedAt: new Date().toISOString(),
          }),
        );
      } catch {}

      clearCart();
      router.push(`/track/${order.trackingKey}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Order could not be placed");
      setBusy(false);
    }
  }

  return (
    <div className="customer-shell">
      <CustomerHeader />
      <main className="main cart-panel">
        <Link className="back-link" href="/cart">
          <ArrowLeft size={20} />
          {t.back}
        </Link>
        <section className="hero">
          <h1>{t.checkout}</h1>
        </section>

        <form onSubmit={submit}>
          <label className="field">
            {t.name}
            <input
              required
              minLength={2}
              maxLength={60}
              autoComplete="name"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field">
            {t.phone}
            <input
              inputMode="tel"
              maxLength={20}
              autoComplete="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <small>{t.phoneHelp}</small>
          </label>

          {/* Active Combo Badges if any */}
          {combos.length > 0 && (
            <div
              style={{
                background: "#eefcf4",
                border: "1.5px solid #22c55e",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#15803d",
                fontSize: "0.85rem",
                fontWeight: 800,
              }}
            >
              <Sparkles size={16} />
              <span>
                {language === "kn"
                  ? `ದೀಪಾವಳಿ ಕಾಂಬೊ ಆಫರ್ ಅನ್ವಯಿಸಲಾಗಿದೆ (-${money(discountPaise, language)})`
                  : `Festive 3-Piece Combo Applied (-${money(discountPaise, language)})`}
              </span>
            </div>
          )}

          {/* Price Summary Breakdown */}
          <div className="summary" style={{ background: "#fff", border: "1.5px solid #eae3d9", borderRadius: 16, padding: "14px 16px" }}>
            <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.9rem", color: "var(--muted)" }}>
              <span>{language === "kn" ? "ಮೊತ್ತ" : "Subtotal"}</span>
              <span>{money(subtotalPaise, language)}</span>
            </div>

            {discountPaise > 0 && (
              <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.9rem", color: "#15803d", fontWeight: 800 }}>
                <span>{language === "kn" ? "ಕಾಂಬೊ ರಿಯಾಯಿತಿ" : "Combo Savings"}</span>
                <span>- {money(discountPaise, language)}</span>
              </div>
            )}

            <div
              className="summary-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 8,
                borderTop: "2px solid #ded9d4",
                fontSize: "1.15rem",
                fontWeight: 900,
                color: "var(--wine)",
              }}
            >
              <span>{t.total}</span>
              <span>{money(totalPaise, language)}</span>
            </div>
          </div>

          {isDemoMode() && <p className="notice">Demo mode: this order is saved only in this browser, not to the cloud.</p>}
          {error && (
            <p className="notice" role="alert">
              {error}
            </p>
          )}

          <button className="primary full" disabled={busy || !cart.length} style={{ minHeight: 48, marginTop: 12 }}>
            {busy ? t.placing : t.checkout}
          </button>
        </form>
      </main>
    </div>
  );
}
