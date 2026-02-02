do $$
declare
  id_type text;
begin 
  select data_type into id_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'foods' and column_name = 'id';

  if id_type = 'uuid' then
    insert into public.foods (id, owner_id, is_public, food_name, unit, kcal, p, c, f, fiber, type)
    values
      (gen_random_uuid(), null, true, 'Arroz', '100g', 130, 2.7, 28, 0.3, 0, 'carb'),
      (gen_random_uuid(), null, true, 'Pollo', '100g', 165, 31, 0, 3.6, 0, 'protein')
    on conflict do nothing;
  else
    insert into public.foods (id, owner_id, is_public, food_name, unit, kcal, p, c, f, fiber, type)
    values
      ('arroz', null, true, 'Arroz', '100g', 130, 2.7, 28, 0.3, 0, 'carb'),
      ('pollo', null, true, 'Pollo', '100g', 165, 31, 0, 3.6, 0, 'protein')
    on conflict (id) do nothing;
  end if;
end;
$$;
