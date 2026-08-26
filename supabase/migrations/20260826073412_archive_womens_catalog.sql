-- PSG Diwali is a men's clothing shop. Archive the legacy women's sample catalog
-- instead of deleting it: products and variants can be referenced by order history.
-- Archived records are excluded by the existing public RLS policies and UI filters.
update public.product_variants as v
set active = false,
    updated_at = now()
from public.products as p
join public.categories as c on c.id = p.category_id
where v.product_id = p.id
  and c.slug = 'womens-nightwear'
  and v.active;

update public.products as p
set active = false,
    updated_at = now()
from public.categories as c
where p.category_id = c.id
  and c.slug = 'womens-nightwear'
  and p.active;

update public.categories
set active = false,
    updated_at = now()
where slug = 'womens-nightwear'
  and active;
