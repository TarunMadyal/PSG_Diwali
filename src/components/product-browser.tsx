"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, SlidersHorizontal, RefreshCw } from "lucide-react";
import { availableStock } from "@/lib/domain";
import { money } from "@/lib/format";
import { copy } from "@/lib/i18n";
import { getLocalizedName } from "@/lib/kannada";
import type { Category, Product } from "@/lib/types";
import { useApp } from "./app-providers";
import { CartFab } from "./cart-fab";
import { CustomerHeader } from "./customer-header";
import { SizeSelectorGate } from "./size-selector-gate";

function ProductCard({
  product,
  category,
  selectedSize,
  eager = false,
}: {
  product: Product;
  category: Category;
  selectedSize: string;
  eager?: boolean;
}) {
  const { language } = useApp();
  const displayName = getLocalizedName(product.nameEn, product.nameKn, language);
  const secondaryName =
    language === "kn" ? product.nameEn : getLocalizedName(product.nameEn, product.nameKn, "kn");

  // Count available colors for this specific selected size
  const matchingVariants = product.variants.filter(
    (v) =>
      v.active &&
      v.size === selectedSize &&
      availableStock(v.stockOnHand, v.reservedQuantity) > 0,
  );
  const colorCount = matchingVariants.length;

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
        {/* Size Badge on Card */}
        <div className="product-card-size-tag">
          Size {selectedSize}
        </div>
      </div>
      <div className="product-info">
        <h2>{displayName}</h2>
        {secondaryName && secondaryName !== displayName && <p className="subname">{secondaryName}</p>}
        <div className="product-card-bottom">
          <div className="product-card-price-row">
            <div className="price">{money(product.pricePaise, language)}</div>
          </div>
          <div className="product-card-btn">
            <span>
              {colorCount > 1
                ? language === "kn"
                  ? `${colorCount} ಬಣ್ಣಗಳು`
                  : `${colorCount} Colors`
                : copy[language].selectColor}
            </span>
            <ChevronRight size={15} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductBrowser({
  category,
  products,
}: {
  category: Category;
  products: Product[];
}) {
  const { language, categorySizes, setCategorySize, clearCategorySize } = useApp();
  const t = copy[language];
  const categoryTitle = getLocalizedName(category.nameEn, category.nameKn, language);
  const categorySubtitle =
    language === "kn" ? category.nameEn : getLocalizedName(category.nameEn, category.nameKn, "kn");

  const selectedSize = categorySizes[category.slug] || "";

  // If a size is chosen, filter products to only those with in-stock variants for that size
  const sizeFilteredProducts = selectedSize
    ? products.filter((product) => {
        if (!product.active) return false;
        return product.variants.some(
          (v) =>
            v.active &&
            v.size === selectedSize &&
            availableStock(v.stockOnHand, v.reservedQuantity) > 0,
        );
      })
    : [];

  return (
    <div className="customer-shell">
      <CustomerHeader />
      <main className="main">
        <Link className="back-link" href="/">
          <ArrowLeft size={20} />
          {t.back}
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

        {/* STEP 1: SIZE GATE (No products or details shown until size is chosen) */}
        {!selectedSize ? (
          <SizeSelectorGate
            category={category}
            products={products}
            onSelectSize={(size) => setCategorySize(category.slug, size)}
          />
        ) : (
          /* STEP 2: SIZE SELECTED - SHOW FILTERED PRODUCTS WITH SIZE SWITCHER */
          <div>
            {/* Sticky/Prominent Active Size Bar */}
            <div className="active-size-bar">
              <div className="active-size-info">
                <span className="active-size-label">{t.browsingSize}:</span>
                <span className="active-size-badge">{selectedSize}</span>
                <span className="active-size-count">
                  ({sizeFilteredProducts.length}{" "}
                  {language === "kn" ? "ವಿನ್ಯಾಸಗಳು" : sizeFilteredProducts.length === 1 ? "design" : "designs"})
                </span>
              </div>
              <button
                type="button"
                className="change-size-btn"
                onClick={() => clearCategorySize(category.slug)}
              >
                <RefreshCw size={14} />
                <span>{t.changeSize}</span>
              </button>
            </div>

            {sizeFilteredProducts.length > 0 ? (
              <div className="product-grid">
                {sizeFilteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    category={category}
                    selectedSize={selectedSize}
                    eager={index < 4}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ margin: "24px 0" }}>
                <div className="icon">🧺</div>
                <h2>{t.noProductsInSize}</h2>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => clearCategorySize(category.slug)}
                >
                  <SlidersHorizontal size={18} />
                  <span>{t.tryAnotherSize}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <CartFab />
    </div>
  );
}
