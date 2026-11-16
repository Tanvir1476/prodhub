-- =============================================================================
-- ProdHub — Collaborative Product Inventory & Community Contribution Platform
-- Supabase / PostgreSQL schema
--
-- Run this whole file in the Supabase SQL Editor (Dashboard → SQL → New query).
-- It is idempotent: safe to re-run.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. Admin registry + helper
--    The single Admin is a normal Supabase Auth user whose id is listed here.
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Tables
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(btrim(name)) between 1 and 160),
  quantity      integer not null default 0 check (quantity >= 0),
  image_url     text,
  price         numeric(12,2) not null default 0 check (price >= 0),
  colors        text[] not null default '{}',
  category      text,
  description   text check (description is null or char_length(description) <= 2000),
  purchase_link text check (purchase_link is null or purchase_link ~* '^https?://'),
  is_archived   boolean not null default false,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.product_submissions (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(btrim(name)) between 1 and 160),
  quantity        integer not null default 0 check (quantity >= 0),
  image_url       text,
  price           numeric(12,2) not null default 0 check (price >= 0),
  colors          text[] not null default '{}',
  category        text,
  description     text check (description is null or char_length(description) <= 2000),
  purchase_link   text check (purchase_link is null or purchase_link ~* '^https?://'),
  submitter_name  text,
  status          public.review_status not null default 'pending',
  published_product_id uuid references public.products (id) on delete set null,
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  admin_note      text
);

create table if not exists public.change_requests (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products (id) on delete cascade,
  -- { "<field>": { "current": "<text>", "proposed": "<text>" }, ... }
  requested_changes jsonb not null,
  reason            text not null check (char_length(btrim(reason)) between 1 and 2000),
  evidence_url      text,
  submitter_name    text,
  status            public.review_status not null default 'pending',
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  admin_note        text,
  constraint change_requests_changes_is_object check (jsonb_typeof(requested_changes) = 'object')
);

create table if not exists public.deletion_requests (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products (id) on delete cascade,
  reason          text not null check (char_length(btrim(reason)) between 1 and 2000),
  additional_info text,
  submitter_name  text,
  status          public.review_status not null default 'pending',
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  admin_note      text
);

create table if not exists public.admin_activity_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references auth.users (id) on delete set null,
  action      text not null,
  target_type text not null,
  target_id   uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Used by server-side rate limiting of public submission endpoints.
