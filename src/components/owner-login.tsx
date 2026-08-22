"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { isDemoMode } from "@/lib/demo-data";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { BrandLogo } from "./brand-logo";

export function OwnerLogin() {
  const router = useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(""); if (isDemoMode()) { sessionStorage.setItem("psg-demo-owner","true"); router.push("/owner"); return; } const { error: authError } = await createBrowserSupabase().auth.signInWithPassword({ email, password }); if (authError) { setError(authError.message); setBusy(false); return; } router.push("/owner"); router.refresh(); }
  return <main className="login-shell"><form className="login-card" onSubmit={submit}><BrandLogo priority /><h1>Owner sign in</h1><p style={{color:"var(--muted)"}}>Manage orders, stock and the catalog</p>{isDemoMode() && <p className="notice">Demo mode: any email/password opens the sample dashboard.</p>}<label className="field" style={{textAlign:"left"}}>Email<input required type="email" autoComplete="username" value={email} onChange={(e)=>setEmail(e.target.value)} /></label><label className="field" style={{textAlign:"left"}}>Password<input required type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} /></label>{error && <p className="notice" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form></main>;
}
