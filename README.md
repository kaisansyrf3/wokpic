# WOKAI PICTURE — Website portofolio wedding photography

Situs portofolio satu-fotografer dengan galeri utama berupa **8 foto 4:3 landscape pada cincin
elips** di sekeliling teks ajakan: klik satu foto → cincin berputar searah jarum jam → foto membesar
lewat transisi shared-element ke halaman detail → tombol tutup memudarkan foto, lalu cincin
berputar kembali ke kiri ke posisi awal.

Ganti nama merek, tagline, dan URL cukup di satu file: `src/config/site.ts`.

Logo merek tampil di pojok kiri atas Header sebagai berkas **`public/logo.png`** (latar
transparan). Berkas itu SENGAJA tidak ada di repo: tidak ada placeholder palsu yang menyamar
sebagai logo. Sampai kamu menaruh gambar asli di path tersebut, Header menampilkan teks
`WOKAI PICTURE` (fallback lewat `onError`). Setelah gambar ada, letakkan di `public/logo.png`
dan sesuaikan dua angka ukuran (`logo.width` / `logo.height`) di `src/config/site.ts` mengikuti
rasio asli berkas. Tinggi tampilnya diatur CSS (`clamp`), jadi berkas besar tidak merusak tata
letak.

> Referensi visual yang dipakai hanya sebagai acuan estetika. Tidak ada merek, logo, nama, foto,
> maupun alur animasi situs lain yang disalin.

---

## Teknologi

| Kebutuhan | Pilihan |
| --- | --- |
| Framework | Next.js 16 (App Router, React Server Components, Server Actions) |
| Bahasa UI | seluruh teks ke pengunjung berbahasa Indonesia; kode & identifier berbahasa Inggris |
| Gaya | Tailwind CSS 4 (`@theme` token di `src/app/globals.css`) |
| Animasi | GSAP 3 (+ Lenis untuk smooth scroll halaman non-landing) |
| Data & auth | Supabase: Postgres + RLS, Auth (email/password), Storage |
| Status klien | Zustand (`src/store`) untuk mesin fase transisi |
| Upload | `browser-image-compression` (kompresi di browser) + `@dnd-kit` untuk urutan drag & drop |
| Email | Nodemailer + Gmail SMTP (tanpa layanan pihak ketiga) |
| Validasi | Zod 4, dipakai ulang di Server Action dan form admin |

---

## Menjalankan secara lokal

Prasyarat: Node 20+ (dipakai Node 24) dan satu project Supabase.

```bash
cp .env.example .env.local   # lalu isi nilainya
npm install
npm run dev                  # http://localhost:3000
```

### 1. Skema database + RLS + Storage

Opsi A (paling mudah, lewat Dashboard Supabase):
  buka **SQL Editor** → paste isi `supabase/migrations/20261001000000_init_schema.sql` → Run,
 lalu ulangi untuk `supabase/migrations/20261001000001_service_categories.sql`.
 Migration pertama membuat tabel, policy RLS, bucket `portfolio` & `site`, dan empat RPC admin;
 yang kedua menambahkan kategori paket plus RPC `save_service` dan `set_service_category_order`.

Opsi B (lewat CLI, sekaligus memasang seed demo):

```bash
npx supabase link --project-ref <REF>
npx supabase db push      # menerapkan migration
# seed demo dijalankan manual di SQL Editor dengan isi supabase/seed.sql,
# atau: npx supabase db reset   (hanya jika project masih benar-benar kosong)
```

`supabase/seed.sql` mengisi 9 project dengan foto placeholder `picsum.photos` 4:3, 8 paket jasa
yang tersebar di tiga kategori (satu paket muncul di dua kategori), 8 slot hero, dan
`site_settings`. Kontennya sengaja tempelan — ganti lewat `/admin`.

### 2. Membuat akun admin

Tanpa akun admin, `/admin` tidak bisa dibuka (proyek baru biasanya punya **0 user**).

1. Dashboard Supabase → **Authentication → Users → Add user**: isi email + password, centang
   *Confirm user manually* agar akun langsung aktif.
