-- Change 4: the owner's WhatsApp number becomes a first-class setting.
--
-- Run this file in the Supabase SQL Editor of the DEV project, then re-run
-- supabase/seed.sql. It moves any leftover `whatsapp` entry out of the social
-- links repeater into the new column, so the repeater can drop that platform.

begin;

alter table public.site_settings
  add column if not exists whatsapp_number text;

comment on column public.site_settings.whatsapp_number is
  'Nomor WhatsApp pemilik, selalu ternormalisasi: digit saja dan berawalan 62.';

-- Copy the number out of social_links, but never over a value that is already set.
with wa_raw as (
  select s.id,
         (regexp_replace(l ->> 'url', '\D', '', 'g')) as digits
  from public.site_settings s
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(s.social_links) = 'array' then s.social_links else '[]'::jsonb end
  ) as l
  where l ->> 'platform' = 'whatsapp'
),
wa_normalized as (
  select id,
    case
      when digits like '0%' then '62' || substring(digits from 2)
      when digits like '8%' then '62' || digits
      else digits
    end as number
  from wa_raw
  where digits <> ''
)
update public.site_settings s
set whatsapp_number = w.number
from wa_normalized w
where s.id = w.id
  and w.number ~ '^62\d{8,13}$'
  and (s.whatsapp_number is null or btrim(s.whatsapp_number) = '');

-- The repeater no longer owns WhatsApp, so its entries are gone.
update public.site_settings s
set social_links = (
  select coalesce(jsonb_agg(l), '[]'::jsonb)
  from jsonb_array_elements(
    case when jsonb_typeof(s.social_links) = 'array' then s.social_links else '[]'::jsonb end
  ) as l
  where coalesce(l ->> 'platform', '') <> 'whatsapp'
)
where jsonb_typeof(s.social_links) = 'array'
  and exists (
    select 1 from jsonb_array_elements(s.social_links) as e
    where e ->> 'platform' = 'whatsapp'
  );

commit;
