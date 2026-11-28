# Catatan desain, keputusan, dan asumsi

Dokumen ini menjawab tiga hal: apa yang **dipertahankan** dari desain tim, apa yang **diubah atau ditambahkan** (dengan alasan), dan apa yang masih **menunggu keputusan** owner/tim.

## 1. Dipertahankan (fondasi proyek, tidak diubah)

- Identitas visual: krem `#F2EDDE`, oranye `#CA5C34`, ink `#171210`, neon `#75F237`, kuning, pink, biru; Anton (display), Tinos (serif), Archivo (isi); sudut 0, border 2px, bayangan keras 8px. Token ada di `tailwind.config.js`.
- Struktur halaman dan alur: 3 langkah reservasi, dua pintu masuk (pelanggan dan staf/owner), sandi → OTP, peran pelanggan/staf/owner.
- Seluruh 31 layar, istilah UI, dan copy dari desain.
- Aturan domain: 9 slot 2 jam (07.00–00.00), tamu 1–8, meja ditahan 15 menit, status kas dari rasio pengeluaran ÷ omzet.

## 2. Diubah atau ditambahkan

| # | Perubahan | Alasan |
|---|---|---|
| 1 | Dua tombol "Verifikasi (demo staf/owner)" menjadi **satu tombol Verifikasi**; peran ditentukan akun | Desain sendiri menulis itu hanya demo prototipe. Memilih peran di klien adalah celah keamanan |
| 2 | Placeholder "[GANTI: EMBED GOOGLE MAPS]" menjadi kartu peta bergaya yang **menautkan ke Google Maps** | Tanpa iframe pihak ketiga (privasi, CSP, performa). Alamat sudah benar |
| 3 | Tiket contoh di hero memakai **tanggal hari ini**, bukan "20 Nov 2026" | Tanggal tetap akan tampak basi. Diberi label "contoh tiket" |
| 4 | "Ingat saya" menjadi "Ingat email di perangkat ini" | Hanya email yang diingat. Menyimpan sesi lebih lama berisiko dan belum ada refresh cookie |
| 5 | Grafik dibuat sebagai **SVG buatan sendiri**, bukan pustaka grafik | Cocok persis dengan desain (label nilai, bar bulan berjalan bergaris tebal), bundel lebih kecil, dan punya tabel alternatif untuk pembaca layar. Bisa diganti Recharts tanpa mengubah halaman |
| 6 | Pemilih jam otomatis **melewati slot penuh/lewat** saat halaman dibuka atau tanggal diganti | Tanpa ini, pengguna sering mendarat di denah yang semuanya "Dipesan" |
| 7 | Bar ringkasan reservasi dibuat **sticky** | Tetap terlihat saat menggulir denah di ponsel |
| 8 | Tabel dashboard menjadi **kartu di ponsel**; tab bawah + lembar "Lainnya" untuk owner | Mengikuti layar ponsel di desain, dengan akses ke semua menu |
| 9 | Kolom pencarian di bar atas dashboard **berfungsi** (mengisi pencarian daftar reservasi) | Elemen tanpa aksi tidak boleh ada |
| 10 | Ringkasan jumlah per status di halaman Status Meja | Staf butuh gambaran cepat; murah dihitung dari data yang sama |
| 11 | Halaman staf **menyembunyikan** rasio/status kas dan ringkasan bulanan | Asumsi matriks peran: analitik kas hanya untuk owner (lihat bagian 3) |
| 12 | Tautan "Lihat dokumentasi pelabelan →" di kartu Aturan Label **tidak dibuat** | Belum ada halaman tujuan. Tautan mati lebih buruk daripada tidak ada |
| 13 | Pertanyaan FAQ kelima: "Bagaimana kalau jadwalku berubah?" | Belum ada fitur batal oleh pelanggan, jadi pengguna diarahkan ke Instagram |
| 14 | Angka di layar (mis. "18 reservasi") **dihitung dari data**, bukan ditulis tetap | Desain memakai angka contoh. Di aplikasi nyata angkanya harus hidup |
| 15 | Aksesibilitas: skip link, fokus terlihat, pesan galat dibacakan, fokus terjebak di modal, tabel alternatif grafik, `prefers-reduced-motion` | Standar kualitas, bukan perubahan visual |
| 16 | Kontras: teks status abu pada beige diganti ink; tautan oranye kecil memakai `rust` | Hasil audit axe menemukan kontras di bawah 4,5:1 |

Logo "G GAIN." dirender dari path vektor hasil penelusuran di Figma tim. **Ganti dengan berkas logo resmi** (`src/components/brand/Logo.jsx`) bila tersedia. Stiker dibuat ulang sebagai SVG sederhana dan bisa diganti aset ilustrator.

## 3. Asumsi dan keputusan yang menunggu owner/tim

Nilai-nilai ini sengaja dipusatkan di `src/lib/constants.js` (UI) dan `src/lib/slots.js` (aturan jam) agar mudah diubah.

| Hal | Yang dipakai sekarang | Status |
|---|---|---|
| Ambang status kas | Sehat ≤ 70%, Waspada 70–90%, Kritis > 90% | Di backlog tim masih "ilustrasi, menunggu validasi owner" |
| Durasi sesi dan jam buka | 2 jam; 07.00–00.00 | Idem |
| Slot yang sudah dimulai | **Tidak bisa dipesan** | Asumsi saya, mengikuti state "slot lewat" di desain |
| Pembatalan oleh pelanggan | Tidak ada di FE; staf bisa membatalkan | Kebijakan batal/no-show belum diputuskan |
| No-show | Aktif 15 menit setelah jam mulai; meja dilepas | Sesuai spesifikasi, kebijakan sanksi belum ada |
| Pelanggan walk-in | Tidak tercatat otomatis; denah memberi catatan | Pertanyaan terbuka ke owner |
| Matriks peran | Staf: reservasi, meja, catat pengeluaran/pemasukan, impor. Owner: semuanya + arus kas + asisten | Asumsi dari desain. **Konfirmasi ke owner** |
| Pemasukan/omzet harian | Dicatat manual atau impor; satu tanggal satu nilai | Sesuai desain |
| Batas tanggal reservasi | Hari ini sampai +30 hari | Sesuai spesifikasi |

## 4. Yang sengaja tidak dikerjakan

- Pembayaran online, pemesanan menu, program loyalitas (di luar lingkup proyek).
- Reset kata sandi (desain mengarahkan ke owner).
- Notifikasi WhatsApp/email dari FE (tugas backend).
- Mode gelap (tidak ada di desain).
