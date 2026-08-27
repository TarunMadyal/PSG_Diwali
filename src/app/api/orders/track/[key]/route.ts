import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Use admin client if service role key is available to read full order with items
    if (supabaseUrl && serviceRoleKey) {
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: order, error } = await admin
        .from("orders")
        .select(
          "id, token, tracking_key, customer_name, customer_phone, status, source, total_paise, payment_status, created_at, expires_at, order_items(id, product_name_en, product_name_kn, size, color_en, color_kn, quantity, unit_price_paise, line_total_paise)",
        )
        .eq("tracking_key", key)
        .single();

      if (!error && order) {
        return NextResponse.json(
          {
            id: order.id,
            token: order.token,
            trackingKey: order.tracking_key,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            status: order.status,
            source: order.source,
            totalPaise: order.total_paise,
            paymentStatus: order.payment_status,
            placedAt: order.created_at,
            expiresAt: order.expires_at,
            items: (order.order_items ?? []).map((i) => ({
              id: i.id,
              productNameEn: i.product_name_en,
              productNameKn: i.product_name_kn,
              size: i.size,
              colorEn: i.color_en,
              colorKn: i.color_kn,
              quantity: i.quantity,
              unitPricePaise: i.unit_price_paise,
              lineTotalPaise: i.line_total_paise,
            })),
          },
          { headers: { "cache-control": "private, no-store" } },
        );
      }
    }

    // Fallback to RPC get_order_status
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("get_order_status", { p_tracking_key: key });
    if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json(
      {
        ...data,
        items: data.items ?? [],
      },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
