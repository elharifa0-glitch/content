-- استوديو الشغل: جدول بيانات المستخدمين
-- الصق الكود ده كامل في Supabase > SQL Editor > New query > Run

create table if not exists user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null default '{"brands":[],"items":[],"tasks":[],"socialAnalyses":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ملحوظة: socialAnalyses هي تحليلات محتوى منشور (رابط + مقاييس)، كل واحدة تابعة
-- لبراند (brandId مطلوب) ومربوطة اختياريًا بفكرة داخلية (ideaId ممكن يكون null).
-- بتتخزن جوا نفس عمود data الموجود، زي brands/items/tasks بالظبط — من غير جدول جديد.

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

-- ===========================================================
-- نظام الاشتراك: تجربة مجانية 14 يوم، وبعدين لازم تفعيل يدوي
-- شغّل الجزء ده تحت في نفس SQL Editor (كإضافة على اللي فوق)
-- ===========================================================

create table if not exists subscriptions (
  user_id uuid references auth.users(id) on delete cascade primary key,
  status text not null default 'trial', -- trial | active | expired
  plan text default 'standard',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

-- المستخدم يقدر يشوف حالة اشتراكه بس، مايقدرش يعدّلها بنفسه
drop policy if exists "select own subscription" on subscriptions;
create policy "select own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- لما حد يعمل حساب جديد، يتعمله سجل اشتراك تلقائي بتجربة 14 يوم
create or replace function public.handle_new_user_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, status, trial_ends_at)
  values (new.id, 'trial', now() + interval '14 days');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute procedure public.handle_new_user_subscription();

-- ملحوظة: المستخدمين اللي عملوا حساب قبل ما تشغّل الجزء ده مش هيبقى
-- عندهم سجل اشتراك تلقائي. لو عندك مستخدمين بالفعل، شغّل السطر ده مرة واحدة
-- عشان تعمل لهم تجربة مجانية كمان:
--
-- insert into subscriptions (user_id, status, trial_ends_at)
-- select id, 'trial', now() + interval '14 days' from auth.users
-- on conflict (user_id) do nothing;

-- ===========================================================
-- أكواد الخصم / التفعيل: تديها لناس معينة، والمستخدم يفعّلها
-- بنفسه من الموقع من غير ما تتدخل إنت
-- ===========================================================

create table if not exists redeem_codes (
  code text primary key,
  days integer not null default 30, -- عدد الأيام اللي الكود بيضيفها للاشتراك
  max_uses integer, -- سيبه فاضي لعدد استخدامات مفتوح
  uses_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz, -- سيبه فاضي لو الكود من غير تاريخ انتهاء
  note text, -- ملاحظة لنفسك بس، مش بتظهر للمستخدم (مثلاً "كود المؤثرة فلانة")
  created_at timestamptz not null default now()
);

create table if not exists redeem_code_uses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  code text not null,
  redeemed_at timestamptz not null default now(),
  unique (user_id, code)
);

-- الجدولين دول مقفولين تمامًا على المستخدمين (RLS من غير أي policy)،
-- والوصول ليهم بيتم بس عن طريق الدالة تحت. إنت تقدر تتحكم فيهم
-- مباشرة من Supabase > Table Editor لأنك بتدخل بحساب المالك.
alter table redeem_codes enable row level security;
alter table redeem_code_uses enable row level security;