create table if not exists public.rate_limit_events (
  id         bigint generated always as identity primary key,
  bucket     text not null,          -- e.g. "submission:<hashed ip>"
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. Indexes
-- -----------------------------------------------------------------------------
create index if not exists products_created_at_idx     on public.products (created_at desc);
create index if not exists products_price_idx          on public.products (price);
create index if not exists products_category_idx       on public.products (category);
create index if not exists products_archived_idx       on public.products (is_archived);
create index if not exists products_name_trgm_idx      on public.products using gin (to_tsvector('simple', name));
create index if not exists products_colors_gin_idx     on public.products using gin (colors);

create index if not exists submissions_status_idx      on public.product_submissions (status, created_at desc);
create index if not exists change_requests_status_idx  on public.change_requests (status, created_at desc);
create index if not exists change_requests_product_idx on public.change_requests (product_id);
create index if not exists deletion_requests_status_idx on public.deletion_requests (status, created_at desc);
create index if not exists deletion_requests_product_idx on public.deletion_requests (product_id);
create index if not exists activity_logs_created_idx   on public.admin_activity_logs (created_at desc);
create index if not exists rate_limit_bucket_idx       on public.rate_limit_events (bucket, created_at desc);

-- -----------------------------------------------------------------------------
-- 5. Triggers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. Row Level Security
--    * anon / authenticated users can only READ non-archived products.
--    * Every other table is Admin-only.
--    * Public submissions are inserted by the application server with the
--      service-role key AFTER validation + rate limiting (never from the browser).
-- -----------------------------------------------------------------------------
alter table public.admin_users          enable row level security;
alter table public.products             enable row level security;
alter table public.product_submissions  enable row level security;
alter table public.change_requests      enable row level security;
alter table public.deletion_requests    enable row level security;
alter table public.admin_activity_logs  enable row level security;
alter table public.rate_limit_events    enable row level security;

-- admin_users: an admin can see the registry (needed for nothing else)
drop policy if exists "admin_users: admin read" on public.admin_users;
create policy "admin_users: admin read" on public.admin_users
  for select to authenticated using (public.is_admin());

-- products
drop policy if exists "products: public read" on public.products;
create policy "products: public read" on public.products
  for select to anon, authenticated
  using (is_archived = false or public.is_admin());

drop policy if exists "products: admin insert" on public.products;
create policy "products: admin insert" on public.products
  for insert to authenticated with check (public.is_admin());

drop policy if exists "products: admin update" on public.products;
create policy "products: admin update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products: admin delete" on public.products;
create policy "products: admin delete" on public.products
  for delete to authenticated using (public.is_admin());

-- product_submissions / change_requests / deletion_requests / logs: admin only
drop policy if exists "submissions: admin all" on public.product_submissions;
create policy "submissions: admin all" on public.product_submissions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "change_requests: admin all" on public.change_requests;
create policy "change_requests: admin all" on public.change_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "deletion_requests: admin all" on public.deletion_requests;
create policy "deletion_requests: admin all" on public.deletion_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "activity_logs: admin all" on public.admin_activity_logs;
create policy "activity_logs: admin all" on public.admin_activity_logs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- rate_limit_events: no policies → only the service role can touch it.

-- -----------------------------------------------------------------------------
-- 7. Public statistics (safe aggregate exposed to visitors)
-- -----------------------------------------------------------------------------
create or replace function public.public_stats()
returns table (total_products bigint, available_products bigint, community_contributions bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.products where is_archived = false),
    (select count(*) from public.products where is_archived = false and quantity > 0),
    (select count(*) from public.product_submissions where status = 'approved')
    + (select count(*) from public.change_requests where status = 'approved');
$$;
grant execute on function public.public_stats() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 8. Admin review workflows (transactional, SECURITY DEFINER, admin-checked)
-- -----------------------------------------------------------------------------
create or replace function public.assert_admin()
returns void language plpgsql as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
end $$;

-- Helper: write to the audit log
create or replace function public.log_admin_action(
  p_action text, p_target_type text, p_target_id uuid, p_details jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  insert into public.admin_activity_logs (admin_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_details, '{}'::jsonb));
end $$;
grant execute on function public.log_admin_action(text, text, uuid, jsonb) to authenticated;

-- 8a. Approve & publish a visitor submission
create or replace function public.approve_submission(p_submission_id uuid, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.product_submissions%rowtype;
  new_id uuid;
begin
  perform public.assert_admin();

  select * into s from public.product_submissions where id = p_submission_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.status <> 'pending' then raise exception 'Submission has already been reviewed'; end if;

  insert into public.products (name, quantity, image_url, price, colors, category, description, purchase_link)
  values (s.name, s.quantity, s.image_url, s.price, s.colors, s.category, s.description, s.purchase_link)
  returning id into new_id;

  update public.product_submissions
     set status = 'approved', reviewed_at = now(), admin_note = p_note, published_product_id = new_id
   where id = p_submission_id;

  insert into public.admin_activity_logs (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'submission.approved', 'product_submission', p_submission_id,
          jsonb_build_object('product_id', new_id, 'product_name', s.name, 'note', p_note));

  return new_id;
end $$;

-- 8b. Reject a visitor submission
create or replace function public.reject_submission(p_submission_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.product_submissions%rowtype;
begin
  perform public.assert_admin();
  select * into s from public.product_submissions where id = p_submission_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.status <> 'pending' then raise exception 'Submission has already been reviewed'; end if;

  update public.product_submissions
     set status = 'rejected', reviewed_at = now(), admin_note = p_note
   where id = p_submission_id;

  insert into public.admin_activity_logs (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'submission.rejected', 'product_submission', p_submission_id,
          jsonb_build_object('product_name', s.name, 'note', p_note));
end $$;

-- 8c. Approve a change request: applies every proposed field to the product
create or replace function public.approve_change_request(p_request_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r        public.change_requests%rowtype;
  p        public.products%rowtype;
  f        text;
  proposed text;
  applied  jsonb := '{}'::jsonb;
begin
  perform public.assert_admin();

  select * into r from public.change_requests where id = p_request_id for update;
  if not found then raise exception 'Change request not found'; end if;
  if r.status <> 'pending' then raise exception 'Change request has already been reviewed'; end if;

  select * into p from public.products where id = r.product_id for update;
  if not found then raise exception 'The product no longer exists'; end if;

  for f, proposed in
    select key, value ->> 'proposed' from jsonb_each(r.requested_changes)
  loop
    case f
      when 'name' then
        if proposed is null or btrim(proposed) = '' then raise exception 'Proposed name cannot be empty'; end if;
        p.name := btrim(proposed);
      when 'quantity' then
        p.quantity := greatest(0, round(proposed::numeric))::int;
      when 'price' then
        p.price := round(proposed::numeric, 2);
        if p.price < 0 then raise exception 'Price cannot be negative'; end if;
      when 'colors' then
        p.colors := coalesce(
          (select array_agg(btrim(c)) from unnest(string_to_array(coalesce(proposed, ''), ',')) c where btrim(c) <> ''),
          '{}'::text[]);
      when 'image_url' then
        p.image_url := nullif(btrim(proposed), '');
      when 'purchase_link' then
        p.purchase_link := nullif(btrim(proposed), '');
      when 'description' then
        p.description := nullif(btrim(proposed), '');
      when 'category' then
        p.category := nullif(btrim(proposed), '');
      else
        raise exception 'Unsupported field in change request: %', f;
    end case;
    applied := applied || jsonb_build_object(f, proposed);
  end loop;

  update public.products
     set name = p.name, quantity = p.quantity, price = p.price, colors = p.colors,
         image_url = p.image_url, purchase_link = p.purchase_link,
         description = p.description, category = p.category
   where id = p.id;

  update public.change_requests
     set status = 'approved', reviewed_at = now(), admin_note = p_note
   where id = p_request_id;

  insert into public.admin_activity_logs (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'change_request.approved', 'change_request', p_request_id,
          jsonb_build_object('product_id', p.id, 'product_name', p.name, 'applied', applied, 'note', p_note));
end $$;

-- 8d. Reject a change request
create or replace function public.reject_change_request(p_request_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r public.change_requests%rowtype; pname text;
begin
  perform public.assert_admin();
  select * into r from public.change_requests where id = p_request_id for update;
  if not found then raise exception 'Change request not found'; end if;
  if r.status <> 'pending' then raise exception 'Change request has already been reviewed'; end if;
  select name into pname from public.products where id = r.product_id;

  update public.change_requests
     set status = 'rejected', reviewed_at = now(), admin_note = p_note
   where id = p_request_id;

  insert into public.admin_activity_logs (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'change_request.rejected', 'change_request', p_request_id,
          jsonb_build_object('product_id', r.product_id, 'product_name', pname, 'note', p_note));
end $$;

-- 8e. Approve a deletion request: the product is archived (soft-deleted) so it
--     disappears from the public site but stays recoverable by the Admin.
create or replace function public.approve_deletion_request(p_request_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r public.deletion_requests%rowtype; pname text;
begin
  perform public.assert_admin();
  select * into r from public.deletion_requests where id = p_request_id for update;
  if not found then raise exception 'Deletion request not found'; end if;
  if r.status <> 'pending' then raise exception 'Deletion request has already been reviewed'; end if;

  update public.products
     set is_archived = true, archived_at = now()
   where id = r.product_id
   returning name into pname;

  update public.deletion_requests
     set status = 'approved', reviewed_at = now(), admin_note = p_note
   where id = p_request_id;

  insert into public.admin_activity_logs (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'deletion_request.approved', 'deletion_request', p_request_id,
          jsonb_build_object('product_id', r.product_id, 'product_name', pname, 'archived', true, 'note', p_note));
end $$;

-- 8f. Reject a deletion request
create or replace function public.reject_deletion_request(p_request_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r public.deletion_requests%rowtype; pname text;
begin
  perform public.assert_admin();
  select * into r from public.deletion_requests where id = p_request_id for update;
  if not found then raise exception 'Deletion request not found'; end if;
  if r.status <> 'pending' then raise exception 'Deletion request has already been reviewed'; end if;
  select name into pname from public.products where id = r.product_id;

  update public.deletion_requests
     set status = 'rejected', reviewed_at = now(), admin_note = p_note
   where id = p_request_id;

  insert into public.admin_activity_logs (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'deletion_request.rejected', 'deletion_request', p_request_id,
          jsonb_build_object('product_id', r.product_id, 'product_name', pname, 'note', p_note));
end $$;

revoke all on function public.approve_submission(uuid, text) from public;
revoke all on function public.reject_submission(uuid, text) from public;
revoke all on function public.approve_change_request(uuid, text) from public;
revoke all on function public.reject_change_request(uuid, text) from public;
revoke all on function public.approve_deletion_request(uuid, text) from public;
revoke all on function public.reject_deletion_request(uuid, text) from public;
grant execute on function public.approve_submission(uuid, text)        to authenticated;
grant execute on function public.reject_submission(uuid, text)         to authenticated;
grant execute on function public.approve_change_request(uuid, text)    to authenticated;
grant execute on function public.reject_change_request(uuid, text)     to authenticated;
grant execute on function public.approve_deletion_request(uuid, text)  to authenticated;
grant execute on function public.reject_deletion_request(uuid, text)   to authenticated;

-- -----------------------------------------------------------------------------
-- 9. Storage: public bucket for product images
--    * Anyone can read.
--    * Only the Admin can write from the browser; visitor uploads go through the
--      server (service role) after type/size validation.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product-images: public read" on storage.objects;
create policy "product-images: public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');

drop policy if exists "product-images: admin write" on storage.objects;
create policy "product-images: admin write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product-images: admin update" on storage.objects;
create policy "product-images: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product-images: admin delete" on storage.objects;
create policy "product-images: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- =============================================================================
-- Done. Next: create the Admin user and register it (see supabase/admin.sql).
-- =============================================================================
