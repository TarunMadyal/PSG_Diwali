"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { copy } from "@/lib/i18n";
import { money } from "@/lib/format";
import { useApp } from "./app-providers";
import { CustomerHeader } from "./customer-header";

export function CartPage() {
  const { language, cart, updateQuantity, totalPaise } = useApp(); const t = copy[language];
  return <div className="customer-shell"><CustomerHeader /><main className="main cart-panel"><Link className="back-link" href="/"><ArrowLeft size={20} />{t.back}</Link><section className="hero"><h1>{t.cart}</h1></section>{cart.length ? <>{cart.map((line) => <div className="cart-line" key={line.lineId}><div className="cart-thumb"><Image src={line.imageUrl} alt="" fill sizes="78px" /></div><div><h3>{language === "kn" ? line.nameKn : line.nameEn}</h3><p>{line.size} · {language === "kn" ? line.colorKn : line.colorEn}</p><strong>{money(line.unitPricePaise * line.quantity, language)}</strong></div><div className="stepper"><button aria-label="Decrease" onClick={() => updateQuantity(line.lineId, line.quantity - 1)}><Minus size={17} /></button><strong>{line.quantity}</strong><button aria-label="Increase" onClick={() => updateQuantity(line.lineId, line.quantity + 1)}><Plus size={17} /></button></div></div>)}<div className="summary"><div className="summary-row"><span>{t.total}</span><span>{money(totalPaise, language)}</span></div></div><Link className="primary full" style={{ display: "grid", placeItems: "center" }} href="/checkout">{t.checkout}</Link></> : <div className="empty-state"><div className="icon">🛍️</div><h2>{t.emptyCart}</h2><Link className="primary" href="/">{t.choose}</Link></div>}</main></div>;
}
