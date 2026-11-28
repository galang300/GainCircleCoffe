# Laporan verifikasi

Semua pengujian dijalankan terhadap mode contoh (backend tiruan MSW). **Belum ada pengujian terhadap backend asli.**

## Yang dijalankan dan hasilnya

| Pemeriksaan | Perintah / cara | Hasil |
|---|---|---|
| Lint | `npm run lint` (nol peringatan) | Lolos |
| Tes unit, skema form, komponen, backend tiruan | `npm test` | 45 tes, 8 berkas, lolos |
| Tes E2E | `npm run test:e2e` (Chromium; 5 skenario × desktop 1280px dan ponsel 390px) | 10/10 lolos, diulang 3× tanpa flaky |
| Aksesibilitas otomatis | axe-core, WCAG 2.0 A dan AA, 10 halaman (beranda, masuk, cek tiket, staf masuk, pilih meja, arus kas, reservasi, status meja, pengeluaran, asisten) | 0 pelanggaran (setelah memperbaiki temuan kontras) |
| Overflow horizontal di 390px | `/`, `/masuk`, `/cek-tiket`, `/dashboard/pengeluaran`, `/dashboard/kas` | Tidak ada (satu temuan sudah diperbaiki) |
| Error console | Seluruh alur pelanggan, staf, owner | Tidak ada |
| Keamanan dependensi | `npm audit` (produksi dan dev) | 0 kerentanan |
| Build produksi bersih dari demo | Build dengan `VITE_USE_MOCKS=false`, cari `password123`, `owner12345`, `staf12345`, `482913` | Tidak ditemukan |
| Build | `npm run build` | Lolos. Bundel awal sekitar 119 kB gzip. PDF (`jspdf`, ~125 kB gzip) baru dimuat saat tombol "Unduh PDF" diklik |

Skenario E2E: reservasi sampai e-ticket; konflik 409 lalu pilih ulang; guard rute (tamu → masuk, staf ditolak dari halaman owner); status kas owner dan asisten menjawab; tanpa overflow horizontal.
Alur lain dijalankan lewat skrip Playwright terpisah (tidak disertakan): check-in dari drawer, ubah status meja, catat pengeluaran, impor CSV dengan baris error, asisten gagal lalu "Coba lagi", tampilan ponsel owner.

Tes backend tiruan (langsung dan lewat jalur penuh Axios → MSW) menguji aturan inti: OTP 3 percobaan, pemisahan peran 403, double-booking 409, idempotency, kapasitas meja 422, no-show sebelum 15 menit ditolak, rate limit cek tiket 429, pengeluaran baru yang benar-benar mengubah status kas, dan parser impor CSV (baris valid, error, ganda, masa depan).

## Yang belum diverifikasi (jangan dianggap sudah aman)

- **Backend asli.** Bentuk respons mengikuti `docs/KONTRAK_API.md` di akar repo, yang masih perlu disepakati dengan tim backend (terutama endpoint bertanda [tambahan]).
- **Browser lain dan perangkat nyata.** Hanya Chromium (Playwright). Safari/iOS dan Firefox belum dicoba. Emulasi 390px bukan pengganti perangkat asli.
- **Impor XLSX.** Jalur CSV diuji (tes unit dan alur browser). Jalur `.xlsx` ada di backend tiruan tetapi belum diuji dengan berkas nyata. (Di produksi, pembacaan file dilakukan server.)
- **Unduh PDF dan cetak e-ticket.** Kode ditulis dan dimuat malas, tetapi isi PDF dan hasil cetak belum diperiksa secara visual.
- **Pembaca layar manual** (NVDA/VoiceOver) dan uji keyboard menyeluruh. Axe hanya menangkap sebagian masalah aksesibilitas.
- **Performa nyata** (Lighthouse, jaringan lambat) dan **kesesuaian piksel dengan Figma**. Kesesuaian dinilai secara visual, bukan diukur.
- **Real-time sejati.** Denah dan daftar memakai polling 15–20 detik, bukan SSE/WebSocket.
- **Zona waktu.** Logika jam memakai WIB (Asia/Jakarta). Pengguna di zona lain tetap melihat jam WIB.
- Data contoh bersifat statis: status reservasi hari ini (mis. "Selesai" pada slot yang belum dimulai) tidak menyesuaikan jam sebenarnya.

Catatan: entri `503` di console browser pada skenario asisten "Bandingkan dengan minggu lalu" disengaja (simulasi kuota AI penuh), bukan galat aplikasi.
