-- Wedding photography portfolio: initial schema, RLS, storage buckets and admin RPCs.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text,
  description text,
  published boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url text not null,
  thumb_url text,
  width int,
  height int,
  blur_data_url text,
  is_cover boolean not null default false,
  sort_order int not null default 0
);

create index if not exists project_images_project_idx
  on public.project_images(project_id, sort_order);

create unique index if not exists one_cover_per_project
  on public.project_images(project_id) where is_cover;

create table if not exists public.hero_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid unique not null references public.projects(id) on delete cascade,
  position int not null unique check (position between 0 and 7)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  price bigint not null check (price >= 0),
  features jsonb not null default '[]',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  service_id uuid references public.services(id) on delete set null,
  service_name text,
  body text not null,
  ip text,
  email_sent boolean not null default false,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists messages_created_at_idx on public.messages(created_at desc);
create index if not exists messages_is_read_idx on public.messages(is_read);

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  about_name text,
  about_role text,
  about_bio text,
  about_photo_url text,
  social_links jsonb not null default '[]'
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Admin helper
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.hero_items enable row level security;
alter table public.services enable row level security;
alter table public.messages enable row level security;
alter table public.site_settings enable row level security;

-- projects: public reads published only, admin writes everything
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects
  for select
  using (published = true or public.is_admin());

drop policy if exists projects_admin_insert on public.projects;
create policy projects_admin_insert on public.projects
  for insert to authenticated with check (public.is_admin());

drop policy if exists projects_admin_update on public.projects;
create policy projects_admin_update on public.projects
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists projects_admin_delete on public.projects;
create policy projects_admin_delete on public.projects
  for delete to authenticated using (public.is_admin());

-- project_images: public reads only when the parent project is published
drop policy if exists project_images_public_read on public.project_images;
create policy project_images_public_read on public.project_images
  for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_images.project_id and p.published = true
    )
  );

drop policy if exists project_images_admin_insert on public.project_images;
create policy project_images_admin_insert on public.project_images
  for insert to authenticated with check (public.is_admin());

drop policy if exists project_images_admin_update on public.project_images;
create policy project_images_admin_update on public.project_images
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists project_images_admin_delete on public.project_images;
create policy project_images_admin_delete on public.project_images
  for delete to authenticated using (public.is_admin());

-- hero_items: public reads only rows pointing at published projects
drop policy if exists hero_items_public_read on public.hero_items;
create policy hero_items_public_read on public.hero_items
  for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = hero_items.project_id and p.published = true
    )
  );

-- hero_items writes go through public.set_hero_items() (security definer),
-- so no direct write policy is granted to any role.

-- services: public reads active only
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select
  using (is_active = true or public.is_admin());

drop policy if exists services_admin_insert on public.services;
create policy services_admin_insert on public.services
  for insert to authenticated with check (public.is_admin());

drop policy if exists services_admin_update on public.services;
create policy services_admin_update on public.services
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists services_admin_delete on public.services;
create policy services_admin_delete on public.services
  for delete to authenticated using (public.is_admin());

-- messages: NO anon access at all. Inserts happen server-side with the
-- service role key, which bypasses RLS. Only admin can read/update/delete.
drop policy if exists messages_admin_read on public.messages;
create policy messages_admin_read on public.messages
  for select to authenticated using (public.is_admin());

drop policy if exists messages_admin_update on public.messages;
create policy messages_admin_update on public.messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists messages_admin_delete on public.messages;
create policy messages_admin_delete on public.messages
  for delete to authenticated using (public.is_admin());

-- site_settings: public read, admin write
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings
  for select using (true);

drop policy if exists site_settings_admin_insert on public.site_settings;
create policy site_settings_admin_insert on public.site_settings
  for insert to authenticated with check (public.is_admin());

drop policy if exists site_settings_admin_update on public.site_settings;
create policy site_settings_admin_update on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets and policies
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true), ('site', 'site', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select
  using (bucket_id in ('portfolio', 'site'));

drop policy if exists storage_admin_insert on storage.objects;
create policy storage_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('portfolio', 'site') and public.is_admin());

drop policy if exists storage_admin_update on storage.objects;
create policy storage_admin_update on storage.objects
  for update to authenticated
  using (bucket_id in ('portfolio', 'site') and public.is_admin())
  with check (bucket_id in ('portfolio', 'site') and public.is_admin());

drop policy if exists storage_admin_delete on storage.objects;
create policy storage_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('portfolio', 'site') and public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin RPCs: multi-row writes that must never be stored half-finished
-- ---------------------------------------------------------------------------

-- Replaces the whole hero list atomically. Requires exactly 8 unique,
-- published projects that each have a cover image.
create or replace function public.set_hero_items(project_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
  pos int := 0;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengubah hero';
  end if;

  if coalesce(array_length(project_ids, 1), 0) <> 8 then
    raise exception 'Hero harus berisi tepat 8 project';
  end if;

  if (select count(distinct x) from unnest(project_ids) as x) <> 8 then
    raise exception 'Project hero tidak boleh duplikat';
  end if;

  if exists (
    select 1
    from unnest(project_ids) as candidate(id)
    where not exists (
      select 1
      from public.projects p
      where p.id = candidate.id and p.published = true
    )
  ) then
    raise exception 'Semua project hero harus berstatus published';
  end if;

  if exists (
    select 1
    from unnest(project_ids) as candidate(id)
    where not exists (
      select 1
      from public.project_images i
      where i.project_id = candidate.id and i.is_cover = true
    )
  ) then
    raise exception 'Semua project hero harus punya foto utama';
  end if;

  delete from public.hero_items;

  foreach pid in array project_ids loop
    insert into public.hero_items (project_id, position) values (pid, pos);
    pos := pos + 1;
  end loop;
end;
$$;

-- Marks one image as the project cover and clears the previous one atomically.
create or replace function public.set_project_cover(image_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_project uuid;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengubah foto utama';
  end if;

  select project_id into target_project
  from public.project_images
  where id = image_id;

  if target_project is null then
    raise exception 'Foto tidak ditemukan';
  end if;

  update public.project_images set is_cover = false where project_id = target_project;
  update public.project_images set is_cover = true where id = image_id;
end;
$$;

-- Persists a dragged image order for one project.
create or replace function public.set_project_image_order(
  target_project_id uuid,
  image_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  iid uuid;
  idx int := 0;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengurutkan foto';
  end if;

  foreach iid in array image_ids loop
    update public.project_images
    set sort_order = idx
    where id = iid and project_id = target_project_id;
    idx := idx + 1;
  end loop;
end;
$$;

-- Persists a dragged package order.
create or replace function public.set_service_order(service_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  idx int := 0;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengurutkan paket';
  end if;

  foreach sid in array service_ids loop
    update public.services set sort_order = idx where id = sid;
    idx := idx + 1;
  end loop;
end;
$$;