2. Berikan role admin di **SQL Editor**:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'email-anda@example.com';
   ```

3. Buka `http://localhost:3000/admin/login`, masuk, dan `Logout`/login ulang bila role baru
   dipasang setelah sesi sebelumnya (role tersimpan di JWT).

Peran `admin` dibaca dari `app_metadata.role`, bukan `user_metadata`, sehingga tidak bisa
diubah sendiri oleh pemegang akun.

### 3. Email Gmail (form Contact)

1. Aktifkan 2-Step Verification di akun Google.
2. Buka <https://myaccount.google.com/apppasswords> → buat App Password 16 karakter.
   Gunakan nilai ini untuk `GMAIL_APP_PASSWORD`, **bukan** password akun.
3. Isi `.env.local`: `GMAIL_USER` (email pengirim) dan `CONTACT_TO_EMAIL` (opsional; kalau kosong,
   pesan dikirim ke `GMAIL_USER` itu sendiri).
4. Uji: kirim lewat `/contact`, lalu cek **Admin → Pesan**. Kolom `email_sent` menandakan
   notifikasi pemilik benar-benar terkirim.

Email tidak pernah memblokir pengunjung: kalau SMTP gagal, pesan tetap tersimpan di tabel
`messages` dan tetap muncul di admin.

### 4. Variabel lingkungan

| Variabel | Terlihat di browser | Dipakai di |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ya | client publik & SSR |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya | baca publik + login (RLS membatasi) |
| `SUPABASE_SERVICE_ROLE_KEY` | **tidak** | `src/lib/supabase/admin.ts` — insert `messages`, upload |
| `GMAIL_USER` | **tidak** | `src/lib/email.ts` |
| `GMAIL_APP_PASSWORD` | **tidak** | `src/lib/email.ts` |
| `CONTACT_TO_EMAIL` | **tidak** | tujuan notifikasi admin |
| `NEXT_PUBLIC_SITE_URL` | ya | `metadataBase`, `robots.txt`, `sitemap.xml` — **wajib URL publik final** |

`.env*` sudah ada di `.gitignore`; hanya `.env.example` yang dilacak. Verifikasi mandiri:

```bash
npm run build
grep -rF "$SUPABASE_SERVICE_ROLE_KEY" .next/static || echo "bersih"
grep -rF "$GMAIL_APP_PASSWORD" .next/static || echo "bersih"
```

---

## Rute publik

| Rute | Isi |
| --- | --- |
| `/` | Cincin foto (hero). Tanpa scroll halaman; statik. |
| `/works/[slug]` | Viewer: satu foto 4:3 besar di tengah (bukan layar-penuh), `‹ ›`, `X` kiri atas, dan tombol `Hubungi Kami` di bawah. |
| `/service` | Paket aktif dalam tiga tab kategori (`Wedding`, `Pre Wedding`, `Graduation`); ganti tab tanpa reload, URL ikut `?category=<slug>`. |
| `/about` | Foto, bio, dan tautan media sosial dari `site_settings`. |
| `/contact` | Form pesan (+ preselect paket lewat `?service=<slug>` dan kategori lewat `?category=<slug>`). |
| `/sitemap.xml`, `/robots.txt` | Di-generate dari database (`src/app/sitemap.ts`, `robots.ts`). |

## Panel admin

Semua rute `/admin/*` dijaga dua lapis: `src/middleware.ts` menolak non-admin, dan RLS menolak
tulisan dari role anon. Halaman: dashboard (peringatan hero ≠ 8 / project tanpa cover),
`projects` + editor (upload, cover, urutan, publish), `hero` (atur tepat 8 project),
`services` + editor (paket, fitur, dan kategori), `about` (profil + media sosial), `messages` (kotak masuk).

Tulis multi-baris selalu lewat RPC `security definer` agar tidak setengah jadi:
`set_hero_items`, `set_project_cover`, `set_project_image_order`, `save_service`,
`set_service_category_order`.

### Kategori paket

Ada tiga kategori tetap: `wedding`, `prewedding`, `graduation`. Satu baris di `services` = satu
paket; tabel `service_category_links` yang menentukan di kategori mana paket tampil dan di urutan
berapa. Karena itu:

