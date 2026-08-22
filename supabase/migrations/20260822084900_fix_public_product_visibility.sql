drop policy if exists public_products on public.products;

create policy public_products
on public.products
for select
to anon, authenticated
using (
  active
  and exists (
    select 1
    from public.product_variants as available_variant
    where available_variant.product_id = products.id
      and available_variant.active
      and available_variant.stock_on_hand > available_variant.reserved_quantity
  )
);
