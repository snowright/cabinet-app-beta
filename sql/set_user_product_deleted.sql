-- Soft-delete / restore a product in the caller's own cabinet.
-- Direct UPDATEs of user_products.deleted_at are rejected by RLS because the
-- SELECT policy filters deleted_at IS NULL. This function runs as its owner,
-- but only ever touches rows where user_id = auth.uid().
create or replace function public.set_user_product_deleted(
  p_user_product_id uuid,
  p_product_id      uuid,
  p_deleted         boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id into v_id
  from user_products
  where user_id = auth.uid()
    and (case when p_user_product_id is not null
              then id = p_user_product_id
              else product_id = p_product_id end)
    -- only flip rows currently in the opposite state
    and (case when p_deleted then deleted_at is null
              else deleted_at is not null end)
  order by deleted_at desc nulls last, created_at desc
  limit 1;

  if v_id is null then
    raise exception 'cabinet item not found for this user';
  end if;

  update user_products
     set deleted_at = case when p_deleted then now() else null end
   where id = v_id;
end;
$$;

revoke all on function public.set_user_product_deleted(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_user_product_deleted(uuid, uuid, boolean) to authenticated;
