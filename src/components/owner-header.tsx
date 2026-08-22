"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isDemoMode } from "@/lib/demo-data";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { BrandLogo } from "./brand-logo";
export function OwnerHeader() { const router=useRouter(); async function signOut(){if(isDemoMode())sessionStorage.removeItem("psg-demo-owner");else await createBrowserSupabase().auth.signOut();router.push("/owner/login");router.refresh();} return <header className="owner-header"><Link href="/owner"><BrandLogo compact priority /></Link><nav className="owner-nav" aria-label="Owner navigation"><Link href="/owner">Orders</Link><Link href="/owner/catalog">Catalog & stock</Link><Link href="/owner/manual-order">Manual order</Link></nav><div><Link className="secondary" href="/">Shop view</Link> <button className="secondary" onClick={()=>void signOut()}>Sign out</button></div></header>; }
