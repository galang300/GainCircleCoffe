# Keputusan tim dan pertanyaan terbuka

## Keputusan yang sudah diambil

| Hal | Keputusan |
|---|---|
| Struktur repo | Satu repo (monorepo): `frontend/`, `backend/`, `GEN-AI/`, `docs/`. Folder `GEN-AI/` dipertahankan sesuai yang sudah dipush tim |
| Visibilitas repo | Publik. Konsekuensinya: tidak ada rahasia, data pribadi, atau dokumen internal di repo (lihat `README.md`) |
| Lisensi | Belum memakai lisensi |
| Alur git | `main` dilindungi. Perubahan lewat cabang dan Pull Request. Format commit ada di `CONTRIBUTING.md` |
| Stack frontend | React 18, Vite 8, Tailwind, React Router 7, react-hook-form + zod 4, Axios, MSW untuk data contoh, Vitest 5, Playwright |
| Grafik | SVG buatan sendiri (bukan pustaka grafik), agar sesuai desain dan ringan |
| Versi Node | 22 (`.nvmrc`), minimal 20.19 |

## Pertanyaan untuk tim backend

| # | Pertanyaan | Dampak |
|---|---|---|
| 1 | Setujukah dengan endpoint bertanda **[tambahan]** di `KONTRAK_API.md`? (`availability?date=`, `expenses/summary`, `staff/tables/log`, `kpi` pada daftar reservasi) | Bila tidak, frontend disesuaikan |
| 2 | Penyimpanan token: tetap di `sessionStorage` atau memakai refresh cookie `httpOnly`? | Keamanan sesi |
| 3 | Siapa yang membuat akun staf dan owner? (seed database atau halaman admin) | Tidak ada layar untuk ini di desain |
| 4 | Format kode error dan aturan OTP sudah sama dengan `KONTRAK_API.md`? | Pesan galat di frontend |

## Pertanyaan untuk tim GEN-AI

| # | Pertanyaan | Dampak |
|---|---|---|
| 1 | Aturan label di notebook (Sehat / Waspada / Kritis) sama dengan yang dipakai frontend: rasio pengeluaran ÷ omzet, Sehat ≤ 70%, Waspada 70–90%, Kritis > 90%? | Status di layar harus konsisten dengan model |
| 2 | Bagaimana model disajikan ke backend? (layanan Python terpisah, atau dimuat langsung oleh backend) | Menentukan siapa yang menyediakan endpoint `/cashflow/*` |
| 3 | Bisakah keluaran model mencakup status, rasio, tingkat keyakinan, dan faktor utama (nilai SHAP)? | Itu yang ditampilkan di halaman Arus Kas, lihat `KONTRAK_API.md` |
| 4 | Asisten AI: model bahasa apa dan bagaimana sumber jawabannya ditampilkan? | Frontend menampilkan intent dan sumber di setiap jawaban |

Data di repo publik ini harus tetap sintetis. Jangan commit data keuangan asli kafe.

## Pertanyaan untuk owner

Semua nilai ini sudah dipakai sebagai asumsi di kode (`frontend/src/lib/constants.js` dan `frontend/src/lib/slots.js`).

| # | Hal | Dipakai sekarang |
|---|---|---|
| 1 | Ambang status kas | Sehat ≤ 70%, Waspada 70–90%, Kritis > 90% |
| 2 | Durasi sesi dan jam buka | 2 jam; 07.00–00.00 WIB |
| 3 | Slot yang sudah dimulai | Tidak bisa dipesan |
| 4 | Pembatalan oleh pelanggan | Tidak ada. Pelanggan diarahkan ke Instagram |
| 5 | Kebijakan no-show | Aktif 15 menit setelah jam mulai, meja dilepas, tanpa sanksi |
| 6 | Pelanggan walk-in | Tidak tercatat otomatis di sistem |
| 7 | Hak akses staf | Staf tidak melihat rasio/status kas. Owner melihat semuanya |
| 8 | Batas reservasi aktif per akun | Belum didefinisikan |
| 9 | Reset kata sandi | Tidak ada. Diarahkan ke owner |

## Yang masih perlu disiapkan

- Logo resmi (frontend memakai hasil penelusuran dari Figma) dan ilustrasi stiker.
- Teks resmi aturan reservasi dan kebijakan privasi (aplikasi mengumpulkan nama, email, dan nomor WhatsApp).
- Domain dan variabel lingkungan produksi untuk deploy.
- Pengujian dengan backend asli, di Safari/iOS dan Firefox, dan UAT bersama owner.
