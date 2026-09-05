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
-- نظام الاشتراك: تجربة مجانية 7 يوم، وبعدين لازم تفعيل يدوي
-- شغّل الجزء ده تحت في نفس SQL Editor (كإضافة على اللي فوق)
-- ===========================================================

create table if not exists subscriptions (
  user_id uuid references auth.users(id) on delete cascade primary key,
  status text not null default 'trial', -- trial | active | expired
  plan text default 'standard',
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

-- المستخدم يقدر يشوف حالة اشتراكه بس، مايقدرش يعدّلها بنفسه
drop policy if exists "select own subscription" on subscriptions;
create policy "select own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- لما حد يعمل حساب جديد، يتعمله سجل اشتراك تلقائي بتجربة 7 يوم
create or replace function public.handle_new_user_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, status, trial_ends_at)
  values (new.id, 'trial', now() + interval '7 days');
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
--
-- ملحوظة: لو كنت شغّلت نسخة قديمة من الجزء ده قبل كده، شغّل الجزء ده
-- تاني كامل — بيستبدل الدوال القديمة بنسخة مصححة (كانت بتفشل وقت التنفيذ
-- لأنها بتعتمد على extension اسمه pgcrypto ممكن يكون مش مفعّل في مشروعك،
-- والنسخة الجديدة بتستخدم gen_random_uuid() المتوفرة افتراضيًا في أي
-- مشروع Postgres/Supabase من غير أي extension إضافي).
-- ===========================================================

create table if not exists brand_shares (
  token text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  brand_id text not null,
  created_at timestamptz not null default now()
);

-- تنضيف احترازي: لو كانت نسخة قديمة من الدالة (من غير idempotency) عملت
-- أكتر من لينك لنفس البراند قبل كده، نمسح الزيادة ونسيب أحدث لينك بس —
-- عشان الـ unique index اللي جاي تحت يقدر يتعمل من غير ما يفشل (row_number
-- بيضمن سجل واحد بس ناجي لكل user_id+brand_id حتى لو created_at متطابق).
delete from brand_shares where token in (
  select token from (
    select token, row_number() over (
      partition by user_id, brand_id order by created_at desc, token desc
    ) as rn
    from brand_shares
  ) ranked
  where ranked.rn > 1
);

-- لينك واحد شغال لكل براند في وقت واحد — لو عملت لينك جديد للبراند ده
-- تاني، بنرجّع نفس اللينك الموجود بدل ما نعمل نسخة تانية منه بلا داعي.
create unique index if not exists brand_shares_user_brand_uidx on brand_shares (user_id, brand_id);

alter table brand_shares enable row level security;

drop policy if exists "select own shares" on brand_shares;
create policy "select own shares" on brand_shares
  for select using (auth.uid() = user_id);

-- كانت السياسة دي ناقصة قبل كده — الدالة create_brand_share شغالة
-- كـ security definer فبتعدّي الـ RLS أصلاً، بس بنضيفها كطبقة حماية إضافية
-- (defense in depth) عشان مفيش insert مباشر على الجدول ده يعتمد بس على
-- سلوك الدالة.
drop policy if exists "insert own shares" on brand_shares;
create policy "insert own shares" on brand_shares
  for insert with check (auth.uid() = user_id);

drop policy if exists "delete own shares" on brand_shares;
create policy "delete own shares" on brand_shares
  for delete using (auth.uid() = user_id);

