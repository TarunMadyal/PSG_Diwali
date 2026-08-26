-- Keep the public catalog strictly men's clothing. Archive legacy demo records
-- so historical order references remain valid.
update public.product_variants as v
set active = false,
    updated_at = now()
from public.products as p
join public.categories as c on c.id = p.category_id
where v.product_id = p.id
  and c.slug in ('kids-festive', 'leggings')
  and v.active;

update public.products as p
set active = false,
    updated_at = now()
from public.categories as c
where p.category_id = c.id
  and c.slug in ('kids-festive', 'leggings')
  and p.active;

update public.categories
set active = false,
    updated_at = now()
where slug in ('kids-festive', 'leggings')
  and active;
