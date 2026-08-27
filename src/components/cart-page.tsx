"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Sparkles, Tag } from "lucide-react";
import { copy } from "@/lib/i18n";
import { money } from "@/lib/format";
import { useApp } from "./app-providers";
import { CustomerHeader } from "./customer-header";

export function CartPage() {
  const { language, cart, updateQuantity, subtotalPaise, discountPaise, totalPaise, combos, nudges } = useApp();
  const t = copy[language];

  return (
    <div className="customer-shell">
      <CustomerHeader />
      <main className="main cart-panel">
        <Link className="back-link" href="/">
          <ArrowLeft size={20} />
          {t.back}
        </Link>
        <section className="hero">
          <h1>{t.cart}</h1>
        </section>

        {cart.length ? (
          <>
            {/* Cart Items List */}
            {cart.map((line) => (
              <div className="cart-line" key={line.lineId}>
                <div className="cart-thumb">
                  <Image src={line.imageUrl} alt="" fill sizes="78px" />
                </div>
                <div>
                  <h3>{language === "kn" ? line.nameKn : line.nameEn}</h3>
                  <p>
                    {line.size} · {language === "kn" ? line.colorKn : line.colorEn}
                  </p>
                  <strong>{money(line.unitPricePaise * line.quantity, language)}</strong>
                </div>
                <div className="stepper">
                  <button aria-label="Decrease" onClick={() => updateQuantity(line.lineId, line.quantity - 1)}>
                    <Minus size={17} />
                  </button>
                  <strong>{line.quantity}</strong>
                  <button aria-label="Increase" onClick={() => updateQuantity(line.lineId, line.quantity + 1)}>
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            ))}

            {/* Applied Combo Discounts Banner */}
            {combos.length > 0 && (
              <div
                style={{
                  margin: "14px 0",
                  background: "#eefcf4",
                  border: "1.5px solid #22c55e",
                  borderRadius: 14,
                  padding: "12px 14px",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#15803d", fontWeight: 900, fontSize: "0.9rem" }}>
                  <Sparkles size={16} />
                  <span>
                    {language === "kn" ? "ವಿಶೇಷ ಕಾಂಬೊ ಆಫರ್ ಅನ್ವಯಿಸಲಾಗಿದೆ!" : "🎉 3-Item Combo Offer Applied!"}
                  </span>
                </div>
                {combos.map((combo, idx) => (
                  <div key={idx} style={{ fontSize: "0.82rem", color: "#166534", display: "flex", justifyContent: "space-between" }}>
                    <span>
                      3 × {language === "kn" && combo.categoryNameKn ? combo.categoryNameKn : combo.categoryNameEn} Combo
                    </span>
                    <strong>- {money(combo.savedPaise, language)}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Smart Category Nudges */}
            {nudges.length > 0 && (
              <div
                style={{
                  margin: "10px 0 14px",
                  background: "#fff9ee",
                  border: "1.5px dashed var(--gold)",
                  borderRadius: 14,
                  padding: "10px 14px",
                  display: "grid",
                  gap: 6,
                }}
              >
                {nudges.map((nudge) => (
                  <div key={nudge.categoryId} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--wine)", fontWeight: 700 }}>
                    <Tag size={15} />
                    <span>
                      {language === "kn"
                        ? `ಇನ್ನೊಂದು ${nudge.categoryNameKn || nudge.categoryNameEn} ಸೇರಿಸಿ — 3 ಪೀಸ್ ಕಾಂಬೊ ರಿಯಾಯಿತಿ ಪಡೆಯಿರಿ!`
                        : `Add ${nudge.itemsNeeded} more ${nudge.categoryNameEn} to unlock the 3-Piece Combo Discount!`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Price Summary */}
            <div className="summary" style={{ background: "#fff", border: "1.5px solid #eae3d9", borderRadius: 16, padding: "14px 16px" }}>
              <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.9rem", color: "var(--muted)" }}>
                <span>{language === "kn" ? "ಮೊತ್ತ" : "Item Subtotal"}</span>
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

            <Link className="primary full" style={{ display: "grid", placeItems: "center", minHeight: 48, marginTop: 12 }} href="/checkout">
              {t.checkout}
            </Link>
          </>
        ) : (
          <div className="empty-state">
            <div className="icon">🛍️</div>
            <h2>{t.emptyCart}</h2>
            <Link className="primary" href="/">
              {t.choose}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
