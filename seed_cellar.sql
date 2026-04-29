-- ═══════════════════════════════════════════════════════════════
-- The Cellar — Demo Data Seed (v2, hardcoded category IDs)
-- Paste into Supabase SQL Editor → Run
-- Run once. Flags/tasks will duplicate if run again.
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  sid  UUID := '00000000-0000-0000-0000-000000000001';
  t    TIMESTAMPTZ := NOW();

  -- exact category UUIDs from your database
  c_coffee   UUID := '5d15f002-f5e2-4323-b309-557130832193';
  c_cheese   UUID := 'afa612db-5ea9-41fc-89aa-07b3cd0dd490';
  c_supplies UUID := '7b0b365c-0f0e-434e-9009-3f29f11096d2';
  c_acc      UUID := '06db0570-bf0e-4ec5-b2e9-dea64977164d';
  c_other    UUID := '31606930-7108-4a1d-86b8-a70842ea95a2';
  c_cstock   UUID := '47f45212-f976-4a67-a0f3-2fa69a57a7e5';
  c_charcutt UUID := '3df6a288-c384-4b65-9fb7-0afcfac6a732';
  c_produce  UUID := '8a716544-d789-455e-88e8-6a7144c7739f';
  c_dry      UUID := '9a40a018-6ce9-470f-a1d3-1b3ed8201269';
  c_bakery   UUID := '2eb28d56-32c4-4c40-98c6-913a97235d77';
  c_dairy    UUID := 'a2cb9662-89fa-4c76-8c5f-4c9f93fd2158';
  c_sauces   UUID := '729eca6a-cb91-4c2d-9893-abbae2ca192e';
  c_starches UUID := '1688a863-bc2b-4851-bd2d-5b4b06f7fb3b';
  c_meat     UUID := '75933a40-e0b8-44b9-8a02-a8acd69f6146';
  c_desserts UUID := 'fa1b851a-248d-459f-9d7b-11439843813f';

  -- item IDs (fetched after insert)
  i_oatmilk   UUID; i_lemons    UUID; i_baguette  UUID;
  i_prosciutto UUID; i_espresso  UUID; i_butter    UUID;
  i_hotsauce  UUID; i_brie      UUID; i_grapes    UUID;
  i_cream     UUID; i_syrup     UUID; i_walnuts   UUID;
  i_eggs      UUID; i_sourdough UUID; i_salami    UUID;

