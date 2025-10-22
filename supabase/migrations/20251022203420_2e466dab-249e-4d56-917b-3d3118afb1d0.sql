-- Admin RPC to update building config safely (bypasses RLS via security definer)
create or replace function public.admin_update_building_config(
  p_id uuid,
  p_update jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_or_super_wallet(public.get_current_user_wallet()) then
    raise exception 'Unauthorized';
  end if;

  update public.building_configs
  set
    production_per_hour = coalesce((p_update->>'production_per_hour')::int, production_per_hour),
    cost_wood = coalesce((p_update->>'cost_wood')::int, cost_wood),
    cost_stone = coalesce((p_update->>'cost_stone')::int, cost_stone),
    cost_iron = coalesce((p_update->>'cost_iron')::int, cost_iron),
    cost_gold = coalesce((p_update->>'cost_gold')::int, cost_gold),
    cost_ell = coalesce((p_update->>'cost_ell')::int, cost_ell),
    cost_gt = coalesce((p_update->>'cost_gt')::numeric, cost_gt),
    required_items = coalesce(p_update->'required_items', required_items),
    required_main_hall_level = coalesce((p_update->>'required_main_hall_level')::int, required_main_hall_level),
    upgrade_time_hours = coalesce((p_update->>'upgrade_time_hours')::int, upgrade_time_hours),
    storage_capacity = coalesce((p_update->>'storage_capacity')::int, storage_capacity),
    working_hours = coalesce((p_update->>'working_hours')::int, working_hours),
    updated_at = now()
  where id = p_id;

  return found;
end;
$$;

-- Admin RPC to insert building config safely
create or replace function public.admin_insert_building_config(
  p_data jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin_or_super_wallet(public.get_current_user_wallet()) then
    raise exception 'Unauthorized';
  end if;

  insert into public.building_configs (
    building_id,
    building_name,
    level,
    production_per_hour,
    cost_wood,
    cost_stone,
    cost_iron,
    cost_gold,
    cost_ell,
    cost_gt,
    required_items,
    required_main_hall_level,
    upgrade_time_hours,
    storage_capacity,
    working_hours,
    is_active,
    created_by_wallet_address
  ) values (
    p_data->>'building_id',
    p_data->>'building_name',
    coalesce((p_data->>'level')::int, 1),
    coalesce((p_data->>'production_per_hour')::int, 0),
    coalesce((p_data->>'cost_wood')::int, 0),
    coalesce((p_data->>'cost_stone')::int, 0),
    coalesce((p_data->>'cost_iron')::int, 0),
    coalesce((p_data->>'cost_gold')::int, 0),
    coalesce((p_data->>'cost_ell')::int, 0),
    coalesce((p_data->>'cost_gt')::numeric, 0),
    coalesce(p_data->'required_items', '[]'::jsonb),
    coalesce((p_data->>'required_main_hall_level')::int, 0),
    coalesce((p_data->>'upgrade_time_hours')::int, 1),
    coalesce((p_data->>'storage_capacity')::int, 0),
    coalesce((p_data->>'working_hours')::int, 0),
    coalesce((p_data->>'is_active')::boolean, true),
    public.get_current_user_wallet()
  ) returning id into v_id;

  return v_id;
end;
$$;