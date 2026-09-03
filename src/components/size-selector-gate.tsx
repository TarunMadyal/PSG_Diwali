"use client";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { availableStock } from "@/lib/domain";
import { copy } from "@/lib/i18n";
import { getLocalizedName } from "@/lib/kannada";
import type { Category, Product } from "@/lib/types";
import { useApp } from "./app-providers";

interface SizeOption {
  size: string;
  productCount: number;
}

export function SizeSelectorGate({
  category,
  products,
  onSelectSize,
}: {
  category: Category;
  products: Product[];
  onSelectSize: (size: string) => void;
}) {
  const { language } = useApp();
  const t = copy[language];
  const categoryTitle = getLocalizedName(category.nameEn, category.nameKn, language);

  // Calculate distinct available sizes and how many designs have stock for each size
  const sizeOptions = useMemo<SizeOption[]>(() => {
    const sizeMap = new Map<string, number>();

    for (const product of products) {
      if (!product.active) continue;
      // Get all sizes in this product with available stock
      const inStockSizesForThisProduct = new Set<string>();
      for (const variant of product.variants) {
        if (variant.active && availableStock(variant.stockOnHand, variant.reservedQuantity) > 0) {
          if (variant.size) {
            inStockSizesForThisProduct.add(variant.size);
          }
        }
      }
      for (const s of inStockSizesForThisProduct) {
        sizeMap.set(s, (sizeMap.get(s) || 0) + 1);
      }
    }

    // Natural sort: standard clothing sizes order or numeric
    const standardOrder = ["XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL", "Free Size"];
    return Array.from(sizeMap.entries())
      .map(([size, productCount]) => ({ size, productCount }))
      .sort((a, b) => {
        const idxA = standardOrder.indexOf(a.size);
        const idxB = standardOrder.indexOf(b.size);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        const numA = parseInt(a.size, 10);
        const numB = parseInt(b.size, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.size.localeCompare(b.size);
      });
  }, [products]);

  return (
    <div className="size-gate-container">
      <div className="size-gate-card">
        {/* Festive Header Badge */}
        <div className="size-gate-badge">
          <Sparkles size={16} />
          <span>{categoryTitle}</span>
        </div>

        <h2 className="size-gate-title">{t.selectYourSize}</h2>
        <p className="size-gate-subtitle">{t.selectSizeToBrowse}</p>

        {sizeOptions.length > 0 ? (
          <div className="size-gate-grid">
            {sizeOptions.map((opt) => (
              <button
                key={opt.size}
                type="button"
                className="size-gate-btn"
                onClick={() => onSelectSize(opt.size)}
              >
                <div className="size-gate-btn-top">
                  <span className="size-gate-label">{opt.size}</span>
                  <CheckCircle2 size={18} className="size-gate-check" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: "24px 0" }}>
            <div className="icon">🧺</div>
            <h2>{t.soldOut}</h2>
          </div>
        )}
      </div>
    </div>
  );
}
