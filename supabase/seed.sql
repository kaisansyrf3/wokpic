-- Demo seed. Run with `supabase db reset` or apply manually as a role that
-- bypasses RLS (postgres / service_role). Everything here is placeholder
-- content meant to be replaced by the owner through /admin.

begin;

-- ---------------------------------------------------------------------------
-- Projects + images
-- ---------------------------------------------------------------------------

create temp table seed_project (
  ord int,
  slug text,
  title text,
  category text,
  description text,
  published boolean,
  photo_count int
) on commit drop;

insert into seed_project (ord, slug, title, category, description, published, photo_count) values
  (1, 'senja-di-ubud',      'Senja di Ubud',       'wedding',    'Upacara sore di tengah sawah terasering, ditutup langit jingga Ubud.', true, 7),
  (2, 'janji-di-pantai',    'Janji di Pantai',     'prewedding', 'Sesi prewedding pieds nus di garis pantai selatan saat matahari turun.', true, 6),
  (3, 'akad-keluarga-harta','Akad Keluarga Harta', 'wedding',    'Akad khidmat di rumah keluarga, dilanjutkan makan siang bersama.', true, 5),
  (4, 'kabut-bratan',       'Kabut Bratan',        'prewedding', 'Pagi berkabut di tepi danau, dengan doa-doa yang diucapkan pelan.', true, 8),
  (5, 'malam-di-jiwa',      'Malam di Jiwa',       'wedding',    'Resepsi malam dengan lampu hangat dan tarian yang tak mau berhenti.', true, 6),
  (6, 'lamaran-mentari',    'Lamaran Mentari',     'engagement', 'Pertemuan dua keluarga, satu cincin, dan banyak tawa.', true, 5),
  (7, 'cerita-bukit-tinggi','Cerita Bukit Tinggi', 'prewedding', 'Perjalanan dua hari di perbukitan, direkam apa adanya.', true, 7),
  (8, 'putih-di-taman',     'Putih di Taman',      'wedding',    'Pernikahan taman serba putih, sederhana dan tenang.', true, 6),
  (9, 'arsip-kota-lama',    'Arsip Kota Lama',     'engagement', 'Cadangan di luar hero: sesi sore di sudut kota tua.', true, 5);

do $$
declare
  sp record;
  project_uuid uuid;
  i int;
  seed_key text;
begin
  for sp in select * from seed_project order by ord loop
    insert into public.projects (slug, title, category, description, published)
    values (sp.slug, sp.title, sp.category, sp.description, sp.published)
    on conflict (slug) do update
      set title = excluded.title,
          category = excluded.category,
          description = excluded.description,
          published = excluded.published
    returning id into project_uuid;

    select id into project_uuid from public.projects where slug = sp.slug;

    delete from public.project_images where project_id = project_uuid;

    for i in 1..sp.photo_count loop
      seed_key := 'ikai-' || sp.slug || '-' || i;
      insert into public.project_images (
        project_id, url, thumb_url, width, height, blur_data_url, is_cover, sort_order
      ) values (
        project_uuid,
        'https://picsum.photos/seed/' || seed_key || '/800/1200',
        'https://picsum.photos/seed/' || seed_key || '/300/450',
        800,
        1200,
        null,
        i = 1,
        i - 1
      );
    end loop;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Hero: first 8 published projects with a cover, positions 0..7
-- ---------------------------------------------------------------------------

delete from public.hero_items;

insert into public.hero_items (project_id, position)
select p.id, sp.ord - 1
from seed_project sp
join public.projects p on p.slug = sp.slug
where sp.ord <= 8
order by sp.ord;

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------

delete from public.services;

insert into public.services (slug, name, tagline, price, features, is_active, sort_order) values
  ('prewedding', 'Prewedding', 'Satu hari, satu cerita sebelum hari H.', 3500000,
   '["Sesi foto 4 jam di 1 lokasi", "1 fotografer + 1 asisten", "40 foto terpilih diedit", "Galeri online 6 bulan", "Konsultasi konsep & wardrobe"]'::jsonb,
   true, 0),

  ('akad-nikah', 'Akad Nikah', 'Momen ijab kabul yang tidak terulang.', 4500000,
   '["Liputan 5 jam", "2 fotografer", "80 foto terpilih diedit", "Album kolase 20x30", "Galeri online 12 bulan", "Foto keluarga formal"]'::jsonb,
   true, 1),

  ('resepsi', 'Resepsi', 'Perayaan, tawa, dan semua yang hadir di antaranya.', 6000000,
   '["Liputan 6 jam", "2 fotografer", "120 foto terpilih diedit", "Album kolase 20x30", "Galeri online 12 bulan", "Dokumentasi dekorasi & detail"]'::jsonb,
   true, 2),

  ('akad-resepsi', 'Akad + Resepsi', 'Dua momen penting dalam satu hari penuh.', 9500000,
   '["Liputan 10 jam", "2 fotografer + 1 asisten", "200 foto terpilih diedit", "Album eksklusif 30x40", "Galeri online 24 bulan", "Sesi foto keluarga lengkap", "Cuplikan video 60 detik"]'::jsonb,
   true, 3),

  ('full-day-wedding', 'Full Day Wedding', 'Dari persiapan subuh sampai pesta selesai.', 14000000,
   '["Liputan 14 jam", "3 fotografer", "300 foto terpilih diedit", "Album eksklusif 30x40 + 2 album mini", "Galeri online 24 bulan", "Persiapan pengantin (getting ready)", "Video sinematik 3 menit"]'::jsonb,
   true, 4),

  ('premium-bundle', 'Premium Bundle', 'Paket lengkap dengan tim dan arsip jangka panjang.', 22500000,
   '["Liputan 2 hari (prewedding + pernikahan)", "4 fotografer + 1 videografer", "500 foto terpilih diedit", "Album premium 40x50 + box kayu", "Video sinematik 5 menit + teaser 60 detik", "Galeri online tanpa batas waktu", "Cetak kanvas 60x90", "Sesi foto keluarga besar"]'::jsonb,
   true, 5);

-- ---------------------------------------------------------------------------
-- Site settings
-- ---------------------------------------------------------------------------

update public.site_settings
set about_name = 'Nama Fotografer',
    about_role = 'Wedding Photographer',
    about_bio  = 'Saya merekam pernikahan dengan pendekatan dokumenter: tenang, tidak banyak arahan, dan membiarkan momen terjadi apa adanya. Berbasis di Bali, sering bepergian ke seluruh Indonesia.',
    about_photo_url = null,
    social_links = '[
      {"platform":"instagram","url":"https://instagram.com/placeholder"},
      {"platform":"whatsapp","url":"https://wa.me/6281200000000"}
    ]'::jsonb
where id = 1;

commit;