- **Nama kategori tidak punya halaman admin.** Ubah lewat SQL, contoh:
  `update public.service_categories set name = 'Engagement' where slug = 'prewedding';`
  (slug dipakai di URL `/service?category=` dan sebaiknya jangan diubah).
- Menambah atau menghapus kategori juga lewat SQL di tabel yang sama.
- Urutan paket per kategori diatur di `/admin/services` dengan menyeret di tab kategori itu saja;
  tab `Semua` hanya untuk melihat.

---

## Cara animasi bekerja

Satu state `rot` (radian) di proxy GSAP; semua posisi foto dihitung dari nilai itu lewat
`src/animations/ringLayout.ts`, dan `onUpdate` memindahkan DOM. Tidak ada posisi yang di-animasi
secara terpisah, jadi cincin tidak pernah "geser sendiri".

```
idle → rotating → expanding → viewing → closing → returning → idle
```

- Fase bukan `idle` mengabaikan klik (mesin fase ada di `src/store`).
- Rotasi selalu ambil selisih terpendek **searah jarum jam**; durasi `0.8 + (delta / 2π) * 1.2`
  detik, easing `power2.inOut`.
- `TransitionProvider` (level root) memiliki satu klon foto tetap; morph ke viewer memakai klon
  itu sehingga tidak ada kedip antar-rute.
- Besar dan posisi foto viewer dihitung satu kali oleh `getViewerFrameRect()`
  (`src/lib/viewerFrame.ts`). Viewer memakai rect itu untuk layout dan `expandToViewer` memakai
  rect yang sama sebagai tujuan animasi, jadi klon selalu mendarat tepat di bingkainya. Tile ring
  dan bingkai viewer sama-sama 4:3, jadi klon membesar seragam tanpa berubah bentuk.
- Latar (`dot-field`, dipasang sekali di root layout sebagai `fixed inset-0`) adalah sumber yang
  sama untuk landing dan viewer — tidak ada kedip latar saat transisi masuk maupun keluar.
- Setelah klon mendarat dan foto viewer ter-decode, klon dihapus lalu keempat kontrol memudar
  masuk (0,4s).
- `X` memicu fase `closing`: kontrol memudar (0,25s), lalu foto memudar (0,4s), baru pindah ke `/`.
  Tidak ada canvas, partikel, atau layar hitam di antara keduanya.
- `Hubungi Kami` mereset store (`phase = idle`, `returning = false`, `delta = 0`,
  `selectedSlug = null`) lalu memudar ke `/service`. Cincin tidak ikut berputar ketika pengunjung
  nanti kembali ke landing.
- Fase `returning` merender cincin pada `rot = delta` dalam keadaan tersembunyi, memunculkannya
  (0,5s), menahan 0,2s, lalu memutar balik ke kiri ke 0.
- Buka `/works/[slug]` langsung (URL, refresh, Share) → delta dihitung dari posisi slug di hero,
  jadi animasi tetap masuk akal tanpa pernah berada di halaman utama.
- Hanya `transform` dan `opacity` yang dianimasi. Seluruh timeline GSAP tinggal di
  `src/animations/` dan dibersihkan dengan `gsap.context()` + `ctx.revert()`.
- Cincin dalam keadaan `idle` benar-benar diam: tidak ada animasi berjalan saat tidak ada aksi.

`prefers-reduced-motion` sengaja **tidak** dipakai sebagai fallback — animasi adalah produknya.
Keputusan ini milik pemilik situs; kalau nanti ingin menghormati setting OS, titik masuknya ada
di `src/components/home/RingGallery.tsx` dan `src/animations/`.

---

## Struktur folder

