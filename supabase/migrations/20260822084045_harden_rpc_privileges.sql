-- Keep privileged implementations outside the Data API exposed schema. Public
-- functions below are deliberately small SECURITY INVOKER entry points.
alter function public.place_order(text, text, text, public.order_source, uuid, jsonb)
  set schema private;
alter function public.get_order_status(uuid)
  set schema private;
alter function public.update_order_status(uuid, public.order_status)
  set schema private;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC unless this is changed.
-- Revoke that default before creating the public API wrappers.
alter default privileges for role postgres
  revoke execute on functions from public;

revoke all on function private.place_order(text, text, text, public.order_source, uuid, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function private.get_order_status(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.update_order_status(uuid, public.order_status)
  from public, anon, authenticated, service_role;

grant usage on schema private to anon, authenticated;
grant execute on function private.place_order(text, text, text, public.order_source, uuid, jsonb)
  to anon, authenticated;
grant execute on function private.get_order_status(uuid)
  to anon, authenticated;
grant execute on function private.update_order_status(uuid, public.order_status)
  to authenticated;

create function public.place_order(
  p_customer_name text,
  p_customer_phone text,
  p_language text,
  p_source public.order_source,
  p_idempotency_key uuid,
  p_items jsonb
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.place_order(
    p_customer_name,
    p_customer_phone,
    p_language,
    p_source,
    p_idempotency_key,
    p_items
  )
$$;

create function public.get_order_status(p_tracking_key uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.get_order_status(p_tracking_key)
$$;

create function public.update_order_status(
  p_order_id uuid,
  p_status public.order_status
) returns public.orders
language sql
security invoker
set search_path = ''
as $$
  select private.update_order_status(p_order_id, p_status)
$$;

revoke all on function public.place_order(text, text, text, public.order_source, uuid, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.get_order_status(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.update_order_status(uuid, public.order_status)
  from public, anon, authenticated, service_role;

grant execute on function public.place_order(text, text, text, public.order_source, uuid, jsonb)
  to anon, authenticated;
grant execute on function public.get_order_status(uuid)
  to anon, authenticated;
grant execute on function public.update_order_status(uuid, public.order_status)
  to authenticated;

comment on function public.place_order(text, text, text, public.order_source, uuid, jsonb)
  is 'Public order entry point. Authoritative validation and reservation run atomically in private.place_order.';
comment on function public.get_order_status(uuid)
  is 'Returns an order only when supplied with its private high-entropy tracking key.';
comment on function public.update_order_status(uuid, public.order_status)
  is 'Authenticated owner entry point. private.update_order_status enforces owner_users membership.';

-- Make the intentionally internal sequence table explicitly deny direct API use.
create policy no_direct_sequence_access
on public.daily_token_sequences
for all
to anon, authenticated
using (false)
with check (false);

-- Index every foreign key used by order-processing joins and owner history.
create index if not exists order_items_variant_idx
  on public.order_items (variant_id);
create index if not exists status_events_changed_by_idx
  on public.order_status_events (changed_by);
create index if not exists orders_created_by_idx
  on public.orders (created_by);
