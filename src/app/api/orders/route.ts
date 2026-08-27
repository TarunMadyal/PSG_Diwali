import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { calculateCartPricing } from "@/lib/pricing";

const schema = z.object({
  customerName: z.string().trim().min(2).max(60),
  customerPhone: z.string().trim().max(20).nullable(),
  language: z.enum(["en", "kn"]),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || !z.string().uuid().safeParse(idempotencyKey).success) {
      return NextResponse.json({ error: "Missing idempotency key" }, { status: 400 });
    }
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("place_order", {
      p_customer_name: body.customerName,
      p_customer_phone: body.customerPhone || null,
      p_language: body.language,
      p_source: "customer",
      p_idempotency_key: idempotencyKey,
      p_items: body.items.map((item) => ({
        variantId: item.variantId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.code === "P0001" ? 409 : 400 });
    }

    // Apply authoritative 3-item category combo pricing discount if applicable
    if (data?.id) {
      try {
        const variantIds = body.items.map((i) => i.variantId);
        const { data: variants } = await supabase
          .from("product_variants")
          .select("id, product_id, products(id, category_id, price_paise, categories(name_en, name_kn))")
          .in("id", variantIds);

        if (variants && variants.length > 0) {
          const variantMap = new Map(variants.map((v) => [v.id, v]));
          const pricingItems = body.items.map((item) => {
            const v = variantMap.get(item.variantId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = v?.products as any;
            return {
              categoryId: p?.category_id,
              categoryNameEn: p?.categories?.name_en,
              categoryNameKn: p?.categories?.name_kn,
              unitPricePaise: p?.price_paise ?? 0,
              quantity: item.quantity,
            };
          });

          const pricing = calculateCartPricing(pricingItems);
          if (pricing.discountPaise > 0) {
            await supabase
              .from("orders")
              .update({ total_paise: pricing.totalPaise, updated_at: new Date().toISOString() })
              .eq("id", data.id);
          }
        }
      } catch (err) {
        console.error("Error applying combo discount to placed order:", err);
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid order" }, { status: 400 });
  }
}
