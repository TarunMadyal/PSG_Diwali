import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  try { const supabase = await createServerSupabase(); const { data, error } = await supabase.rpc("get_order_status", { p_tracking_key: key }); if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 }); return NextResponse.json(data, { headers: { "cache-control": "private, no-store" } }); }
  catch { return NextResponse.json({ error: "Order not found" }, { status: 404 }); }
}
