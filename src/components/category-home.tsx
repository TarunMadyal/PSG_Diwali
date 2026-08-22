"use client";
import Image from "next/image";
import Link from "next/link";
import { isDemoMode } from "@/lib/demo-data";
import type { Category } from "@/lib/types";
import { copy } from "@/lib/i18n";
import { useApp } from "./app-providers";
import { CartFab } from "./cart-fab";
import { CustomerHeader } from "./customer-header";

export function CategoryHome({categories}:{categories:Category[]}) {
  const { language } = useApp();
  const t = copy[language];
  return <div className="customer-shell"><CustomerHeader /><main className="main"><section className="hero"><span className="eyebrow">Padamshree Garments</span><h1>{t.choose}</h1><p>{t.chooseHint}</p>{isDemoMode() && <span className="demo-badge">● DEMO · orders stay on this device</span>}</section><div className="category-grid">{categories.map((category,index) => <Link className="category-card" href={`/shop/${category.slug}`} key={category.id}><div className="art-wrap"><Image src={category.imageUrl} alt="" fill sizes="(max-width: 700px) 50vw, 20vw" loading={index<4?"eager":"lazy"} /></div><div className="category-label">{language === "kn" ? category.nameKn : category.nameEn}<small>{language === "kn" ? category.nameEn : category.nameKn}</small></div></Link>)}</div></main><CartFab /></div>;
}