BEGIN

  -- ── 1. Supplier info ──────────────────────────────────────────
  UPDATE categories SET supplier_name='Local Roasters Co',    supplier_email='orders@localroasters.co'
    WHERE id IN (c_coffee, c_cstock);
  UPDATE categories SET supplier_name='Artisan Provisions',   supplier_email='hello@artisanprov.com'
    WHERE id IN (c_cheese, c_charcutt, c_acc);
  UPDATE categories SET supplier_name='Valley Creamery',      supplier_email='orders@valleycreamery.com'
    WHERE id = c_dairy;
  UPDATE categories SET supplier_name='Green Coast Farms',    supplier_email='supply@greencoast.farm'
    WHERE id = c_produce;
  UPDATE categories SET supplier_name='Morning Stone Bakery', supplier_email='orders@morningstone.co'
    WHERE id = c_bakery;
  UPDATE categories SET supplier_name='Heritage Meats',       supplier_email='orders@heritagemeats.co'
    WHERE id = c_meat;
  UPDATE categories SET supplier_name='Metro Supply Co',      supplier_email='orders@metrosupply.co'
    WHERE id IN (c_dry, c_sauces, c_starches, c_supplies, c_desserts, c_other);

  -- ── 2. Insert items (skips existing by name) ──────────────────

  -- Coffee
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_coffee,n,p,u,co,cm,iw,true FROM (VALUES
    ('Espresso Beans'::text, 3::int,'bags'::text,    true::bool,false::bool,true::bool),
    ('Whole Milk',           6,     'cartons',        true, false, true),
    ('Oat Milk',             6,     'cartons',        true, false, true),
    ('Simple Syrup',         3,     'bottles',       false,  true, true),
    ('Vanilla Syrup',        2,     'bottles',        true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_coffee AND name=v.n);

  -- Coffee Stock
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_cstock,n,p,u,co,cm,iw,true FROM (VALUES
    ('Filters'::text, 100::int,'each'::text,true::bool,false::bool,false::bool),
    ('Cups',          200,     'each',       true, false,false),
    ('Lids',          200,     'each',       true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_cstock AND name=v.n);

  -- Cheese
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_cheese,n,p,u,co,cm,iw,true FROM (VALUES
    ('Aged Cheddar'::text, 2::int,'wedges'::text,true::bool,false::bool,false::bool),
    ('Brie',               3,     'rounds',       true, false,false),
    ('Manchego',           2,     'wedges',       true, false,false),
    ('Gorgonzola',         1,     'wedge',        true, false,false),
    ('Gruyere',            2,     'wedges',       true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_cheese AND name=v.n);

  -- Charcuterie & Proteins
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_charcutt,n,p,u,co,cm,iw,true FROM (VALUES
    ('Prosciutto'::text, 4::int,'packs'::text,true::bool,false::bool,false::bool),
    ('Salami',           3,     'packs',       true, false,false),
    ('Bresaola',         2,     'packs',       true, false,false),
    ('Soppressata',      2,     'packs',       true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_charcutt AND name=v.n);

  -- Produce
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_produce,n,p,u,co,cm,iw,true FROM (VALUES
    ('Lemons'::text,   30::int,'each'::text,   true::bool,false::bool,true::bool),
    ('Limes',          20,     'each',           true, false, true),
    ('Mixed Herbs',     4,     'bunches',        true, false, true),
    ('Red Grapes',      4,     'lbs',            true, false, true),
    ('Arugula',         2,     'bags',           true, false, true)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_produce AND name=v.n);

  -- Dairy & Eggs
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_dairy,n,p,u,co,cm,iw,true FROM (VALUES
    ('Butter'::text,    5::int,'lbs'::text,    true::bool,false::bool,true::bool),
    ('Heavy Cream',     4,     'pints',          true, false, true),
    ('Eggs',            4,     'dozen',          true, false, true),
    ('Ricotta',         3,     'containers',     true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_dairy AND name=v.n);

  -- Bakery & Bread
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_bakery,n,p,u,co,cm,iw,true FROM (VALUES
    ('Baguette'::text,  12::int,'each'::text,  true::bool,false::bool,true::bool),
    ('Sourdough',        6,     'loaves',        true, false, true),
    ('Crackers',         5,     'boxes',         true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_bakery AND name=v.n);

  -- Sauces & Condiments
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_sauces,n,p,u,co,cm,iw,true FROM (VALUES
    ('House Hot Sauce'::text, 4::int,'bottles'::text,false::bool,true::bool, false::bool),
    ('Honey',                  3,    'jars',           true, false,false),
    ('Whole Grain Mustard',    3,    'jars',            true, false,false),
    ('Fig Jam',                3,    'jars',            true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_sauces AND name=v.n);

  -- Dry Goods & Pantry
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_dry,n,p,u,co,cm,iw,true FROM (VALUES
    ('Olive Oil'::text, 4::int,'bottles'::text,true::bool,false::bool,true::bool),
    ('Sea Salt',         2,    'bags',           true, false,false),
    ('Black Pepper',     2,    'containers',     true, false,false),
    ('Flour',           10,    'lbs',             true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_dry AND name=v.n);

  -- Starches & Sides
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_starches,n,p,u,co,cm,iw,true FROM (VALUES
    ('Fingerling Potatoes'::text, 5::int,'lbs'::text,true::bool,false::bool,true::bool),
    ('Polenta',                    3,    'bags',       true, false,false),
    ('White Beans',                3,    'cans',        true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_starches AND name=v.n);

  -- Meat & Fats
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_meat,n,p,u,co,cm,iw,true FROM (VALUES
    ('Duck Breast'::text,  8::int,'portions'::text,true::bool,false::bool,false::bool),
    ('Lamb Chops',          8,    'portions',        true, false,false),
    ('Wagyu Beef',          6,    'portions',        true, false,false),
    ('Lardo',               2,    'slabs',           true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_meat AND name=v.n);

  -- Accoutrements
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_acc,n,p,u,co,cm,iw,true FROM (VALUES
    ('Cornichons'::text,    4::int,'jars'::text,  true::bool,false::bool,false::bool),
    ('Marcona Almonds',      3,    'bags',          true, false,false),
    ('Candied Walnuts',      2,    'bags',         false,  true,false),
    ('Dried Apricots',       2,    'bags',          true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_acc AND name=v.n);

  -- Desserts
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_desserts,n,p,u,co,cm,iw,true FROM (VALUES
    ('Dark Chocolate'::text,   5::int,'bars'::text,  true::bool,false::bool,false::bool),
    ('Vanilla Bean Paste',      2,    'jars',          true, false,false),
    ('Almond Flour',            3,    'bags',          true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_desserts AND name=v.n);

  -- Supplies
  INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
  SELECT c_supplies,n,p,u,co,cm,iw,true FROM (VALUES
    ('Napkins'::text,           500::int,'each'::text,true::bool,false::bool,false::bool),
    ('Biodegradable Straws',    200,     'each',       true, false,false),
    ('To-go Boxes',             100,     'each',       true, false,false)
  ) v(n,p,u,co,cm,iw)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_supplies AND name=v.n);

  -- ── 3. Fetch item IDs ─────────────────────────────────────────
  SELECT id INTO i_oatmilk    FROM items WHERE category_id=c_coffee    AND name='Oat Milk'          LIMIT 1;
  SELECT id INTO i_espresso   FROM items WHERE category_id=c_coffee    AND name='Espresso Beans'    LIMIT 1;
  SELECT id INTO i_syrup      FROM items WHERE category_id=c_coffee    AND name='Simple Syrup'      LIMIT 1;
  SELECT id INTO i_brie       FROM items WHERE category_id=c_cheese    AND name='Brie'              LIMIT 1;
  SELECT id INTO i_prosciutto FROM items WHERE category_id=c_charcutt  AND name='Prosciutto'        LIMIT 1;
  SELECT id INTO i_salami     FROM items WHERE category_id=c_charcutt  AND name='Salami'            LIMIT 1;
  SELECT id INTO i_lemons     FROM items WHERE category_id=c_produce   AND name='Lemons'            LIMIT 1;
  SELECT id INTO i_grapes     FROM items WHERE category_id=c_produce   AND name='Red Grapes'        LIMIT 1;
  SELECT id INTO i_butter     FROM items WHERE category_id=c_dairy     AND name='Butter'            LIMIT 1;
  SELECT id INTO i_cream      FROM items WHERE category_id=c_dairy     AND name='Heavy Cream'       LIMIT 1;
  SELECT id INTO i_eggs       FROM items WHERE category_id=c_dairy     AND name='Eggs'              LIMIT 1;
  SELECT id INTO i_baguette   FROM items WHERE category_id=c_bakery    AND name='Baguette'          LIMIT 1;
  SELECT id INTO i_sourdough  FROM items WHERE category_id=c_bakery    AND name='Sourdough'         LIMIT 1;
  SELECT id INTO i_hotsauce   FROM items WHERE category_id=c_sauces    AND name='House Hot Sauce'   LIMIT 1;
  SELECT id INTO i_walnuts    FROM items WHERE category_id=c_acc       AND name='Candied Walnuts'   LIMIT 1;

  -- ── 4. Historical FLAGS (~85 over 60 days) ────────────────────

  -- Oat Milk: 5x (runs out weekly)
  IF i_oatmilk IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_oatmilk,'Maya',   t-'57 days'::interval,'last carton',       'received'),
      (i_oatmilk,'Jordan', t-'46 days'::interval, NULL,               'received'),
      (i_oatmilk,'Sam',    t-'35 days'::interval,'going fast',         'received'),
      (i_oatmilk,'Maya',   t-'22 days'::interval,'down to 1',          'received'),
      (i_oatmilk,'Priya',  t-'9 days'::interval,  NULL,               'received');
  END IF;

  -- Lemons: 5x
  IF i_lemons IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_lemons,'Jordan', t-'59 days'::interval, NULL,                        'received'),
      (i_lemons,'Sam',    t-'47 days'::interval,'need more for tonight service','received'),
      (i_lemons,'Alex',   t-'34 days'::interval, NULL,                        'received'),
      (i_lemons,'Jordan', t-'19 days'::interval, NULL,                        'received'),
      (i_lemons,'Maya',   t-'4 days'::interval,  NULL,                        'pending');
  END IF;

  -- Baguette: 5x
  IF i_baguette IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_baguette,'Priya', t-'56 days'::interval,'sold out by 7pm',    'received'),
      (i_baguette,'Sam',   t-'44 days'::interval, NULL,                'received'),
      (i_baguette,'Alex',  t-'32 days'::interval, NULL,                'received'),
      (i_baguette,'Priya', t-'18 days'::interval,'Friday always runs out','received'),
      (i_baguette,'Maya',  t-'5 days'::interval,  NULL,                'pending');
  END IF;

  -- Prosciutto: 4x
  IF i_prosciutto IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_prosciutto,'Alex',   t-'53 days'::interval, NULL,             'received'),
      (i_prosciutto,'Jordan', t-'40 days'::interval,'busy board night', 'received'),
      (i_prosciutto,'Sam',    t-'26 days'::interval, NULL,             'received'),
      (i_prosciutto,'Alex',   t-'11 days'::interval, NULL,             'ordered');
  END IF;

  -- Espresso Beans: 4x
  IF i_espresso IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_espresso,'Maya',   t-'55 days'::interval, NULL,               'received'),
      (i_espresso,'Priya',  t-'42 days'::interval,'half a bag left',   'received'),
      (i_espresso,'Jordan', t-'29 days'::interval, NULL,               'received'),
      (i_espresso,'Maya',   t-'13 days'::interval, NULL,               'received');
  END IF;

  -- Butter: 4x
  IF i_butter IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_butter,'Sam',    t-'51 days'::interval, NULL,                 'received'),
      (i_butter,'Alex',   t-'38 days'::interval,'used a lot for boards','received'),
      (i_butter,'Priya',  t-'24 days'::interval, NULL,                 'received'),
      (i_butter,'Sam',    t-'8 days'::interval,  NULL,                 'ordered');
  END IF;

  -- House Hot Sauce: 3x (house-made, flags drive kitchen tasks)
  IF i_hotsauce IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_hotsauce,'Jordan', t-'49 days'::interval,'almost out',        'received'),
      (i_hotsauce,'Maya',   t-'31 days'::interval, NULL,               'received'),
      (i_hotsauce,'Alex',   t-'14 days'::interval,'last bottle',        'received');
  END IF;

  -- Brie: 3x
  IF i_brie IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_brie,'Priya',  t-'48 days'::interval, NULL,                   'received'),
      (i_brie,'Sam',    t-'33 days'::interval,'cheese board popular rn','received'),
      (i_brie,'Jordan', t-'16 days'::interval, NULL,                   'received');
  END IF;

  -- Red Grapes: 3x
  IF i_grapes IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_grapes,'Alex',   t-'45 days'::interval, NULL,                 'received'),
      (i_grapes,'Maya',   t-'28 days'::interval, NULL,                 'received'),
      (i_grapes,'Priya',  t-'10 days'::interval, NULL,                 'received');
  END IF;

  -- Heavy Cream: 3x
  IF i_cream IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_cream,'Sam',    t-'43 days'::interval, NULL,                   'received'),
      (i_cream,'Jordan', t-'27 days'::interval, NULL,                   'received'),
      (i_cream,'Alex',   t-'7 days'::interval,  NULL,                   'received');
  END IF;

  -- 2x flags each: eggs, sourdough, salami, simple syrup, walnuts
  IF i_eggs      IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_eggs,     'Maya',   t-'41 days'::interval,NULL,'received'),(i_eggs,     'Priya', t-'17 days'::interval,NULL,'received'); END IF;
  IF i_sourdough IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_sourdough,'Jordan', t-'37 days'::interval,NULL,'received'),(i_sourdough,'Sam',   t-'12 days'::interval,NULL,'received'); END IF;
  IF i_salami    IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_salami,   'Alex',   t-'36 days'::interval,NULL,'received'),(i_salami,   'Jordan',t-'15 days'::interval,NULL,'received'); END IF;
  IF i_syrup     IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_syrup,    'Sam',    t-'39 days'::interval,NULL,'received'),(i_syrup,    'Maya',  t-'20 days'::interval,NULL,'received'); END IF;
  IF i_walnuts   IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_walnuts,  'Priya',  t-'30 days'::interval,NULL,'received'),(i_walnuts,  'Alex',  t-'6 days'::interval, NULL,'received'); END IF;

  -- ── 5. TASKS: kitchen prep history ───────────────────────────
  IF i_hotsauce IS NOT NULL THEN
    INSERT INTO tasks (item_id,flagged_by,flagged_at,note,urgency,status) VALUES
      (i_hotsauce,'Jordan', t-'50 days'::interval,'batch for the week', 'normal','done'),
      (i_hotsauce,'Maya',   t-'32 days'::interval, NULL,                'normal','done'),
      (i_hotsauce,'Alex',   t-'15 days'::interval,'running very low',   'urgent','done'),
      (i_hotsauce,'Sam',    t-'2 days'::interval,  NULL,                'normal','pending');
  END IF;

  IF i_syrup IS NOT NULL THEN
    INSERT INTO tasks (item_id,flagged_by,flagged_at,note,urgency,status) VALUES
      (i_syrup,'Sam',    t-'54 days'::interval,'need for morning',   'normal','done'),
      (i_syrup,'Priya',  t-'38 days'::interval, NULL,                'normal','done'),
      (i_syrup,'Jordan', t-'21 days'::interval,'going fast this week','urgent','done'),
      (i_syrup,'Sam',    t-'3 days'::interval,  NULL,                'normal','in_progress');
  END IF;

  IF i_walnuts IS NOT NULL THEN
    INSERT INTO tasks (item_id,flagged_by,flagged_at,note,urgency,status) VALUES
      (i_walnuts,'Maya',   t-'44 days'::interval, NULL,              'normal','done'),
      (i_walnuts,'Alex',   t-'23 days'::interval,'boards tonight',   'urgent','done'),
      (i_walnuts,'Priya',  t-'1 days'::interval,  NULL,              'normal','pending');
  END IF;

  -- ── 6. INVENTORY COUNTS (drives below-par view) ──────────────
  IF i_oatmilk    IS NOT NULL THEN INSERT INTO inventory_counts (item_id,shop_id,counted_by,quantity,counted_at) VALUES
    (i_oatmilk,    sid,'Maya',   4, t-'14 days'::interval),
    (i_oatmilk,    sid,'Jordan', 1, t-'2 days'::interval); END IF;
  IF i_lemons     IS NOT NULL THEN INSERT INTO inventory_counts (item_id,shop_id,counted_by,quantity,counted_at) VALUES
    (i_lemons,     sid,'Sam',   10, t-'10 days'::interval),
    (i_lemons,     sid,'Alex',   4, t-'1 days'::interval); END IF;
  IF i_baguette   IS NOT NULL THEN INSERT INTO inventory_counts (item_id,shop_id,counted_by,quantity,counted_at) VALUES
    (i_baguette,   sid,'Priya',  8, t-'7 days'::interval),
    (i_baguette,   sid,'Sam',    3, t-'1 days'::interval); END IF;
  IF i_prosciutto IS NOT NULL THEN INSERT INTO inventory_counts (item_id,shop_id,counted_by,quantity,counted_at) VALUES
    (i_prosciutto, sid,'Jordan', 3, t-'9 days'::interval),
    (i_prosciutto, sid,'Maya',   1, t-'2 days'::interval); END IF;
  IF i_espresso   IS NOT NULL THEN INSERT INTO inventory_counts (item_id,shop_id,counted_by,quantity,counted_at) VALUES
    (i_espresso,   sid,'Alex',   2, t-'11 days'::interval),
    (i_espresso,   sid,'Priya',  1, t-'3 days'::interval); END IF;

  -- ── 7. Current 86 ─────────────────────────────────────────────
  INSERT INTO eighty_sixes (shop_id,item_name,marked_by,marked_at,note,is_active)
  VALUES (sid,'Lamb Chops','Jordan', t-'3 hours'::interval,
          'supplier shorted us — back Thursday', true);

  RAISE NOTICE 'The Cellar seeded successfully. Check /cellar/owner, /cellar/analytics, /cellar/artisan.';
END $$;