-- إنشاء لينك مشاركة جديد لبراند (بيتنفّذ إنت وإنت مسجل دخول بس).
-- لو فيه لينك موجود بالفعل لنفس البراند، بنرجّعه هو نفسه بدل ما نعمل
-- سجل مكرر (idempotent) — عشان لو الفرونت إند نادى الدالة مرتين بالغلط
-- (double click أو retry بعد فشل مؤقت) ميتعملش أكتر من لينك للبراند ده.
create or replace function public.create_brand_share(p_brand_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_existing text;
begin
  if auth.uid() is null then
    raise exception 'محتاج تكون مسجل دخول';
  end if;

  select token into v_existing from brand_shares
  where user_id = auth.uid() and brand_id = p_brand_id;
  if v_existing is not null then
    return v_existing;
  end if;

  -- gen_random_uuid() مدمجة في Postgres (v13+) وموجودة افتراضيًا في أي
  -- مشروع Supabase من غير احتياج لتفعيل أي extension — عكس
  -- gen_random_bytes() اللي محتاجة pgcrypto مفعّل صراحة.
  v_token := replace(gen_random_uuid()::text, '-', '');
  insert into brand_shares (token, user_id, brand_id) values (v_token, auth.uid(), p_brand_id);
  return v_token;
exception
  when unique_violation then
    -- شرط سباق نادر (نداءين متزامنين وقت واحد بالظبط): حد تاني كسب السباق
    -- وعمل اللينك أول منه بجزء من الثانية — نرجّع اللينك اللي اتعمل بدل ما نفشل.
    select token into v_existing from brand_shares
    where user_id = auth.uid() and brand_id = p_brand_id;
    return v_existing;
end;
$$;

grant execute on function public.create_brand_share(text) to authenticated;

-- إلغاء لينك مشاركة
create or replace function public.revoke_brand_share(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from brand_shares where token = p_token and user_id = auth.uid();
end;
$$;

grant execute on function public.revoke_brand_share(text) to authenticated;

-- قراءة بيانات البراند المشترك — الدالة دي بس اللي أي حد (من غير تسجيل دخول)
-- يقدر يناديها، وبترجع بس اسم البراند ولونه وأفكاره وتحليلات أداء المحتوى
-- المرتبطة بالبراند ده (بدون أي بيانات مالية أو بيانات حساب داخلية)
create or replace function public.get_shared_brand(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share record;
  v_data jsonb;
  v_brand jsonb;
  v_items jsonb;
  v_analyses jsonb;
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

  -- تحليلات أداء المحتوى (Instagram/TikTok/Facebook/YouTube) الخاصة
  -- بالبراند ده بس — بنرجّع الحقول اللي محتاجها العرض فقط (منصة، رابط،
  -- تاريخ، ربط بفكرة، مقاييس الأداء)، من غير أي بيانات تانية.
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a->>'id',
    'ideaId', a->>'ideaId',
    'platform', a->>'platform',
    'url', a->>'url',
    'analyzedAt', a->>'analyzedAt',
    'views', a->'views',
    'likes', a->'likes',
    'comments', a->'comments',
    'shares', a->'shares',
    'saves', a->'saves'
  )), '[]'::jsonb) into v_analyses
  from jsonb_array_elements(coalesce(v_data->'socialAnalyses', '[]'::jsonb)) a
  where a->>'brandId' = v_share.brand_id;

  return jsonb_build_object(
    'ok', true,
    'brand', jsonb_build_object('name', v_brand->>'name', 'emoji', v_brand->>'emoji', 'color', v_brand->>'color'),
    'items', v_items,
    'analyses', v_analyses
  );
end;
$$;

grant execute on function public.get_shared_brand(text) to anon, authenticated;

-- ===========================================================
-- تخزين ملفات: باكت واحد (brand-assets) بيتخزن فيه لوجو الوكالة
-- (White-label) وملفات مكتبة الوسائط لكل براند. عام للقراءة (لازم
-- يظهر في التقارير ولينكات المشاركة من غير تسجيل دخول)، لكن الرفع/
-- التعديل/المسح مقصور على صاحب الملف بس (أول جزء من المسار = user_id
-- بتاعه، بيتأكد منه storage.foldername).
-- ===========================================================

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

drop policy if exists "brand-assets public read" on storage.objects;
create policy "brand-assets public read" on storage.objects
  for select using (bucket_id = 'brand-assets');

