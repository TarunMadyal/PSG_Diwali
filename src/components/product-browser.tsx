"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { isProductVisible } from "@/lib/domain";
import { money } from "@/lib/format";
import { copy } from "@/lib/i18n";
import { getLocalizedName } from "@/lib/kannada";
import type { Category, Product } from "@/lib/types";
import { useApp } from "./app-providers";
import { CartFab } from "./cart-fab";
import { CustomerHeader } from "./customer-header";

function ProductCard({
  product,
  category,
  eager = false,
}: {
  product: Product;
  category: Category;
  eager?: boolean;
}) {
  const { language } = useApp();
  const displayName = getLocalizedName(product.nameEn, product.nameKn, language);
  const secondaryName = language === "kn" ? product.nameEn : getLocalizedName(product.nameEn, product.nameKn, "kn");

  return (
    <Link
      className="product-card"
      href={`/shop/${category.slug}/${product.id}`}
      aria-label={`View ${product.nameEn}`}
    >
      <div className="art-wrap">
        <Image
          src={product.imageUrl}
          alt={product.nameEn}
          fill
          sizes="(max-width: 700px) 50vw, 25vw"
          loading={eager ? "eager" : "lazy"}
        />
      </div>
      <div className="product-info">
        <h2>{displayName}</h2>
        {secondaryName && secondaryName !== displayName && <p className="subname">{secondaryName}</p>}
        <div className="product-card-bottom">
          <div className="product-card-price-row">
            <div className="price">{money(product.pricePaise, language)}</div>
          </div>
          <div className="product-card-btn">
            <span>{copy[language].selectSizeAndColor}</span>
            <ChevronRight size={15} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductBrowser({ category, products }: { category: Category; products: Product[] }) {
  const { language } = useApp();
  const visible = products.filter((product) => isProductVisible(product.variants));
  const categoryTitle = getLocalizedName(category.nameEn, category.nameKn, language);
  const categorySubtitle = language === "kn" ? category.nameEn : getLocalizedName(category.nameEn, category.nameKn, "kn");

  return (
    <div className="customer-shell">
      <CustomerHeader />
      <main className="main">
        <Link className="back-link" href="/">
          <ArrowLeft size={20} />
          {copy[language].back}
        </Link>
        <section className="hero">
          <h1>{categoryTitle}</h1>
          {categorySubtitle && categorySubtitle !== categoryTitle && <p>{categorySubtitle}</p>}
        </section>

        {/* Festive 3-Piece Combo Offer Note */}
        <div
          style={{
            margin: "0 0 16px",
            background: "linear-gradient(135deg, #fff9ee 0%, #fff2d9 100%)",
            border: "2px solid var(--gold)",
            borderRadius: 16,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 3px 12px rgba(212,175,55,0.12)",
          }}
        >
          <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>🎉</span>
          <div>
            <strong style={{ fontSize: "0.92rem", color: "var(--wine)", display: "block", fontWeight: 900 }}>
              {language === "kn" ? "ವಿಶೇಷ ಆಫರ್!" : "🔥 Special Offer!"}
            </strong>
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 700, lineHeight: 1.35 }}>
              {language === "kn"
                ? "ಯಾವುದೇ 3 ಬಟ್ಟೆ ಖರೀದಿಸಿ ಮತ್ತು ರಿಯಾಯಿತಿ ಪಡೆಯಿರಿ"
                : "Buy any 3 and get discount"}
            </p>
          </div>
        </div>

        {visible.length ? (
          <div className="product-grid">
            {visible.map((product, index) => (
              <ProductCard product={product} category={category} eager={index < 4} key={product.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">🧺</div>
            <h2>{copy[language].soldOut}</h2>
          </div>
        )}
      </main>
      <CartFab />
    </div>
  );
}

