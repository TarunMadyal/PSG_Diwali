"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, RefreshCw, ShoppingBag, Sparkles } from "lucide-react";
import { useState } from "react";
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
  onAddToCart,
}: {
  product: Product;
  category: Category;
  selectedSize: string;
  eager?: boolean;
  onAddToCart: (product: Product) => void;
}) {
  const { language } = useApp();
  const t = copy[language];
  const displayName = getLocalizedName(product.nameEn, product.nameKn, language);
  const secondaryName =
    language === "kn" ? product.nameEn : getLocalizedName(product.nameEn, product.nameKn, "kn");

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
          <button
            type="button"
            className="product-card-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <ShoppingBag size={14} />
            <span>{t.add}</span>
          </button>
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
  const { language, categorySizes, setCategorySize, clearCategorySize, addLine } = useApp();
  const t = copy[language];
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleAddToCart = (product: Product) => {
    const variant = product.variants.find(
      (v) =>
        v.active &&
        v.size === selectedSize &&
        availableStock(v.stockOnHand, v.reservedQuantity) > 0,
    );
    if (!variant) return;

    addLine({
      lineId: variant.id,
      productId: product.id,
      categoryId: category.id,
      categoryNameEn: category.nameEn,
      categoryNameKn: category.nameKn,
      variantId: variant.id,
      nameEn: product.nameEn,
      nameKn: getLocalizedName(product.nameEn, product.nameKn, "kn"),
      size: variant.size,
      colorEn: variant.colorEn,
      colorKn: getLocalizedName(variant.colorEn, variant.colorKn, "kn"),
      unitPricePaise: product.pricePaise,
      imageUrl: product.imageUrl,
      quantity: 1,
    });

    clearCategorySize(category.slug);
    setToastMessage(t.addedToCartChooseNext);
  };

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

        {/* Toast Notification when product was added and user is reprompted for size */}
        {toastMessage && (
          <div
            style={{
              margin: "0 0 16px",
              background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
              color: "#ffffff",
              borderRadius: 16,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 4px 14px rgba(21, 128, 61, 0.25)",
              fontWeight: 800,
              fontSize: "0.92rem",
            }}
          >
            <Sparkles size={20} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{toastMessage}</span>
          </div>
        )}

        {/* STEP 1: SIZE GATE (No products or details shown until size is chosen) */}
        {!selectedSize ? (
          <SizeSelectorGate
            category={category}
            products={products}
            onSelectSize={(size) => {
              setToastMessage(null);
              setCategorySize(category.slug, size);
            }}
          />
        ) : (
          /* STEP 2: SIZE SELECTED - SHOW FILTERED PRODUCTS WITH SIZE SWITCHER */
          <div>
            {/* Sticky/Prominent Active Size Bar */}
            <div className="active-size-bar">
              <div className="active-size-info">
                <span className="active-size-label">{t.browsingSize}:</span>
                <span className="active-size-badge">{selectedSize}</span>
              </div>
              <button
                type="button"
                className="change-size-btn"
                onClick={() => {
                  setToastMessage(null);
                  clearCategorySize(category.slug);
                }}
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
                    onAddToCart={handleAddToCart}
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