create or replace function public.redeem_subscription_code(p_code text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_code record;
  v_already boolean;
  v_current record;
  v_base timestamptz;
  v_new_end timestamptz;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'message', 'لازم تكون مسجل دخول الأول.');
  end if;

  select * into v_code from redeem_codes where code = trim(p_code) and active = true;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'الكود ده مش صحيح.');
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    return jsonb_build_object('ok', false, 'message', 'الكود ده خلصت صلاحيته.');
  end if;

  if v_code.max_uses is not null and v_code.uses_count >= v_code.max_uses then
    return jsonb_build_object('ok', false, 'message', 'الكود ده وصل للحد الأقصى من الاستخدام.');
  end if;

  select exists(
    select 1 from redeem_code_uses where user_id = auth.uid() and code = trim(p_code)
  ) into v_already;
  if v_already then
    return jsonb_build_object('ok', false, 'message', 'إنت مستخدم الكود ده قبل كده.');
  end if;

  select * into v_current from subscriptions where user_id = auth.uid();

  v_base := greatest(
    now(),
    coalesce(v_current.current_period_end, 'epoch'::timestamptz),
    coalesce(v_current.trial_ends_at, 'epoch'::timestamptz)
  );
  v_new_end := v_base + (v_code.days || ' days')::interval;

  update subscriptions
    set status = 'active', current_period_end = v_new_end, updated_at = now()
    where user_id = auth.uid();

  insert into redeem_code_uses (user_id, code) values (auth.uid(), trim(p_code));
  update redeem_codes set uses_count = uses_count + 1 where code = trim(p_code);

  return jsonb_build_object(
    'ok', true,
    'message', 'تم التفعيل! هيفضل شغال لحد ' || to_char(v_new_end, 'YYYY-MM-DD')
  );
end;
$$;

grant execute on function public.redeem_subscription_code(text) to authenticated;

-- ===========================================================
-- لينكات مشاركة البراند: لينك للقراءة بس، تبعته لعميلك من غير
-- ما يحتاج يسجل دخول، ومن غير ما يشوف أي بيانات مالية أو براندات تانية
-- ===========================================================

create table if not exists brand_shares (
  token text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  brand_id text not null,
  created_at timestamptz not null default now()
);

alter table brand_shares enable row level security;

drop policy if exists "select own shares" on brand_shares;
create policy "select own shares" on brand_shares
  for select using (auth.uid() = user_id);

drop policy if exists "delete own shares" on brand_shares;
create policy "delete own shares" on brand_shares
  for delete using (auth.uid() = user_id);

-- إنشاء لينك مشاركة جديد لبراند (بيتنفّذ إنت وإنت مسجل دخول بس)
create or replace function public.create_brand_share(p_brand_id text)
returns text
language plpgsql
security definer
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'محتاج تكون مسجل دخول';
  end if;
  v_token := encode(gen_random_bytes(12), 'hex');
  insert into brand_shares (token, user_id, brand_id) values (v_token, auth.uid(), p_brand_id);
  return v_token;
end;
$$;

grant execute on function public.create_brand_share(text) to authenticated;

-- إلغاء لينك مشاركة
create or replace function public.revoke_brand_share(p_token text)
returns void
language plpgsql
security definer
as $$
begin
  delete from brand_shares where token = p_token and user_id = auth.uid();
end;
$$;

grant execute on function public.revoke_brand_share(text) to authenticated;

-- قراءة بيانات البراند المشترك — الدالة دي بس اللي أي حد (من غير تسجيل دخول)
-- يقدر يناديها، وبترجع بس اسم البراند ولونه وأفكاره (بدون أي بيانات مالية)
create or replace function public.get_shared_brand(p_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_share record;
  v_data jsonb;
  v_brand jsonb;
  v_items jsonb;
begin
  select * into v_share from brand_shares where token = p_token;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'اللينك ده مش صحيح أو اتلغى.');
  end if;

  select data into v_data from user_data where user_id = v_share.user_id;
  if v_data is null then
    return jsonb_build_object('ok', false, 'message', 'مفيش بيانات.');
  end if;

  select b into v_brand from jsonb_array_elements(v_data->'brands') b where b->>'id' = v_share.brand_id limit 1;
  if v_brand is null then
    return jsonb_build_object('ok', false, 'message', 'البراند ده اتمسح.');
  end if;

  select coalesce(jsonb_agg(i), '[]'::jsonb) into v_items
  from jsonb_array_elements(v_data->'items') i
  where i->>'brandId' = v_share.brand_id;

  return jsonb_build_object(
    'ok', true,
    'brand', jsonb_build_object('name', v_brand->>'name', 'emoji', v_brand->>'emoji', 'color', v_brand->>'color'),
    'items', v_items
  );
end;
$$;

grant execute on function public.get_shared_brand(text) to anon, authenticated;

