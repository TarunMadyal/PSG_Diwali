create extension if not exists pgcrypto;
create schema if not exists private;

create type public.order_status as enum ('placed','accepted','preparing','ready','collected','cancelled','expired');
create type public.order_source as enum ('customer','staff');
create type public.payment_status as enum ('due','paid');

create table public.shop_settings (
  id boolean primary key default true check (id),
  shop_name text not null default 'Padamshree Garments',
  timezone text not null default 'Asia/Kolkata',
  token_prefix text not null default 'A' check (token_prefix ~ '^[A-Z]{1,3}$'),
  order_expiry_minutes integer not null default 60 check (order_expiry_minutes between 15 and 1440),
  updated_at timestamptz not null default now()
);
insert into public.shop_settings (id) values (true);

create table public.owner_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_en text not null,
  name_kn text not null,
  image_path text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  name_en text not null,
  name_kn text not null,
  description_en text,
  description_kn text,
  price_paise integer not null check (price_paise >= 0),
  image_path text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  sku text unique,
  size text not null,
  color_en text not null,
  color_kn text not null,
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  sold_quantity integer not null default 0 check (sold_quantity >= 0),
  low_stock_threshold integer not null default 2 check (low_stock_threshold >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_covers_reservations check (stock_on_hand >= reserved_quantity),
  unique (product_id, size, color_en)
);

create table public.daily_token_sequences (
  shop_day date primary key,
  last_value integer not null check (last_value > 0)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  token_day date not null,
  tracking_key uuid not null default gen_random_uuid() unique,
  idempotency_key uuid not null unique,
  customer_name text not null check (char_length(customer_name) between 2 and 60),
  customer_phone text check (customer_phone is null or char_length(customer_phone) <= 20),
  preferred_language text not null default 'en' check (preferred_language in ('en','kn')),
  status public.order_status not null default 'placed',
  source public.order_source not null default 'customer',
  total_paise integer not null check (total_paise >= 0),
  payment_status public.payment_status not null default 'due',
  expires_at timestamptz,
  accepted_at timestamptz,
  preparing_at timestamptz,
  ready_at timestamptz,
  collected_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (token_day, token)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  variant_id uuid not null references public.product_variants(id),
  product_name_en text not null,
  product_name_kn text not null,
  size text not null,
  color_en text not null,
  color_kn text not null,
  quantity integer not null check (quantity > 0),
  unit_price_paise integer not null check (unit_price_paise >= 0),
  line_total_paise integer generated always as (quantity * unit_price_paise) stored,
  unique (order_id, variant_id)
);

create table public.order_status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id),
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

create index products_category_active_idx on public.products(category_id, active, sort_order);
create index variants_product_active_idx on public.product_variants(product_id, active);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index orders_token_day_idx on public.orders(token_day, token);
create index order_items_order_idx on public.order_items(order_id);
create index status_events_order_idx on public.order_status_events(order_id, changed_at);

create or replace function private.is_owner()
returns boolean language sql stable security definer
set search_path = ''
as $$ select exists(select 1 from public.owner_users where user_id = (select auth.uid())) $$;
revoke all on function private.is_owner() from public;
grant execute on function private.is_owner() to authenticated;

