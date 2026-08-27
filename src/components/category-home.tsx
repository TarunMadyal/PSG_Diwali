"use client";
import Image from "next/image";
import Link from "next/link";
import { isDemoMode } from "@/lib/demo-data";
import { copy } from "@/lib/i18n";
import { getLocalizedName } from "@/lib/kannada";
import type { Category } from "@/lib/types";
import { useApp } from "./app-providers";
import { CartFab } from "./cart-fab";
import { CustomerHeader } from "./customer-header";

export function CategoryHome({ categories }: { categories: Category[] }) {
  const { language } = useApp();
  const t = copy[language];

  return (
    <div className="customer-shell">
      <CustomerHeader />
      <main className="main">
        <section className="hero">
          <span className="eyebrow">Padamshree Garments</span>
          <h1>{t.choose}</h1>
          <p>{t.chooseHint}</p>
          {isDemoMode() && <span className="demo-badge">● DEMO · orders stay on this device</span>}
        </section>

        {/* Festive 3-Piece Combo Banner */}
        <div
          style={{
            margin: "0 0 18px",
            background: "linear-gradient(135deg, #fff9ee 0%, #fff0d4 100%)",
            border: "2px solid var(--gold)",
            borderRadius: 16,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 4px 14px rgba(212,175,55,0.12)",
          }}
        >
          <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>🎉</span>
          <div>
            <strong style={{ fontSize: "0.9rem", color: "var(--wine)", display: "block", fontWeight: 900 }}>
              {language === "kn" ? "ವಿಶೇಷ ದೀಪಾವಳಿ ಕಾಂಬೊ ಆಫರ್!" : "✨ Special Festive 3-Piece Combo Offer!"}
            </strong>
            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--ink)", lineHeight: 1.3 }}>
              {language === "kn"
                ? "ಒಂದೇ ಕ್ಯಾಟಗರಿಯ ಯಾವುದೇ 3 ಬಟ್ಟೆ ಖರೀದಿಸಿ — (ಗರಿಷ್ಠ ಬೆಲೆ × 2) + ₹100 ಮಾತ್ರ!"
                : "Buy any 3 items in the same category & get them for (Highest Price × 2) + ₹100!"}
            </p>
          </div>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => {
            const displayName = getLocalizedName(category.nameEn, category.nameKn, language);
            const secondaryName = language === "kn" ? category.nameEn : getLocalizedName(category.nameEn, category.nameKn, "kn");

            return (
              <Link className="category-card" href={`/shop/${category.slug}`} key={category.id}>
                <div className="art-wrap">
                  <Image
                    src={category.imageUrl}
                    alt={category.nameEn}
                    fill
                    sizes="(max-width: 700px) 50vw, 20vw"
                    loading={index < 4 ? "eager" : "lazy"}
                  />
                </div>
                <div className="category-label">
                  {displayName}
                  {secondaryName && secondaryName !== displayName && <small>{secondaryName}</small>}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
      <CartFab />
    </div>
  );
}