drop policy if exists "brand-assets owner insert" on storage.objects;
create policy "brand-assets owner insert" on storage.objects
  for insert with check (
    bucket_id = 'brand-assets' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "brand-assets owner update" on storage.objects;
create policy "brand-assets owner update" on storage.objects
  for update using (
    bucket_id = 'brand-assets' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "brand-assets owner delete" on storage.objects;
create policy "brand-assets owner delete" on storage.objects
  for delete using (
    bucket_id = 'brand-assets' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================================
-- ملاحظات وموافقة العميل على لينك المشاركة: العميل (من غير تسجيل
-- دخول) يقدر يسيب تعليق أو يوافق/يطلب تعديل على أي فكرة معروضة في
-- اللينك، وصاحب اللينك يشوفهم في لوحته العادية. الإضافة بتتم بس عن
-- طريق الدالة add_share_feedback تحت (security definer) — مفيش
-- insert مباشر مسموح بيه حتى لمستخدم مسجل دخول.
-- ===========================================================

create table if not exists share_feedback (
  id uuid primary key default gen_random_uuid(),
  token text not null references brand_shares(token) on delete cascade,
  item_id text not null,
  author_name text,
  message text,
  kind text not null default 'comment' check (kind in ('comment', 'approved', 'changes_requested')),
  created_at timestamptz not null default now()
);

create index if not exists share_feedback_token_item_idx on share_feedback (token, item_id);

alter table share_feedback enable row level security;

drop policy if exists "select own share feedback" on share_feedback;
create policy "select own share feedback" on share_feedback
  for select using (
    exists (select 1 from brand_shares bs where bs.token = share_feedback.token and bs.user_id = auth.uid())
  );

-- المالك يقدر يمسح ملاحظة (زي لو فيها سبام) من لوحته العادية.
drop policy if exists "delete own share feedback" on share_feedback;
create policy "delete own share feedback" on share_feedback
  for delete using (
    exists (select 1 from brand_shares bs where bs.token = share_feedback.token and bs.user_id = auth.uid())
  );

create or replace function public.add_share_feedback(
  p_token text, p_item_id text, p_author_name text, p_message text, p_kind text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share record;
  v_kind text := coalesce(p_kind, 'comment');
begin
  select * into v_share from brand_shares where token = p_token;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'اللينك ده مش صحيح أو اتلغى.');
  end if;

  if v_kind not in ('comment', 'approved', 'changes_requested') then
    v_kind := 'comment';
  end if;

  if v_kind = 'comment' and trim(coalesce(p_message, '')) = '' then
    return jsonb_build_object('ok', false, 'message', 'اكتب رسالة الأول.');
  end if;

  insert into share_feedback (token, item_id, author_name, message, kind)
  values (
    p_token, p_item_id,
    nullif(trim(coalesce(p_author_name, '')), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    v_kind
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.add_share_feedback(text, text, text, text, text) to anon, authenticated;

-- نسخة محدّثة من get_shared_brand: بترجع كمان ملاحظات العميل (feedback)
-- وهوية الوكالة (agency name/logo لو المستخدم ضبطهم) عشان لينك المشاركة
-- يعرض براند الوكالة نفسها بدل ContentST لو حابة كده.
create or replace function public.get_shared_brand(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share record;
  v_data jsonb;
  v_brand jsonb;
  v_items jsonb;
  v_analyses jsonb;
  v_feedback jsonb;
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

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a->>'id',
    'ideaId', a->>'ideaId',
    'platform', a->>'platform',
    'url', a->>'url',
    'analyzedAt', a->>'analyzedAt',
    'views', a->'views',
    'likes', a->'likes',
    'comments', a->'comments',
    'shares', a->'shares',
    'saves', a->'saves'
  )), '[]'::jsonb) into v_analyses
  from jsonb_array_elements(coalesce(v_data->'socialAnalyses', '[]'::jsonb)) a
  where a->>'brandId' = v_share.brand_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id,
    'itemId', f.item_id,
    'authorName', f.author_name,
    'message', f.message,
    'kind', f.kind,
    'createdAt', f.created_at
  ) order by f.created_at asc), '[]'::jsonb) into v_feedback
  from share_feedback f
  where f.token = p_token;

  return jsonb_build_object(
    'ok', true,
    'brand', jsonb_build_object('name', v_brand->>'name', 'emoji', v_brand->>'emoji', 'color', v_brand->>'color'),
    'items', v_items,
    'analyses', v_analyses,
    'feedback', v_feedback,
    'agency', jsonb_build_object(
      'name', v_data->'agencyProfile'->>'name',
      'logoUrl', v_data->'agencyProfile'->>'logoUrl'
    )
  );
end;
$$;

grant execute on function public.get_shared_brand(text) to anon, authenticated;

