"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { availableStock } from "@/lib/domain";
import { money } from "@/lib/format";
import { copy } from "@/lib/i18n";
import { getLocalizedName } from "@/lib/kannada";
import type { Category, Product, Variant } from "@/lib/types";
import { useApp } from "./app-providers";
import { CartFab } from "./cart-fab";
import { CustomerHeader } from "./customer-header";

// Color swatches mapping for visual richness
const COLOR_HEX: Record<string, string> = {
  navy: "#1a2e4c",
  maroon: "#6b1420",
  black: "#202020",
  olive: "#485227",
  white: "#f8f8f8",
  blue: "#1d4ed8",
  red: "#b91c1c",
  green: "#15803d",
  yellow: "#eab308",
  brown: "#78350f",
  grey: "#64748b",
  gray: "#64748b",
  orange: "#ea580c",
  pink: "#db2777",
  purple: "#7e22ce",
  beige: "#d4b996",
  standard: "#8f1d2c",
};

function getColorHex(colorName?: string): string {
  if (!colorName) return "#8f1d2c";
  const key = colorName.toLowerCase().trim();
  return COLOR_HEX[key] || "#8f1d2c";
}

export function ProductDetail({ category, product }: { category: Category; product: Product }) {
  const { language, addLine, categorySizes, setCategorySize, clearCategorySize } = useApp();
  const t = copy[language];

  const activeVariants = useMemo(
    () => product.variants.filter((v) => v.active),
    [product.variants],
  );

  // Available unique sizes in this product
  const uniqueSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    for (const v of activeVariants) {
      if (v.size) sizeSet.add(v.size);
    }
    return Array.from(sizeSet);
  }, [activeVariants]);

  const categorySavedSize = categorySizes[category.slug];

  const [selectedSize, setSelectedSize] = useState<string>(() => {
    if (categorySavedSize && uniqueSizes.includes(categorySavedSize)) {
      return categorySavedSize;
    }
    // Pick first size that has in-stock variant
    const inStockVariant = activeVariants.find(
      (v) => availableStock(v.stockOnHand, v.reservedQuantity) > 0,
    );
    return inStockVariant?.size || uniqueSizes[0] || "";
  });

  // Variants available for selected size
  const variantsForSize = useMemo(() => {
    return activeVariants.filter((v) => v.size === selectedSize);
  }, [activeVariants, selectedSize]);

  // Selected variant for the chosen size (first in-stock variant)
  const selectedVariant: Variant | undefined = useMemo(() => {
    return (
      variantsForSize.find(
        (v) => availableStock(v.stockOnHand, v.reservedQuantity) > 0,
      ) || variantsForSize[0]
    );
  }, [variantsForSize]);

  const maxStock = selectedVariant
    ? availableStock(selectedVariant.stockOnHand, selectedVariant.reservedQuantity)
    : 0;

  const isSoldOut = maxStock <= 0;

  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    setCategorySize(category.slug, size);
    setAddedToast(false);
    setQuantity(1);
  }

  function handleAddToCart() {
    if (!selectedVariant || isSoldOut) return;

    addLine({
      lineId: selectedVariant.id,
      productId: product.id,
      categoryId: category.id,
      categoryNameEn: category.nameEn,
      categoryNameKn: category.nameKn,
      variantId: selectedVariant.id,
      nameEn: product.nameEn,
      nameKn: getLocalizedName(product.nameEn, product.nameKn, "kn"),
      imageUrl: product.imageUrl,
      size: selectedVariant.size,
      colorEn: selectedVariant.colorEn,
      colorKn: getLocalizedName(selectedVariant.colorEn, selectedVariant.colorKn, "kn"),
      unitPricePaise: product.pricePaise,
      quantity,
    });

    clearCategorySize(category.slug);
    setAddedToast(true);
  }

  const displayName = getLocalizedName(product.nameEn, product.nameKn, language);
  const secondaryName = language === "kn" ? product.nameEn : getLocalizedName(product.nameEn, product.nameKn, "kn");
  const categoryTitle = getLocalizedName(category.nameEn, category.nameKn, language);

  return (
    <div className="customer-shell">
      <CustomerHeader />
      <main className="main">
        <Link className="back-link" href={`/shop/${category.slug}`}>
          <ArrowLeft size={20} />
          {t.back} ({categoryTitle})
        </Link>

        <div className="product-detail-layout">
          {/* Left Column: Product Image Gallery */}
          <div className="product-detail-gallery">
            <div className="product-detail-art">
              <Image
                src={product.imageUrl}
                alt={product.nameEn}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 45vw"
              />
              <div className="product-detail-badge">
                {language === "kn" ? "ವಿಶೇಷ ಆಫರ್" : "Festive Special"}
              </div>
            </div>
          </div>

          {/* Right Column: Details & Selection */}
          <div className="product-detail-content">
            <div className="product-detail-header">
              <span className="eyebrow">{categoryTitle}</span>
              <h1>{displayName}</h1>
              {secondaryName && secondaryName !== displayName && <p className="subname">{secondaryName}</p>}
              <div className="product-detail-price" style={{ marginTop: 8 }}>
                {money(product.pricePaise, language)}
              </div>
            </div>

            {/* Offer Banner */}
            <div className="offer-pill-banner">
              <span className="emoji">🎉</span>
              <div>
                <strong>{t.offerTagline}</strong>
              </div>
            </div>

            {/* Size Selection */}
            {uniqueSizes.length > 0 && (
              <div className="option-group">
                <div className="option-group-label">
                  <span>{t.selectSize}</span>
                  {selectedSize && <span className="selected-value">Size {selectedSize}</span>}
                </div>
                <div className="size-pill-grid">
                  {uniqueSizes.map((size) => {
                    const sizeVariants = activeVariants.filter((v) => v.size === size);
                    const totalSizeStock = sizeVariants.reduce(
                      (acc, v) => acc + availableStock(v.stockOnHand, v.reservedQuantity),
                      0,
                    );
                    const isSizeDisabled = totalSizeStock <= 0;
                    const isSizeActive = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        className={`size-pill ${isSizeActive ? "active" : ""}`}
                        disabled={isSizeDisabled}
                        onClick={() => handleSizeSelect(size)}
                        aria-pressed={isSizeActive}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Add to Cart */}
            <div className="product-actions-card">
              <div className="product-actions-top">
                <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>{t.quantity}</span>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1 || isSoldOut}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus size={18} />
                  </button>
                  <strong style={{ minWidth: 24, textAlign: "center" }}>{quantity}</strong>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= maxStock || isSoldOut}
                    onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {addedToast && (
                <div className="toast-feedback">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Sparkles size={18} />
                    <span>{t.addedToCart}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Link
                      href={`/shop/${category.slug}`}
                      style={{
                        color: "#fff",
                        textDecoration: "underline",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                      }}
                    >
                      + {t.choose}
                    </Link>
                    <Link
                      href="/cart"
                      style={{
                        color: "#fff",
                        textDecoration: "underline",
                        fontWeight: 900,
                        fontSize: "0.85rem",
                      }}
                    >
                      {t.cart} →
                    </Link>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="primary full"
                style={{
                  minHeight: 50,
                  fontSize: "1.05rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                disabled={!selectedVariant || isSoldOut}
                onClick={handleAddToCart}
              >
                <ShoppingBag size={20} />
                <span>
                  {isSoldOut
                    ? t.soldOut
                    : `${t.add} · ${money(product.pricePaise * quantity, language)}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <CartFab />
    </div>
  );
}
