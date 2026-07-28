# Taha Group — Work Space

Website internal karyawan Taha Group. Login & registrasi karyawan, dashboard per-divisi (Advertising, Accounting, Customer Service, Production, Video Editor, dll), manajemen tugas dengan isolasi antar-divisi, kalender & laporan harian, inbox, dan notifikasi otomatis lewat **WhatsApp (gratis, via Baileys)** dan **Email (gratis, via Gmail)**.

Desain: **Liquid Glass**, terinspirasi dari bahasa desain iOS terbaru Apple (glassmorphism, blur, gradient aurora, animasi halus).

## Tumpukan Teknologi
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- - Prisma ORM + PostgreSQL
  - - Autentikasi sesi JWT (cookie httpOnly)
    - - Notifikasi WhatsApp: **Baileys** (WhatsApp Web multi-device, open-source, gratis, tanpa API key)
      - - Notifikasi Email: **Nodemailer + Gmail App Password** (gratis, pakai akun Gmail sendiri)
        - - Grafik: Recharts
         
          - ## 1. Instalasi
         
          - ```bash
            npm install
            cp .env.example .env
            ```

            Buka `.env` dan sesuaikan:
            - `JWT_SECRET` — isi string acak yang panjang & rahasia.
            - - `GMAIL_USER` / `GMAIL_APP_PASSWORD` — lihat langkah di bawah.
              - - `ADMIN_WHATSAPP` / `ADMIN_EMAIL` — kontak Admin Utama.
               
                - ## 2. Setup Database
               
                - ```bash
                  npx prisma migrate dev --name init
                  npm run seed
                  ```

                  Seed akan membuat:
                  - Akun **Admin Utama** (induk): username `admin`, password `admin123`
                  - - 5 divisi awal: Management Acounting, Management Advertising, Management Production, Costumer Service, Video Editor
                    - - Beberapa karyawan & data contoh di tiap modul (tugas, daily record, laporan advertising/accounting/CS)
                     
                      - **Segera ganti password admin setelah login pertama kali.**
                     
                      - ## 3. Setup Notifikasi Email (GRATIS — Gmail App Password)
                     
                      - 1. Aktifkan **2-Step Verification** di akun Google: https://myaccount.google.com/security
                        2. 2. Buat App Password: https://myaccount.google.com/apppasswords
                           3. 3. Isi `GMAIL_USER` (alamat Gmail) dan `GMAIL_APP_PASSWORD` (16 digit dari langkah 2) di `.env`.
                             
                              4. Tidak ada biaya, tidak ada API key pihak ketiga.
                             
                              5. ## 4. Setup Notifikasi WhatsApp (GRATIS — Baileys)
                             
                              6. Baileys menghubungkan akun WhatsApp biasa (bukan WhatsApp Business API berbayar) sebagai "pengirim" notifikasi, mirip WhatsApp Web.
                             
                              7. ```bash
                                 npm run wa:start
                                 ```

                                 - Sebuah QR code akan muncul di terminal.
                                 - - Buka WhatsApp di HP yang akan jadi nomor pengirim notifikasi → **Perangkat Tertaut** → **Tautkan Perangkat** → scan QR tersebut.
                                   - - Setelah tersambung, biarkan proses ini tetap berjalan (gunakan `pm2` atau `screen`/`tmux` di server agar tidak mati saat terminal ditutup).
                                     - - Sesi tersimpan di folder `wa-session/` sehingga tidak perlu scan ulang setiap restart (kecuali logout dari HP).
                                      
                                       - > Catatan: fitur ini butuh proses Node yang **terus berjalan**. Jika `WA_ENABLED=false`, sistem tetap berjalan normal dan notifikasi WA hanya dicatat di log (email & inbox tetap aktif).
                                         >
                                         > ## 5. Menjalankan Aplikasi
                                         >
                                         > ```bash
                                         > npm run dev       # mode pengembangan → http://localhost:3000
                                         > # atau untuk produksi:
                                         > npm run build
                                         > npm start
                                         > ```
                                         >
                                         > Jalankan `npm run wa:start` di terminal terpisah (opsional, kalau ingin notifikasi WA aktif).
                                         >
                                         > ## Struktur Peran (Role)
                                         >
                                         > - **SUPERADMIN** (Admin Utama / induk website) — satu-satunya yang bisa: membuat & mendistribusikan tugas ke divisi manapun, mengaktifkan akun karyawan baru, menambah divisi, menambah produk resmi, menerbitkan slip gaji, melihat semua data lintas divisi.
                                         > - - **DIVISION_HEAD** — kepala divisi, bisa mengelola anggota & data di divisinya sendiri.
                                         >   - - **STAFF** — karyawan biasa, hanya melihat & mengerjakan tugas serta laporan di divisinya sendiri (isolasi otomatis lewat query database, tidak bisa melihat divisi lain).
                                         >    
                                         >     - ## Alur Notifikasi
                                         >    
                                         >     - Setiap kali Admin Utama memberi tugas ke sebuah divisi/karyawan:
                                         >     - 1. Dicatat di database (`Notification`).
                                         >       2. 2. Dikirim ke **WhatsApp** karyawan tersebut (`lib/whatsapp.ts`).
                                         > 3. Dikirim ke **Email/Gmail** karyawan tersebut (`lib/email.ts`).
                                         > 4. 4. Muncul di **Inbox** internal — HANYA untuk karyawan/divisi yang dituju.
                                         >   
                                         >    5. ## Deploy ke Railway (online, database Postgres)
                                         >   
                                         >    6. Proyek ini sudah disiapkan untuk deploy ke Railway:
                                         >    7. - `prisma/schema.prisma` pakai provider `postgresql`.
                                         >       - - `railway.toml` otomatis menjalankan migrasi database (`prisma migrate deploy`) sebelum `npm start`.
                                         >         - - `package.json` "start" script sudah membaca `$PORT` dari Railway.
                                         >          
                                         >           - Langkah singkat:
                                         >           - 1. Push folder ini ke sebuah GitHub repository.
                                         >             2. 2. Di Railway: buat project baru → tambah service Postgres → tambah service dari GitHub repo ini.
                                         >                3. 3. Set environment variable pada service web: `DATABASE_URL`, `JWT_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `WA_ENABLED`, `WA_PAIRING_PHONE`, `ADMIN_WHATSAPP`, `ADMIN_EMAIL`.
                                         >                   4. 4. Generate domain publik dari Railway untuk service web.
                                         >                      5. 5. (Opsional) Jalankan `npm run seed` sekali lewat Railway shell/one-off command untuk data contoh.
                                         >                         6. 6. (Opsional) Deploy `npm run wa:start` sebagai service terpisah untuk notifikasi WhatsApp.
                                         >                            7. 
