-- Functions to allow admin updates/inserts to item_templates via security definer, checking wallet address

create or replace function public.admin_update_item_template(
  p_wallet_address text,
  p_id integer,
  p_item_id text,
  p_name text,
  p_type text,
  p_rarity text,
  p_description text,
  p_source_type text,
  p_image_url text,
  p_slot text,
  p_value integer,
  p_level_requirement integer,
  p_drop_chance numeric
) returns public.item_templates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.item_templates;
begin
  if not public.is_admin_or_super_wallet(p_wallet_address) then
    raise exception 'not authorized';
  end if;

  update public.item_templates
  set item_id = p_item_id,
      name = p_name,
      type = p_type,
      rarity = p_rarity,
      description = p_description,
      source_type = p_source_type,
      image_url = p_image_url,
      slot = p_slot,
      value = p_value,
      level_requirement = p_level_requirement,
      drop_chance = p_drop_chance,
      updated_at = now()
  where id = p_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.admin_insert_item_template(
  p_wallet_address text,
  p_item_id text,
  p_name text,
  p_type text,
  p_rarity text,
  p_description text,
  p_source_type text,
  p_image_url text,
  p_slot text,
  p_value integer,
  p_level_requirement integer,
  p_drop_chance numeric
) returns public.item_templates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.item_templates;
begin
  if not public.is_admin_or_super_wallet(p_wallet_address) then
    raise exception 'not authorized';
  end if;

  insert into public.item_templates (
    item_id, name, type, rarity, description, source_type, image_url, slot, value, level_requirement, drop_chance
  ) values (
    p_item_id, p_name, p_type, p_rarity, p_description, p_source_type, p_image_url, p_slot, p_value, p_level_requirement, p_drop_chance
  )
  returning * into v_row;

  return v_row;
end;
$$;