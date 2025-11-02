-- Create secure admin RPC to update dungeon_settings
create or replace function public.admin_update_dungeon_settings(
  p_wallet_address text,
  p_id uuid,
  p_base_hp integer default null,
  p_base_armor integer default null,
  p_base_atk integer default null,
  p_hp_growth numeric default null,
  p_armor_growth numeric default null,
  p_atk_growth numeric default null,
  p_monster_spawn_config jsonb default null,
  p_miniboss_hp_multiplier numeric default null,
  p_miniboss_armor_multiplier numeric default null,
  p_miniboss_atk_multiplier numeric default null,
  p_boss_hp_multipliers jsonb default null,
  p_boss_armor_multipliers jsonb default null,
  p_boss_atk_multipliers jsonb default null
) returns public.dungeon_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.dungeon_settings;
begin
  -- Only allow admins/super wallets
  if not is_admin_or_super_wallet(p_wallet_address) then
    raise exception 'Not authorized to update dungeon settings';
  end if;

  update public.dungeon_settings set
    base_hp = coalesce(p_base_hp, base_hp),
    base_armor = coalesce(p_base_armor, base_armor),
    base_atk = coalesce(p_base_atk, base_atk),
    hp_growth = coalesce(p_hp_growth, hp_growth),
    armor_growth = coalesce(p_armor_growth, armor_growth),
    atk_growth = coalesce(p_atk_growth, atk_growth),
    monster_spawn_config = coalesce(p_monster_spawn_config, monster_spawn_config),
    miniboss_hp_multiplier = coalesce(p_miniboss_hp_multiplier, miniboss_hp_multiplier),
    miniboss_armor_multiplier = coalesce(p_miniboss_armor_multiplier, miniboss_armor_multiplier),
    miniboss_atk_multiplier = coalesce(p_miniboss_atk_multiplier, miniboss_atk_multiplier),
    boss_hp_multipliers = coalesce(p_boss_hp_multipliers, boss_hp_multipliers),
    boss_armor_multipliers = coalesce(p_boss_armor_multipliers, boss_armor_multipliers),
    boss_atk_multipliers = coalesce(p_boss_atk_multipliers, boss_atk_multipliers),
    updated_at = now()
  where id = p_id
  returning * into v_row;

  if not found then
    raise exception 'Dungeon not found or no permission';
  end if;

  return v_row;
end;
$$;

-- Allow calling from client
grant execute on function public.admin_update_dungeon_settings(
  text, uuid, integer, integer, integer, numeric, numeric, numeric, jsonb, numeric, numeric, numeric, jsonb, jsonb, jsonb
) to anon, authenticated;