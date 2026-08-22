"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { availableStock, isProductVisible } from "@/lib/domain";
import { money } from "@/lib/format";
import { copy } from "@/lib/i18n";
import type { Category, Product } from "@/lib/types";
import { useApp } from "./app-providers";
import { CartFab } from "./cart-fab";
import { CustomerHeader } from "./customer-header";

function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const { language, addLine } = useApp();
  const variants = product.variants.filter((variant) => variant.active && availableStock(variant.stockOnHand, variant.reservedQuantity) > 0);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const variant = variants.find((item) => item.id === variantId);
  const max = variant ? availableStock(variant.stockOnHand, variant.reservedQuantity) : 0;
  const t = copy[language];
  return <article className="product-card">
    <div className="art-wrap"><Image src={product.imageUrl} alt={product.nameEn} fill sizes="(max-width: 700px) 50vw, 25vw" loading={eager ? "eager" : "lazy"} /></div>
    <div className="product-info">
      <h2>{language === "kn" ? product.nameKn : product.nameEn}</h2>
      <p className="subname">{language === "kn" ? product.nameEn : product.nameKn}</p>
      <div className="price">{money(product.pricePaise, language)}</div>
      <div className="variant-controls">
        <label><span className="eyebrow">{t.selectVariant}</span><select className="variant-select" value={variantId} onChange={(event) => { setVariantId(event.target.value); setQuantity(1); }} disabled={!variants.length}>{variants.length ? variants.map((item) => <option value={item.id} key={item.id}>{item.size} · {language === "kn" ? item.colorKn : item.colorEn} ({availableStock(item.stockOnHand, item.reservedQuantity)})</option>) : <option>{t.soldOut}</option>}</select></label>
        <div className="qty-row"><span>{t.quantity}</span><div className="stepper"><button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={18} /></button><strong>{quantity}</strong><button aria-label="Increase quantity" onClick={() => setQuantity(Math.min(max, quantity + 1))}><Plus size={18} /></button></div></div>
        <button className="primary full" disabled={!variant} onClick={() => variant && addLine({ lineId: variant.id, productId: product.id, variantId: variant.id, nameEn: product.nameEn, nameKn: product.nameKn, imageUrl: product.imageUrl, size: variant.size, colorEn: variant.colorEn, colorKn: variant.colorKn, unitPricePaise: product.pricePaise, quantity })}>{variant ? t.add : t.soldOut}</button>
      </div>
    </div>
  </article>;
}

export function ProductBrowser({ category, products }: { category: Category; products: Product[] }) {
  const { language } = useApp();
  const visible = products.filter((product) => isProductVisible(product.variants));
  return <div className="customer-shell"><CustomerHeader /><main className="main"><Link className="back-link" href="/"><ArrowLeft size={20} />{copy[language].back}</Link><section className="hero"><h1>{language === "kn" ? category.nameKn : category.nameEn}</h1><p>{language === "kn" ? category.nameEn : category.nameKn}</p></section>{visible.length ? <div className="product-grid">{visible.map((product, index) => <ProductCard product={product} eager={index < 2} key={product.id} />)}</div> : <div className="empty-state"><div className="icon">🧺</div><h2>{copy[language].soldOut}</h2></div>}</main><CartFab /></div>;
}
