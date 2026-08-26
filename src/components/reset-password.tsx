"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "./brand-logo";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const finish = () => setReady(true);
    void supabase.auth.getSession().then(finish);
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") finish();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("The passwords do not match."); return; }
    setBusy(true);
    const supabase = createBrowserSupabase();
    const { data: userResult, error: userError } = await supabase.auth.getUser();
    if (userError || !userResult.user) { setError("This recovery link has expired. Request a new one from the shop owner."); setBusy(false); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(updateError.message); setBusy(false); return; }
    await supabase.auth.signOut();
    router.replace("/owner/login?reset=success");
    router.refresh();
  }

  return <main className="login-shell"><form className="login-card" onSubmit={submit}><BrandLogo priority /><h1>Set new password</h1><p style={{ color: "var(--muted)" }}>Choose a new password for your owner account. Your old password is not needed.</p>{!ready ? <p className="notice">Checking your recovery link…</p> : <><label className="field" style={{ textAlign: "left" }}>New password<input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="field" style={{ textAlign: "left" }}>Confirm new password<input required type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>{error && <p className="notice" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button></>}<p><Link href="/owner/login">Back to owner sign in</Link></p></form></main>;
}
