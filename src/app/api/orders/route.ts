import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({ customerName: z.string().trim().min(2).max(60), customerPhone: z.string().trim().max(20).nullable(), language: z.enum(["en", "kn"]), items: z.array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(30) });

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json()); const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || !z.string().uuid().safeParse(idempotencyKey).success) return NextResponse.json({ error: "Missing idempotency key" }, { status: 400 });
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("place_order", { p_customer_name: body.customerName, p_customer_phone: body.customerPhone || null, p_language: body.language, p_source: "customer", p_idempotency_key: idempotencyKey, p_items: body.items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })) });
    if (error) return NextResponse.json({ error: error.message }, { status: error.code === "P0001" ? 409 : 400 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid order" }, { status: 400 }); }
}