create or replace function public.place_order(
  p_customer_name text,
  p_customer_phone text,
  p_language text,
  p_source public.order_source,
  p_idempotency_key uuid,
  p_items jsonb
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_existing public.orders;
  v_order_id uuid := gen_random_uuid();
  v_tracking_key uuid := gen_random_uuid();
  v_timezone text;
  v_prefix text;
  v_expiry integer;
  v_shop_day date;
  v_sequence integer;
  v_token text;
  v_total integer := 0;
  v_item record;
begin
  if p_source = 'staff' and not private.is_owner() then raise exception 'Owner authorization required'; end if;
  if trim(p_customer_name) = '' or char_length(trim(p_customer_name)) not between 2 and 60 then raise exception 'Valid customer name required'; end if;
  if p_language not in ('en','kn') then raise exception 'Invalid language'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Order must contain 1 to 30 items'; end if;

  select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('id',v_existing.id,'token',v_existing.token,'trackingKey',v_existing.tracking_key); end if;

  select timezone, token_prefix, order_expiry_minutes into v_timezone, v_prefix, v_expiry from public.shop_settings where id = true;
  v_shop_day := (clock_timestamp() at time zone v_timezone)::date;

  create temporary table if not exists order_request_items(variant_id uuid primary key, quantity integer not null) on commit drop;
  truncate order_request_items;
  insert into order_request_items(variant_id,quantity)
    select (item->>'variantId')::uuid, sum((item->>'quantity')::integer)
    from jsonb_array_elements(p_items) item
    group by (item->>'variantId')::uuid;
  if exists(select 1 from order_request_items where quantity not between 1 and 20) then raise exception 'Invalid quantity'; end if;
  if (select count(*) from order_request_items) <> jsonb_array_length(p_items) then raise exception 'Duplicate variants are not allowed'; end if;

  perform 1 from public.product_variants v
    join public.products p on p.id = v.product_id
    join public.categories c on c.id = p.category_id
    join order_request_items r on r.variant_id = v.id
    order by v.id for update of v;
  if (select count(*) from order_request_items) <> (
    select count(*) from order_request_items r join public.product_variants v on v.id=r.variant_id join public.products p on p.id=v.product_id join public.categories c on c.id=p.category_id
    where v.active and p.active and c.active and v.stock_on_hand-v.reserved_quantity >= r.quantity
  ) then raise exception 'One or more choices are unavailable or have insufficient stock'; end if;

  select coalesce(sum(p.price_paise*r.quantity),0) into v_total
    from order_request_items r join public.product_variants v on v.id=r.variant_id join public.products p on p.id=v.product_id;

  perform pg_advisory_xact_lock(hashtextextended(v_shop_day::text, 0));
  insert into public.daily_token_sequences(shop_day,last_value) values(v_shop_day,1)
    on conflict(shop_day) do update set last_value=public.daily_token_sequences.last_value+1
    returning last_value into v_sequence;
  v_token := v_prefix || lpad(v_sequence::text,3,'0');

  insert into public.orders(id,token,token_day,tracking_key,idempotency_key,customer_name,customer_phone,preferred_language,source,total_paise,expires_at,created_by)
  values(v_order_id,v_token,v_shop_day,v_tracking_key,p_idempotency_key,trim(p_customer_name),nullif(trim(p_customer_phone),''),p_language,p_source,v_total,clock_timestamp()+make_interval(mins=>v_expiry),case when p_source='staff' then auth.uid() end);

  for v_item in select r.variant_id,r.quantity,p.name_en,p.name_kn,p.price_paise,v.size,v.color_en,v.color_kn
    from order_request_items r join public.product_variants v on v.id=r.variant_id join public.products p on p.id=v.product_id
  loop
    update public.product_variants set reserved_quantity=reserved_quantity+v_item.quantity,updated_at=now() where id=v_item.variant_id;
    insert into public.order_items(order_id,variant_id,product_name_en,product_name_kn,size,color_en,color_kn,quantity,unit_price_paise)
    values(v_order_id,v_item.variant_id,v_item.name_en,v_item.name_kn,v_item.size,v_item.color_en,v_item.color_kn,v_item.quantity,v_item.price_paise);
  end loop;
  insert into public.order_status_events(order_id,to_status,changed_by) values(v_order_id,'placed',auth.uid());
  return jsonb_build_object('id',v_order_id,'token',v_token,'trackingKey',v_tracking_key);
exception when unique_violation then
  select * into v_existing from public.orders where idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('id',v_existing.id,'token',v_existing.token,'trackingKey',v_existing.tracking_key); end if;
  raise;
end
$$;

create or replace function public.get_order_status(p_tracking_key uuid)
returns jsonb language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object('id',o.id,'token',o.token,'trackingKey',o.tracking_key,'customerName',o.customer_name,'status',o.status,'source',o.source,'totalPaise',o.total_paise,'paymentStatus',o.payment_status,'placedAt',o.created_at,'expiresAt',o.expires_at)
  from public.orders o where o.tracking_key=p_tracking_key
$$;

create or replace function public.update_order_status(p_order_id uuid,p_status public.order_status)
returns public.orders language plpgsql security definer
set search_path = ''
as $$
declare v_order public.orders; v_item record; v_old_status public.order_status;
begin
  if not private.is_owner() then raise exception 'Owner authorization required'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  v_old_status := v_order.status;
  if not ((v_order.status='placed' and p_status in ('accepted','cancelled','expired')) or (v_order.status='accepted' and p_status in ('preparing','cancelled','expired')) or (v_order.status='preparing' and p_status in ('ready','cancelled')) or (v_order.status='ready' and p_status in ('collected','cancelled'))) then raise exception 'Invalid status transition'; end if;
  if p_status in ('cancelled','expired') then
    for v_item in select variant_id,quantity from public.order_items where order_id=p_order_id loop
      update public.product_variants set reserved_quantity=reserved_quantity-v_item.quantity,updated_at=now() where id=v_item.variant_id;
    end loop;
  elsif p_status='collected' then
    for v_item in select variant_id,quantity from public.order_items where order_id=p_order_id loop
      update public.product_variants set reserved_quantity=reserved_quantity-v_item.quantity,stock_on_hand=stock_on_hand-v_item.quantity,sold_quantity=sold_quantity+v_item.quantity,updated_at=now() where id=v_item.variant_id;
    end loop;
  end if;
  update public.orders set status=p_status,payment_status=case when p_status='collected' then 'paid' else payment_status end,updated_at=now(),
    accepted_at=case when p_status='accepted' then now() else accepted_at end,
    preparing_at=case when p_status='preparing' then now() else preparing_at end,
    ready_at=case when p_status='ready' then now() else ready_at end,
    collected_at=case when p_status='collected' then now() else collected_at end,
    cancelled_at=case when p_status in ('cancelled','expired') then now() else cancelled_at end
    where id=p_order_id returning * into v_order;
  insert into public.order_status_events(order_id,from_status,to_status,changed_by) values(p_order_id,v_old_status,p_status,auth.uid());
  return v_order;
end
$$;

alter table public.shop_settings enable row level security;
alter table public.owner_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.daily_token_sequences enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;

create policy owner_settings on public.shop_settings for all to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy owner_users_self on public.owner_users for select to authenticated using (user_id=(select auth.uid()));
create policy public_categories on public.categories for select to anon,authenticated using (active);
create policy owner_categories_write on public.categories for all to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy public_products on public.products for select to anon,authenticated using (active and exists(select 1 from public.product_variants v where v.product_id=id and v.active and v.stock_on_hand>v.reserved_quantity));
create policy owner_products_write on public.products for all to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy public_variants on public.product_variants for select to anon,authenticated using (active and stock_on_hand>reserved_quantity);
create policy owner_variants_write on public.product_variants for all to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy owner_orders on public.orders for all to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy owner_order_items on public.order_items for all to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy owner_events on public.order_status_events for select to authenticated using ((select private.is_owner()));

revoke all on all tables in schema public from anon,authenticated;
grant select on public.categories,public.products,public.product_variants to anon,authenticated;
grant select,insert,update,delete on public.shop_settings,public.categories,public.products,public.product_variants,public.orders,public.order_items to authenticated;
grant select on public.owner_users,public.order_status_events to authenticated;
revoke all on function public.place_order(text,text,text,public.order_source,uuid,jsonb) from public;
grant execute on function public.place_order(text,text,text,public.order_source,uuid,jsonb) to anon,authenticated;
revoke all on function public.get_order_status(uuid) from public;
grant execute on function public.get_order_status(uuid) to anon,authenticated;
revoke all on function public.update_order_status(uuid,public.order_status) from public;
grant execute on function public.update_order_status(uuid,public.order_status) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('catalog','catalog',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy catalog_public_read on storage.objects for select to anon,authenticated using (bucket_id='catalog');
create policy catalog_owner_insert on storage.objects for insert to authenticated with check (bucket_id='catalog' and (select private.is_owner()));
create policy catalog_owner_update on storage.objects for update to authenticated using (bucket_id='catalog' and (select private.is_owner())) with check (bucket_id='catalog' and (select private.is_owner()));
create policy catalog_owner_delete on storage.objects for delete to authenticated using (bucket_id='catalog' and (select private.is_owner()));

do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

comment on function public.place_order is 'Atomic, idempotent order creation: locks variants, validates authoritative prices/stock, reserves inventory and allocates a daily token.';
comment on function public.update_order_status is 'Owner-only state transition with atomic reservation release or sale conversion. Expiry is deliberately forbidden after preparation begins.';
