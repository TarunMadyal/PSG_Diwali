"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { copy } from "@/lib/i18n";
import { money } from "@/lib/format";
import { useApp } from "./app-providers";
export function CartFab() { const { language, count, totalPaise } = useApp(); if (!count) return null; return <Link href="/cart" className="cart-fab"><span className="cart-count">{count}</span><span><ShoppingBag size={20} /> {copy[language].cart}</span><span>{money(totalPaise, language)}</span></Link>; }
