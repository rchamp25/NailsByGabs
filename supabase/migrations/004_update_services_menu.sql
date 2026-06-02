-- Replace service menu with updated NailsByGabs offerings

do $$
declare
  gelx_id uuid;
  extras_id uuid;
begin
  delete from public.service_items;
  delete from public.service_categories;

  insert into public.service_categories (title, sort_order)
  values ('GELX', 0)
  returning id into gelx_id;

  insert into public.service_categories (title, sort_order)
  values ('Extras', 1)
  returning id into extras_id;

  insert into public.service_items (category_id, name, price, note, sort_order)
  values
    (gelx_id, 'Extra Short Almond', '$28', null, 0),
    (gelx_id, 'Short Almond', '$28', null, 1),
    (gelx_id, 'Medium Almond', '$28', null, 2),
    (gelx_id, 'Short Square', '$28', null, 3),
    (gelx_id, 'Full French', '$33', null, 4),
    (gelx_id, 'Gel Manicure', '$20', null, 5),
    (extras_id, 'Cat eye Full Set', '$32', null, 0),
    (extras_id, 'Full Chrome', '+$3', null, 1),
    (extras_id, 'Isolated Chrome', '+$3', null, 2),
    (
      extras_id,
      'Extra Shaping and Sizing (applies to square sets only)',
      '+$3',
      null,
      3
    ),
    (extras_id, 'Blooming Gel', '+$3', null, 4),
    (extras_id, 'Gems', '+$0.50 per Gem', null, 5),
    (extras_id, 'Aura Full Set', '$36', null, 6),
    (extras_id, 'Glitter Top Coat', '+$2', null, 7);
end $$;
