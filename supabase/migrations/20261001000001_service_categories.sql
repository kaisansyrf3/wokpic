-- Service categories: Wedding, Pre Wedding, Graduation.
--
-- One package lives in exactly one row of `services`; the link table decides in
-- which categories it appears and in what order inside each of them. Existing
-- packages are backfilled into `wedding` so nothing is lost, after which the old
-- `services.sort_order` column disappears — order now belongs to a category.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order int not null default 0
);

insert into public.service_categories (slug, name, sort_order) values
  ('wedding', 'Wedding', 0),
  ('prewedding', 'Pre Wedding', 1),
  ('graduation', 'Graduation', 2)
on conflict (slug) do update
  set name = excluded.name, sort_order = excluded.sort_order;

create table if not exists public.service_category_links (
  service_id uuid not null references public.services(id) on delete cascade,
  category_id uuid not null references public.service_categories(id) on delete cascade,
  sort_order int not null default 0,
  primary key (service_id, category_id)
);

create index if not exists service_category_links_category_order_idx
  on public.service_category_links (category_id, sort_order);

-- ---------------------------------------------------------------------------
-- Backfill old packages into Wedding, then retire services.sort_order
-- ---------------------------------------------------------------------------

insert into public.service_category_links (service_id, category_id, sort_order)
select s.id, c.id, s.sort_order
from public.services s
join public.service_categories c on c.slug = 'wedding'
on conflict (service_id, category_id) do nothing;

alter table public.services drop column if exists sort_order;

-- Snapshot of the category a visitor came from, kept even if the package moves.
alter table public.messages add column if not exists category_name text;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.service_categories enable row level security;
alter table public.service_category_links enable row level security;

-- The three category names are public information.
drop policy if exists service_categories_public_read on public.service_categories;
create policy service_categories_public_read on public.service_categories
  for select
  using (true);

drop policy if exists service_categories_admin_insert on public.service_categories;
create policy service_categories_admin_insert on public.service_categories
  for insert to authenticated with check (public.is_admin());

drop policy if exists service_categories_admin_update on public.service_categories;
create policy service_categories_admin_update on public.service_categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists service_categories_admin_delete on public.service_categories;
create policy service_categories_admin_delete on public.service_categories
  for delete to authenticated using (public.is_admin());

-- A link is public only while its package is active, so deactivating a package
-- hides it from every category at once.
drop policy if exists service_category_links_public_read on public.service_category_links;
create policy service_category_links_public_read on public.service_category_links
  for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.services s
      where s.id = service_category_links.service_id and s.is_active = true
    )
  );

drop policy if exists service_category_links_admin_insert on public.service_category_links;
create policy service_category_links_admin_insert on public.service_category_links
  for insert to authenticated with check (public.is_admin());

drop policy if exists service_category_links_admin_update on public.service_category_links;
create policy service_category_links_admin_update on public.service_category_links
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists service_category_links_admin_delete on public.service_category_links;
create policy service_category_links_admin_delete on public.service_category_links
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- One call stores the package and its categories, so a half-saved package is
-- impossible. New category memberships land at the end of that category.
create or replace function public.save_service(
  target_id uuid,
  service_slug text,
  service_name text,
  service_tagline text,
  service_price bigint,
  service_features jsonb,
  service_is_active boolean,
  category_slugs text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  cid uuid;
  next_pos int;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengubah paket';
  end if;

  if category_slugs is null or array_length(category_slugs, 1) is null then
    raise exception 'Paket harus masuk ke minimal satu kategori';
  end if;

  if exists (
    select 1
    from unnest(category_slugs) as wanted(slug)
    where not exists (
      select 1 from public.service_categories c where c.slug = wanted.slug
    )
  ) then
    raise exception 'Kategori paket tidak dikenal';
  end if;

  if target_id is null then
    insert into public.services (slug, name, tagline, price, features, is_active)
    values (service_slug, service_name, service_tagline, service_price, service_features, service_is_active)
    returning id into sid;
  else
    update public.services
    set slug = service_slug,
        name = service_name,
        tagline = service_tagline,
        price = service_price,
        features = service_features,
        is_active = service_is_active
    where id = target_id;

    if not found then
      raise exception 'Paket tidak ditemukan';
    end if;

    sid := target_id;
  end if;

  delete from public.service_category_links l
  where l.service_id = sid
    and l.category_id not in (
      select c.id from public.service_categories c where c.slug = any (category_slugs)
    );

  for cid in
    select c.id
    from public.service_categories c
    where c.slug = any (category_slugs)
      and not exists (
        select 1 from public.service_category_links l
        where l.service_id = sid and l.category_id = c.id
      )
    order by c.sort_order
  loop
    select coalesce(max(l.sort_order), -1) + 1 into next_pos
    from public.service_category_links l
    where l.category_id = cid;

    insert into public.service_category_links (service_id, category_id, sort_order)
    values (sid, cid, next_pos);
  end loop;

  return sid;
end;
$$;

-- Persists a dragged package order inside one category only.
create or replace function public.set_service_category_order(
  category_slug text,
  service_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  link_category uuid;
  sid uuid;
  idx int := 0;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengurutkan paket';
  end if;

  select id into link_category from public.service_categories where slug = category_slug;

  if link_category is null then
    raise exception 'Kategori tidak dikenal';
  end if;

  foreach sid in array service_ids loop
    update public.service_category_links
    set sort_order = idx
    where category_id = link_category and service_id = sid;
    idx := idx + 1;
  end loop;
end;
$$;

-- Order used to be a column on the package itself.
drop function if exists public.set_service_order(uuid[]);