```
src/
  animations/   ringLayout, ringRotate, ringReturn, expandToViewer, pageReveal
  app/
    (site)/     landing + /service, /about, /contact (chrome: Header/Footer)
    (viewer)/   /works/[slug] viewer 4:3
    admin/      login + (panel)/ dashboard, projects, hero, services, about, messages
    sitemap.ts  robots.ts  layout.tsx  globals.css
  components/   home/ layout/ transition/ viewer/ service/ ui/ admin/
  config/site.ts  nama merek, tagline, URL, logo, tautan navigasi
  lib/          auth, validation, email, imageJob, format, gsap, viewerFrame, viewport, supabase/
  middleware.ts penjaga /admin
  store/        mesin fase transisi (Zustand)
  types/        database.ts (hasil `npm run gen:types`) + content.ts
public/
  logo.png                                    OPSIONAL: logo merek untuk Header; tanpa berkas ini Header pakai teks
supabase/
  migrations/20261001000000_init_schema.sql   tabel, RLS, bucket, RPC
  migrations/20261001000001_service_categories.sql  kategori paket + RPC paket
  seed.sql                                    konten demo
```

## Skrip npm

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` / `build` / `start` | dev server / build produksi / jalankan hasil build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (config Next) |
| `npm run gen:types --project-id=<REF>` | regenerasi `src/types/database.ts` dari Supabase |

---

## Deploy (Vercel)

1. Import repo, lalu isi **semua** variabel di `.env.example` pada Project Settings → Environment
   Variables (Production & Preview). Set `NEXT_PUBLIC_SITE_URL=https://domain-final-anda` —
   `robots.txt`/`sitemap.xml`/Open Graph membaca nilai ini.
2. `vercel.json` mengunci Framework Preset ke Next.js (`"framework": "nextjs"`,
   `"outputDirectory": null`). Tanpa file ini, project yang dibuat sebagai **Other** akan gagal
   dengan `No Output Directory named "public" found after the Build completed` — solusinya sama:
   Project Settings → Building and Deployment → **Framework Preset = Next.js**, lalu redeploy.
3. **Jangan** pindahkan rute `/contact` ke Edge — Nodemailer hanya jalan di runtime Node.js dan
   sudah dikunci lewat `export const runtime` di `src/app/(site)/contact/page.tsx`. Timeout
   function biarkan default (Hobby 300 detik) karena SMTP dikirim secara sinkron.
4. Setelah deploy pertama: jalankan migration di Supabase (kalau belum), buat user admin, dan
   tes form kontak dari domain asli.
5. Peringatan `middleware file convention is deprecated`, `eslint@9.39.5 is no longer supported`,
   dan `unrs-resolver postinstall` aman diabaikan: `middleware.ts` masih berfungsi (Next 16), dan
   Next 16 tidak menjalankan ESLint saat build.

---

## Catatan keamanan

- **RLS di semua tabel.** Anon hanya boleh membaca: `projects` yang `published`,
  `project_images` milik project tayang, `hero_items` yang menunjuk project tayang, `services`
  yang `is_active`, `site_settings`. `messages` tidak punya policy untuk anon sama sekali.
- Insert pesan dilakukan server-side dengan service role key (bypass RLS) supaya data tetap
  terkumpul tanpa membuka tabel ke publik.
- **Rate limit**: 3 pesan per 10 menit per email **dan** per IP (IP dibaca dari
  `x-forwarded-for`/`x-real-ip`). Honeypot tersembunyi `name="website"` — bot yang mengisinya
  mendapat pesan sukses tanpa ada yang disimpan.
- **Header injection**: `subject`/`replyTo` dibersihkan dari CR/LF dan karakter kontrol, lalu
  dipotong 160 karakter (`src/lib/email.ts`).
- **XSS**: teks pengguna tidak pernah masuk ke HTML mentah; body email di-escape sebelum
  `html` dibuat, dan render di admin memakai `whitespace-pre-wrap` biasa.
- Log error SMTP hanya mengambil baris pertama — error Nodemailer bisa memuat baris AUTH yang
  sudah di-base64.
- Upload foto hanya ke bucket `portfolio`/`site` dan hanya untuk admin (policy `storage_admin_*`).
- Tidak ada `localStorage` untuk data penting; tidak ada tabel `packages`/`bookings`.

---

## Asumsi yang diambil

1. Nama merek `WOKAI PICTURE` dipakai di `src/config/site.ts`; ganti sekali, seluruh situs ikut.
2. Rute admin dikelompokkan dalam `(panel)` agar `layout` guard hanya berlaku untuk dashboard;
   halaman login berada di luar kelompok itu.
