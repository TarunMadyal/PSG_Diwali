import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Find order by tracking key
    const { data: order, error: fetchErr } = await admin
      .from("orders")
      .select("id, payment_status")
      .eq("tracking_key", key)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Already paid
    if (order.payment_status === "paid") {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    // Mark as paid
    const { error: updateErr } = await admin
      .from("orders")
      .update({
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not confirm payment" }, { status: 500 });
  }
}
