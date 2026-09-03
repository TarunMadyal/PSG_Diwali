import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

const patchSchema = z.object({
  customerName: z.string().trim().min(2).max(60).optional(),
  customerPhone: z.string().trim().max(20).nullable().optional(),
  paymentStatus: z.enum(["due", "paid"]).optional(),
  totalPaise: z.number().int().min(0).optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        unitPricePaise: z.number().int().min(0).optional(),
      }),
    )
    .optional(),
});

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: claims } = await supabase.auth.getClaims();
    if (!claims?.claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();
    const client = admin ?? supabase;

    // 1. Fetch order to check status and items
    const { data: order } = await client
      .from("orders")
      .select("id, status, order_items(id, variant_id, quantity)")
      .eq("id", id)
      .single();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // 2. Release reserved stock if order was active
    const activeStatuses = ["placed", "accepted", "preparing", "ready"];
    if (activeStatuses.includes(order.status) && order.order_items) {
      for (const item of order.order_items) {
        if (item.variant_id) {
          // Decrement reserved quantity
          const { data: variant } = await client
            .from("product_variants")
            .select("reserved_quantity")
            .eq("id", item.variant_id)
            .single();

          if (variant) {
            const nextReserved = Math.max(0, (variant.reserved_quantity ?? 0) - item.quantity);
            await client
              .from("product_variants")
              .update({ reserved_quantity: nextReserved, updated_at: new Date().toISOString() })
              .eq("id", item.variant_id);
          }
        }
      }
    }

    // 3. Delete order events, items, and order
    await client.from("order_status_events").delete().eq("order_id", id);
    await client.from("order_items").delete().eq("order_id", id);
    const { error } = await client.from("orders").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete order" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = patchSchema.parse(await request.json());

    const supabase = await createServerSupabase();
    const { data: claims } = await supabase.auth.getClaims();
    if (!claims?.claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();
    const client = admin ?? supabase;

    // 1. Fetch current order
    const { data: currentOrder, error: fetchErr } = await client
      .from("orders")
      .select("id, status, total_paise, order_items(id, variant_id, quantity, unit_price_paise, line_total_paise)")
      .eq("id", id)
      .single();

    if (fetchErr || !currentOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.customerName !== undefined) updates.customer_name = body.customerName;
    if (body.customerPhone !== undefined) updates.customer_phone = body.customerPhone;
    if (body.paymentStatus !== undefined) updates.payment_status = body.paymentStatus;

    // 2. Handle item quantity changes and deletions if provided
    if (body.items !== undefined) {
      const currentItems = currentOrder.order_items ?? [];
      const updatedItemsMap = new Map(body.items.map((i) => [i.id, i]));
      const activeStatuses = ["placed", "accepted", "preparing", "ready"];

      // A. Remove items that were deleted in the editor
      const itemsToDelete = currentItems.filter((orig) => !updatedItemsMap.has(orig.id));
      for (const delItem of itemsToDelete) {
        if (activeStatuses.includes(currentOrder.status) && delItem.variant_id) {
          const { data: variant } = await client
            .from("product_variants")
            .select("reserved_quantity")
            .eq("id", delItem.variant_id)
            .single();

          if (variant) {
            const nextReserved = Math.max(0, (variant.reserved_quantity ?? 0) - delItem.quantity);
            await client
              .from("product_variants")
              .update({ reserved_quantity: nextReserved, updated_at: new Date().toISOString() })
              .eq("id", delItem.variant_id);
          }
        }

        const { error: delErr } = await client.from("order_items").delete().eq("id", delItem.id);
        if (delErr) {
          return NextResponse.json({ error: `Failed to remove item: ${delErr.message}` }, { status: 400 });
        }
      }

      // B. Update remaining items (Note: line_total_paise is generated always stored in postgres, do NOT pass it in update)
      for (const updatedItem of body.items) {
        const existing = currentItems.find((i) => i.id === updatedItem.id);
        if (existing) {
          const unitPrice = updatedItem.unitPricePaise ?? existing.unit_price_paise;

          // Adjust stock reservation difference if order is active
          if (activeStatuses.includes(currentOrder.status) && existing.variant_id) {
            const qtyDiff = updatedItem.quantity - existing.quantity;
            if (qtyDiff !== 0) {
              const { data: variant } = await client
                .from("product_variants")
                .select("reserved_quantity")
                .eq("id", existing.variant_id)
                .single();

              if (variant) {
                const nextReserved = Math.max(0, (variant.reserved_quantity ?? 0) + qtyDiff);
                await client
                  .from("product_variants")
                  .update({ reserved_quantity: nextReserved, updated_at: new Date().toISOString() })
                  .eq("id", existing.variant_id);
              }
            }
          }

          // Update order item in database
          const { error: itemUpdateErr } = await client
            .from("order_items")
            .update({
              quantity: updatedItem.quantity,
              unit_price_paise: unitPrice,
            })
            .eq("id", updatedItem.id);

          if (itemUpdateErr) {
            return NextResponse.json({ error: `Failed to update item: ${itemUpdateErr.message}` }, { status: 400 });
          }
        }
      }
    }

    if (body.totalPaise !== undefined) {
      updates.total_paise = body.totalPaise;
    }

    // 3. Update the order
    const { data: updatedOrder, error: updateErr } = await client
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select("id, token, tracking_key, customer_name, customer_phone, status, source, total_paise, payment_status, created_at, expires_at, order_items(id, product_name_en, product_name_kn, size, color_en, color_kn, quantity, unit_price_paise, line_total_paise)")
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

    return NextResponse.json({
      id: updatedOrder.id,
      token: updatedOrder.token,
      trackingKey: updatedOrder.tracking_key,
      customerName: updatedOrder.customer_name,
      customerPhone: updatedOrder.customer_phone,
      status: updatedOrder.status,
      source: updatedOrder.source,
      totalPaise: updatedOrder.total_paise,
      paymentStatus: updatedOrder.payment_status,
      placedAt: updatedOrder.created_at,
      expiresAt: updatedOrder.expires_at,
      items: (updatedOrder.order_items ?? []).map((i) => ({
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
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update order" }, { status: 400 });
  }
}