3. Navigasi `‹ ›` di viewer **melingkar** (dari foto terakhir kembali ke foto pertama).
4. Landing dan `/about` di-prerender statik; setiap aksi admin memanggil `revalidatePath`
   sehingga perubahan tampil tanpa rebuild. `/service` dan `/contact` dinamik karena membaca
   parameter URL (`?category=`, `?service=`).
5. Sumber IP untuk rate limit adalah header proxy; di localhost nilainya `::1` sehingga semua
   percobaan lokal berbagi kuota yang sama.
6. Paket di `?service=` dan kategori di `?category=` hanya divalidasi saat submit; slug asing
   diabaikan (pesan dianggap "belum memilih paket"/tanpa kategori) dan pesannya tetap masuk.
   Nama kategori disimpan sebagai snapshot di `messages.category_name`.
7. Foto diproses di browser menjadi dua versi: `large` 2000 px (maks 1,5 MB) dan `thumb` 600 px
   (maks 250 KB) berupa WebP (fallback JPEG), plus LQIP blur ~20 px untuk placeholder.
8. Harga disimpan sebagai integer Rupiah dan ditampilkan dengan `formatRupiah`; tidak ada
   konversi mata uang.
9. Satu-satunya peran adalah `admin` (di `app_metadata.role`); tidak ada editor/fotografer kedua.
10. Seed memakai `picsum.photos` agar bisa langsung dilihat; ganti dengan foto asli lewat
    `/admin/projects` sebelum tayang.
11. `NEXT_PUBLIC_SITE_URL` belum diisi di pengembangan, jadi `robots.txt`/`sitemap.xml` lokal
    menunjuk ke `localhost:3000`.
12. Lebar tile cincin mobile berakhir di ±25% lebar layar (bukan 28% seperti panduan awal) karena
    margin aman tepi layar dan teks ajakan di tengah; semua tile tetap persis 4:3 dan tidak saling menutup.
13. `‹ ›` ditempatkan di luar bingkai hanya bila space-nya cukup (celah 24 px + tombol 44 px +
    12 px dari tepi layar); selain itu — termasuk di mobile — tombol menumpang di tepi foto dengan
    latar gelap.
14. Tombol "Hubungi Kami" memudar bersama seluruh container viewer (0,3 s). Situs ini tidak punya
    fade antar-halaman lain, jadi gaya itulah yang dipakai sebagai acuan.
15. `dot-field` sekarang dipasang sekali di root layout sebagai `fixed inset-0`. Di halaman yang
    bisa digulir polanya ikut diam (tidak ikut bergulir) — harganya kecil, dan berkat ini landing
    dan viewer benar-benar memakai latar yang sama.
16. Teks "Klik gambar untuk melihat portofolio kami" di tengah ring adalah `<p>` biasa tanpa
    `tabindex`: statis, tidak bisa diklik atau difokuskan, dan memudar bersama cincin. Lebarnya
    dihitung dari geometri (60% ruang kosong di antara tile yang benar-benar segaris dengan teks,
    maksimal 220 px, minimal 88 px) sehingga tidak pernah menutupi foto pada tinggi viewport apa pun.

## Masalah yang sering muncul

| Gejala | Penyebab & solusi |
| --- | --- |
| `/admin/login` menulis "Sesi berakhir..." padahal password benar | user belum punya `app_metadata.role = "admin"` |
| Muncul `reason=config` di URL login | `NEXT_PUBLIC_SUPABASE_URL`/anon key kosong di env |
| `Invalid login: 535-5.7.8` pada log email | App Password salah/kedaluwarsa, atau 2FA belum aktif |
| Email tidak pernah datang padahal pesan masuk | `GMAIL_*` kosong — cek kolom `email_sent` di `/admin/messages` |
| "Terlalu banyak percobaan..." saat mengetes form | kuota 3/10 menit tercapai; hapus baris uji di tabel `messages` |
| Halaman utama kosong/"Portofolio sedang disiapkan" | `hero_items` belum berisi tepat 8 project bertayangan dengan cover |
| Build gagal pada `contact/actions.ts` dengan "module has no exports" | ada `export const` non-fungsi di file `"use server"` — deklarasikan `runtime` di `page.tsx` |
