-- Run this in your Supabase SQL editor to set up the database
-- If tables already exist, run only the ALTER TABLE and CREATE TABLE sections you're missing

create table if not exists shops (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references shops(id) on delete cascade,
  name text not null,
  sort_order int default 0
);

create table if not exists items (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  typical_supplier text,
  is_active boolean default true,
  can_order boolean default true,
  can_make boolean default false
);

create table if not exists flags (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references items(id) on delete cascade,
  flagged_by text not null,
  flagged_at timestamp with time zone default now(),
  note text,
  status text default 'pending' check (status in ('pending', 'ordered', 'received'))
);

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references items(id) on delete cascade,
  flagged_by text not null,
  flagged_at timestamp with time zone default now(),
  note text,
  urgency text default 'normal' check (urgency in ('urgent', 'normal')),
  status text default 'pending' check (status in ('pending', 'in_progress', 'done'))
);

-- Seed data for The Cellar (skip if already exists)
insert into shops (id, name) values ('00000000-0000-0000-0000-000000000001', 'The Cellar')
  on conflict (id) do nothing;

insert into categories (shop_id, name, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Coffee', 1),
  ('00000000-0000-0000-0000-000000000001', 'Milk & Dairy', 2),
  ('00000000-0000-0000-0000-000000000001', 'Cheese', 3),
  ('00000000-0000-0000-0000-000000000001', 'Supplies', 4),
  ('00000000-0000-0000-0000-000000000001', 'Food', 5)
  on conflict do nothing;

-- If items table already existed, add the new columns:
alter table items add column if not exists can_order boolean default true;
alter table items add column if not exists can_make boolean default false;
alter table items add column if not exists is_weekly boolean default false;

create table if not exists ai_personas (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references shops(id) on delete cascade,
  name text not null,
  title text not null,
  emoji text not null default '🤖',
  theme text not null default 'stone',
  system_prompt text not null,
  quick_prompts text[] default '{}',
  sort_order int default 0,
  is_active boolean default true
);

-- Seed default personas for The Cellar
insert into ai_personas (shop_id, name, title, emoji, theme, system_prompt, quick_prompts, sort_order) values
  (
    '00000000-0000-0000-0000-000000000001',
    'Alex',
    'Specialty Barista',
    '☕',
    'stone',
    'You are Alex, an expert specialty coffee barista and coffee educator. You have deep knowledge of espresso, pour-over, cold brew, and emerging coffee techniques. You stay current on third-wave coffee trends, micro-roasters, single-origin sourcing, processing methods (washed, natural, honey, anaerobic, carbonic maceration), milk alternatives, and what top cafes are doing globally. Keep responses focused, practical, and exciting. When discussing trends, be specific.',
    ARRAY[
      'What''s trending in specialty coffee right now?',
      'Tell me about interesting processing methods',
      'What milk alternatives are cafes excited about?',
      'What are the best single-origin regions to explore?'
    ],
    1
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Jamie',
    'Artisan Cheesemonger',
    '🧀',
    'amber',
    'You are Jamie, an expert cheesemonger and artisan food specialist with encyclopedic knowledge of cheese and charcuterie. You stay current on the American artisan cheese movement, notable creameries, emerging producers, milk types, aging, and perfect pairings — wine, beer, honey, preserves, charcuterie. When discussing trends, be specific — domestic alternatives to imports, funky natural rinds, fresh curd formats, seasonal affinage programs.',
    ARRAY[
      'What''s trending in the artisan cheese world?',
      'Suggest a cheese board for a coffee shop',
      'What''s exciting in American domestic cheese?',
      'What are some great soft cheeses for a café menu?'
    ],
    2
  )
  on conflict do nothing;
