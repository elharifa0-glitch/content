-- استوديو الشغل: جدول بيانات المستخدمين
-- الصق الكود ده كامل في Supabase > SQL Editor > New query > Run

create table if not exists user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null default '{"brands":[],"items":[],"tasks":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table user_data enable row level security;

drop policy if exists "select own data" on user_data;
create policy "select own data" on user_data
  for select using (auth.uid() = user_id);

drop policy if exists "insert own data" on user_data;
create policy "insert own data" on user_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own data" on user_data;
create policy "update own data" on user_data
  for update using (auth.uid() = user_id);

drop policy if exists "delete own data" on user_data;
create policy "delete own data" on user_data
  for delete using (auth.uid() = user_id);
