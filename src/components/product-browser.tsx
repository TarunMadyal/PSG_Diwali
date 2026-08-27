"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { availableStock, isProductVisible } from "@/lib/domain";
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
  category?: Category;
  eager?: boolean;
}) {
  const { language, addLine } = useApp();
  const variants = product.variants.filter(
    (variant) => variant.active && availableStock(variant.stockOnHand, variant.reservedQuantity) > 0,
  );
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const variant = variants.find((item) => item.id === variantId) ?? variants[0];
  const max = variant ? availableStock(variant.stockOnHand, variant.reservedQuantity) : 0;
  const t = copy[language];

  const displayName = getLocalizedName(product.nameEn, product.nameKn, language);
  const secondaryName = language === "kn" ? product.nameEn : getLocalizedName(product.nameEn, product.nameKn, "kn");

  return (
    <article className="product-card">
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
        <div className="price">{money(product.pricePaise, language)}</div>
        <div className="variant-controls">
          <label>
            <span className="eyebrow">{t.selectVariant}</span>
            <select
              className="variant-select"
              value={variantId}
              onChange={(event) => {
                setVariantId(event.target.value);
                setQuantity(1);
              }}
              disabled={!variants.length}
            >
              {variants.length ? (
                variants.map((item) => {
                  const sizeLabel = `Size ${item.size}`;
                  const colorPart =
                    item.colorEn && item.colorEn.toLowerCase() !== "standard"
                      ? ` · ${language === "kn" ? getLocalizedName(item.colorEn, item.colorKn, "kn") : item.colorEn}`
                      : "";
                  return (
                    <option value={item.id} key={item.id}>
                      {sizeLabel}
                      {colorPart}
                    </option>
                  );
                })
              ) : (
                <option>{t.soldOut}</option>
              )}
            </select>
          </label>
          <div className="qty-row">
            <span>{t.quantity}</span>
            <div className="stepper">
              <button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus size={18} />
              </button>
              <strong>{quantity}</strong>
              <button aria-label="Increase quantity" onClick={() => setQuantity(Math.min(max, quantity + 1))}>
                <Plus size={18} />
              </button>
            </div>
          </div>
          <button
            className="primary full"
            disabled={!variant}
            onClick={() =>
              variant &&
              addLine({
                lineId: variant.id,
                productId: product.id,
                categoryId: category?.id ?? product.categoryId,
                categoryNameEn: category?.nameEn,
                categoryNameKn: category?.nameKn,
                variantId: variant.id,
                nameEn: product.nameEn,
                nameKn: getLocalizedName(product.nameEn, product.nameKn, "kn"),
                imageUrl: product.imageUrl,
                size: variant.size,
                colorEn: variant.colorEn,
                colorKn: getLocalizedName(variant.colorEn, variant.colorKn, "kn"),
                unitPricePaise: product.pricePaise,
                quantity,
              })
            }
          >
            {variant ? t.add : t.soldOut}
          </button>
        </div>
      </div>
    </article>
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
            alignItems: "flex-start",
            gap: 10,
            boxShadow: "0 3px 12px rgba(212,175,55,0.12)",
          }}
        >
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>🎉</span>
          <div>
            <strong style={{ fontSize: "0.88rem", color: "var(--wine)", display: "block", fontWeight: 900 }}>
              {language === "kn" ? "ವಿಶೇಷ ಕಾಂಬೊ ಆಫರ್: 3 ಬಟ್ಟೆ ಖರೀದಿಸಿ!" : "🔥 Special Combo Offer: Buy Any 3!"}
            </strong>
            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--ink)", lineHeight: 1.35 }}>
              {language === "kn"
                ? `ಈ ${categoryTitle} ಕ್ಯಾಟಗರಿಯ ಯಾವುದೇ 3 ಬಟ್ಟೆ ಖರೀದಿಸಿ — (ಗರಿಷ್ಠ ಬೆಲೆ × 2) + ₹100 ಮಾತ್ರ! (ಉದಾ: ₹250 ರ 3 ಪೀಸ್ = ₹600)`
                : `Buy any 3 items in ${category.nameEn} and get them for (Highest Price × 2) + ₹100! (e.g. 3 of ₹250 = ₹600)`}
            </p>
          </div>
        </div>

        {visible.length ? (
          <div className="product-grid">
            {visible.map((product, index) => (
              <ProductCard product={product} category={category} eager={index < 2} key={product.id} />
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
