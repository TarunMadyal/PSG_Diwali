-- Permanently remove the legacy women's sample catalog only when it has no
-- order history. The explicit guard prevents accidental historical-data loss.
do $$
declare
  referenced_order_items integer;
begin
  select count(*) into referenced_order_items
  from public.order_items as oi
  join public.product_variants as v on v.id = oi.variant_id
  join public.products as p on p.id = v.product_id
  join public.categories as c on c.id = p.category_id
  where c.slug = 'womens-nightwear';

  if referenced_order_items > 0 then
    raise exception 'Cannot purge womens-nightwear: % order item references exist', referenced_order_items;
  end if;

  delete from public.product_variants as v
  using public.products as p, public.categories as c
  where v.product_id = p.id
    and p.category_id = c.id
    and c.slug = 'womens-nightwear';

  delete from public.products as p
  using public.categories as c
  where p.category_id = c.id
    and c.slug = 'womens-nightwear';

  delete from public.categories
  where slug = 'womens-nightwear';
end $$;
