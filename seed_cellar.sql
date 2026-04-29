-- ═══════════════════════════════════════════════════════════════
-- The Cellar — Demo Data Seed
-- Paste into Supabase SQL Editor → Run
-- Run once. Running again doubles flag counts (safe to re-run
-- item/category inserts, but flags/tasks will duplicate).
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  sid    UUID;
  t      TIMESTAMPTZ := NOW();

  c_red  UUID; c_white UUID; c_rose UUID;
  c_spir UUID; c_beer  UUID; c_na   UUID;
  c_bar  UUID; c_glass UUID;

  i_housered UUID; i_pinot    UUID;
  i_housewhi UUID; i_chard    UUID;
  i_prosecco UUID; i_rose_g   UUID;
  i_aperol   UUID; i_campari  UUID; i_gin UUID;
  i_oatmilk  UUID;
  i_lemons   UUID; i_limes    UUID;
  i_syrup    UUID; i_spritz   UUID;

BEGIN
  -- ── 1. Find the shop ──────────────────────────────────────────
  SELECT id INTO sid FROM shops WHERE slug = 'cellar';
  IF sid IS NULL THEN
    RAISE EXCEPTION 'No shop with slug ''cellar'' found. Create it at /setup first.';
  END IF;

  -- ── 2. Supplier info on categories ───────────────────────────
  UPDATE categories SET supplier_name = 'Oak & Grain', supplier_email = 'orders@oakandgrain.co'
    WHERE shop_id = sid AND (name ILIKE '%red%' OR name ILIKE '%white%' OR name ILIKE '%ros%'
      OR name ILIKE '%spark%' OR name ILIKE '%wine%');

  UPDATE categories SET supplier_name = 'Fernwood Provisions', supplier_email = 'supply@fernwoodprov.com'
    WHERE shop_id = sid AND (name ILIKE '%spirit%' OR name ILIKE '%beer%'
      OR name ILIKE '%cider%' OR name ILIKE '%aperit%');

  UPDATE categories SET supplier_name = 'Metro Supply Co', supplier_email = 'orders@metrosupply.co'
    WHERE shop_id = sid AND (name ILIKE '%bar%' OR name ILIKE '%garnish%'
      OR name ILIKE '%non%' OR name ILIKE '%suppl%' OR name ILIKE '%glass%');

  -- ── 3. Fetch category IDs ─────────────────────────────────────
  SELECT id INTO c_red   FROM categories WHERE shop_id=sid AND name ILIKE '%red%'                                LIMIT 1;
  SELECT id INTO c_white FROM categories WHERE shop_id=sid AND name ILIKE '%white%'                              LIMIT 1;
  SELECT id INTO c_rose  FROM categories WHERE shop_id=sid AND (name ILIKE '%ros%' OR name ILIKE '%spark%')      LIMIT 1;
  SELECT id INTO c_spir  FROM categories WHERE shop_id=sid AND (name ILIKE '%spirit%' OR name ILIKE '%aperit%')  LIMIT 1;
  SELECT id INTO c_beer  FROM categories WHERE shop_id=sid AND (name ILIKE '%beer%' OR name ILIKE '%cider%')     LIMIT 1;
  SELECT id INTO c_na    FROM categories WHERE shop_id=sid AND (name ILIKE '%non%' OR name ILIKE '%alc%')        LIMIT 1;
  SELECT id INTO c_bar   FROM categories WHERE shop_id=sid AND (name ILIKE '%bar%' OR name ILIKE '%garnish%')    LIMIT 1;
  SELECT id INTO c_glass FROM categories WHERE shop_id=sid AND (name ILIKE '%glass%' OR name ILIKE '%suppl%')    LIMIT 1;

  -- ── 4. Insert items (skips if already present by name) ────────
  IF c_red IS NOT NULL THEN
    INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
    SELECT c_red,n,p,u,co,cm,iw,true FROM (VALUES
      ('House Red'::text,  6::int,'bottles'::text,true::bool,false::bool,false::bool),
      ('Pinot Noir',       8,     'bottles',      true, false,false),
      ('Barolo',           4,     'bottles',      true, false,false),
      ('Cotes du Rhone',   6,     'bottles',      true, false,false),
      ('Cab Franc',        4,     'bottles',      true, false,false)
    ) v(n,p,u,co,cm,iw)
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_red AND name=v.n);
  END IF;

  IF c_white IS NOT NULL THEN
    INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
    SELECT c_white,n,p,u,co,cm,iw,true FROM (VALUES
      ('House White'::text,   6::int,'bottles'::text,true::bool,false::bool,false::bool),
      ('Sauvignon Blanc',     8,     'bottles',      true, false,false),
      ('Chardonnay',          6,     'bottles',      true, false,false),
      ('Vermentino',          4,     'bottles',      true, false,false),
      ('Gruner Veltliner',    4,     'bottles',      true, false,false)
    ) v(n,p,u,co,cm,iw)
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_white AND name=v.n);
  END IF;

  IF c_rose IS NOT NULL THEN
    INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
    SELECT c_rose,n,p,u,co,cm,iw,true FROM (VALUES
      ('Prosecco'::text,  12::int,'bottles'::text,true::bool,false::bool,false::bool),
      ('Rose by Glass',    8,     'bottles',      true, false,false),
      ('Champagne',        6,     'bottles',      true, false,false),
      ('Cava',             4,     'bottles',      true, false,false)
    ) v(n,p,u,co,cm,iw)
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_rose AND name=v.n);
  END IF;

  IF c_spir IS NOT NULL THEN
    INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
    SELECT c_spir,n,p,u,co,cm,iw,true FROM (VALUES
      ('Aperol'::text, 4::int,'bottles'::text,true::bool,false::bool,false::bool),
      ('Campari',      3,     'bottles',      true, false,false),
      ('Gin',          3,     'bottles',      true, false,false),
      ('Whiskey',      3,     'bottles',      true, false,false),
      ('Amaro',        2,     'bottles',      true, false,false)
    ) v(n,p,u,co,cm,iw)
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_spir AND name=v.n);
  END IF;

  IF c_bar IS NOT NULL THEN
    INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
    SELECT c_bar,n,p,u,co,cm,iw,true FROM (VALUES
      ('Lemons'::text,                30::int,'each'::text,    true::bool, false::bool,true::bool),
      ('Limes',                       20,     'each',           true,  false, true),
      ('Cocktail Olives',              3,     'jars',           true,  false,false),
      ('House-made Simple Syrup',      4,     'bottles',       false,  true, true),
      ('Batched Aperol Spritz',        8,     'portions',      false,  true,false)
    ) v(n,p,u,co,cm,iw)
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_bar AND name=v.n);
  END IF;

  IF c_na IS NOT NULL THEN
    INSERT INTO items (category_id,name,par_level,par_unit,can_order,can_make,is_weekly,is_active)
    SELECT c_na,n,p,u,co,cm,iw,true FROM (VALUES
      ('Oat Milk'::text,    6::int,'cartons'::text,true::bool,false::bool,true::bool),
      ('Sparkling Water',  24,     'bottles',       true, false,false),
      ('Still Water',      24,     'bottles',       true, false,false),
      ('NA Beer',          12,     'cans',           true, false,false)
    ) v(n,p,u,co,cm,iw)
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE category_id=c_na AND name=v.n);
  END IF;

  -- ── 5. Fetch item IDs ─────────────────────────────────────────
  SELECT id INTO i_housered FROM items WHERE category_id=c_red   AND name='House Red'               LIMIT 1;
  SELECT id INTO i_pinot    FROM items WHERE category_id=c_red   AND name='Pinot Noir'              LIMIT 1;
  SELECT id INTO i_housewhi FROM items WHERE category_id=c_white AND name='House White'             LIMIT 1;
  SELECT id INTO i_chard    FROM items WHERE category_id=c_white AND name='Chardonnay'              LIMIT 1;
  SELECT id INTO i_prosecco FROM items WHERE category_id=c_rose  AND name='Prosecco'                LIMIT 1;
  SELECT id INTO i_rose_g   FROM items WHERE category_id=c_rose  AND name='Rose by Glass'           LIMIT 1;
  SELECT id INTO i_aperol   FROM items WHERE category_id=c_spir  AND name='Aperol'                  LIMIT 1;
  SELECT id INTO i_campari  FROM items WHERE category_id=c_spir  AND name='Campari'                 LIMIT 1;
  SELECT id INTO i_gin      FROM items WHERE category_id=c_spir  AND name='Gin'                     LIMIT 1;
  SELECT id INTO i_oatmilk  FROM items WHERE category_id=c_na    AND name='Oat Milk'                LIMIT 1;
  SELECT id INTO i_lemons   FROM items WHERE category_id=c_bar   AND name='Lemons'                  LIMIT 1;
  SELECT id INTO i_limes    FROM items WHERE category_id=c_bar   AND name='Limes'                   LIMIT 1;
  SELECT id INTO i_syrup    FROM items WHERE category_id=c_bar   AND name='House-made Simple Syrup' LIMIT 1;
  SELECT id INTO i_spritz   FROM items WHERE category_id=c_bar   AND name='Batched Aperol Spritz'   LIMIT 1;

  -- ── 6. Historical FLAGS (~80 over 60 days) ────────────────────

  -- Aperol: 7x (most flagged — runs out constantly)
  IF i_aperol IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_aperol,'Maya',   t-'58 days'::interval,'almost out',       'received'),
      (i_aperol,'Jordan', t-'50 days'::interval, NULL,              'received'),
      (i_aperol,'Maya',   t-'43 days'::interval,'last bottle',       'received'),
      (i_aperol,'Sam',    t-'35 days'::interval, NULL,              'received'),
      (i_aperol,'Maya',   t-'26 days'::interval,'busy weekend',      'received'),
      (i_aperol,'Jordan', t-'14 days'::interval, NULL,              'received'),
      (i_aperol,'Maya',   t-'3 days'::interval, 'down to 1 bottle', 'pending');
  END IF;

  -- House Red: 5x
  IF i_housered IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_housered,'Alex',  t-'60 days'::interval, NULL,               'received'),
      (i_housered,'Priya', t-'47 days'::interval,'went fast this week','received'),
      (i_housered,'Sam',   t-'34 days'::interval, NULL,               'received'),
      (i_housered,'Alex',  t-'20 days'::interval, NULL,               'received'),
      (i_housered,'Priya', t-'7 days'::interval,  '2 bottles left',   'ordered');
  END IF;

  -- Lemons: 5x
  IF i_lemons IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_lemons,'Jordan', t-'57 days'::interval, NULL,                       'received'),
      (i_lemons,'Sam',    t-'44 days'::interval,'need for service tonight',   'received'),
      (i_lemons,'Maya',   t-'31 days'::interval, NULL,                       'received'),
      (i_lemons,'Jordan', t-'18 days'::interval, NULL,                       'received'),
      (i_lemons,'Alex',   t-'5 days'::interval,  NULL,                       'pending');
  END IF;

  -- Oat Milk: 4x
  IF i_oatmilk IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_oatmilk,'Priya', t-'55 days'::interval, NULL,              'received'),
      (i_oatmilk,'Sam',   t-'41 days'::interval,'last carton',       'received'),
      (i_oatmilk,'Maya',  t-'27 days'::interval, NULL,              'received'),
      (i_oatmilk,'Priya', t-'10 days'::interval,'goes fast Fri-Sat','received');
  END IF;

  -- Prosecco: 4x
  IF i_prosecco IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_prosecco,'Maya',   t-'53 days'::interval, NULL,                         'received'),
      (i_prosecco,'Jordan', t-'39 days'::interval, NULL,                         'received'),
      (i_prosecco,'Alex',   t-'24 days'::interval,'private event used the rest',  'received'),
      (i_prosecco,'Sam',    t-'11 days'::interval, NULL,                         'received');
  END IF;

  -- House White: 4x
  IF i_housewhi IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_housewhi,'Sam',   t-'51 days'::interval, NULL,                  'received'),
      (i_housewhi,'Priya', t-'37 days'::interval, NULL,                  'received'),
      (i_housewhi,'Alex',  t-'23 days'::interval,'summer demand is up',  'received'),
      (i_housewhi,'Maya',  t-'9 days'::interval,  NULL,                  'ordered');
  END IF;

  -- Campari: 3x
  IF i_campari IS NOT NULL THEN
    INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
      (i_campari,'Jordan', t-'48 days'::interval,NULL,'received'),
      (i_campari,'Sam',    t-'30 days'::interval,NULL,'received'),
      (i_campari,'Maya',   t-'12 days'::interval,NULL,'received');
  END IF;

  -- Remaining items: 2x each
  IF i_pinot   IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_pinot,  'Alex',   t-'45 days'::interval,NULL,'received'),(i_pinot,  'Priya', t-'19 days'::interval,NULL,'received'); END IF;
  IF i_chard   IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_chard,  'Sam',    t-'42 days'::interval,NULL,'received'),(i_chard,  'Jordan',t-'16 days'::interval,NULL,'received'); END IF;
  IF i_rose_g  IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_rose_g, 'Maya',   t-'38 days'::interval,'summer season','received'),(i_rose_g,'Alex',t-'13 days'::interval,NULL,'received'); END IF;
  IF i_gin     IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_gin,    'Priya',  t-'33 days'::interval,NULL,'received'),(i_gin,   'Jordan', t-'8 days'::interval, NULL,'received'); END IF;
  IF i_limes   IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_limes,  'Sam',    t-'29 days'::interval,NULL,'received'),(i_limes, 'Alex',   t-'6 days'::interval, NULL,'received'); END IF;
  IF i_syrup   IS NOT NULL THEN INSERT INTO flags (item_id,flagged_by,flagged_at,note,status) VALUES
    (i_syrup,  'Jordan', t-'46 days'::interval,NULL,'received'),(i_syrup, 'Maya',   t-'22 days'::interval,NULL,'received'); END IF;

  -- ── 7. TASKS: prep queue history ─────────────────────────────
  IF i_syrup IS NOT NULL THEN
    INSERT INTO tasks (item_id,flagged_by,flagged_at,note,urgency,status) VALUES
      (i_syrup,'Jordan', t-'56 days'::interval,'need for opening', 'normal','done'),
      (i_syrup,'Maya',   t-'42 days'::interval, NULL,              'normal','done'),
      (i_syrup,'Sam',    t-'28 days'::interval,'running low',      'urgent','done'),
      (i_syrup,'Jordan', t-'14 days'::interval, NULL,              'normal','done'),
      (i_syrup,'Maya',   t-'2 days'::interval,  NULL,              'normal','pending');
  END IF;

  IF i_spritz IS NOT NULL THEN
    INSERT INTO tasks (item_id,flagged_by,flagged_at,note,urgency,status) VALUES
      (i_spritz,'Alex',   t-'53 days'::interval,'Friday service',    'normal',     'done'),
      (i_spritz,'Priya',  t-'39 days'::interval, NULL,               'normal',     'done'),
      (i_spritz,'Sam',    t-'25 days'::interval,'big party tonight',  'urgent',    'done'),
      (i_spritz,'Alex',   t-'11 days'::interval, NULL,               'normal',     'done'),
      (i_spritz,'Jordan', t-'1 days'::interval,  'weekend prep',     'normal','in_progress');
  END IF;

  -- ── 8. INVENTORY COUNTS (populates below-par view) ───────────
  IF i_aperol   IS NOT NULL THEN INSERT INTO inventory_counts (item_id,shop_id,counted_by,quantity,counted_at) VALUES
    (i_aperol,  sid,'Maya',   3, t-'20 days'::interval),
    (i_aperol,  sid,'Jordan', 1, t-'3 days'::interval); END IF;
  IF i_oatmilk  IS NOT NULL THEN INSERT INTO inventory_counts (item_id,shop_id,counted_by,quantity,counted_at) VALUES
    (i_oatmilk, sid,'Sam',    5, t-'15 days'::interval),
    (i_oatmilk, sid,'Priya',  2, t-'4 days'::interval); END IF;
  IF i_housered IS NOT NULL THEN INSERT INTO inventory_counts (item_id,shop_id,counted_by,quantity,counted_at) VALUES
    (i_housered,sid,'Alex',   4, t-'10 days'::interval),
    (i_housered,sid,'Priya',  2, t-'2 days'::interval); END IF;
  IF i_lemons   IS NOT NULL THEN INSERT INTO inventory_counts (item_id,shop_id,counted_by,quantity,counted_at) VALUES
    (i_lemons,  sid,'Jordan', 12,t-'8 days'::interval),
    (i_lemons,  sid,'Sam',    5, t-'1 days'::interval); END IF;

  -- ── 9. Current 86 ─────────────────────────────────────────────
  INSERT INTO eighty_sixes (shop_id,item_name,marked_by,marked_at,note,is_active)
  VALUES (sid,'Cotes du Rhone','Maya', t-'2 hours'::interval,
          'sold the last bottle - reorder placed', true);

  RAISE NOTICE 'The Cellar seeded. Check /cellar/owner, /cellar/analytics, and /cellar/artisan.';
END $$;
