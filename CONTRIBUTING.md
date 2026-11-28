# Panduan kontribusi

## Alur kerja

1. Ambil versi terbaru: `git switch main && git pull`.
2. Buat cabang dari `main` dengan nama yang menjelaskan isinya:
   `feat/nama-fitur`, `fix/nama-bug`, `docs/topik`, `chore/topik`.
3. Kerjakan dalam commit kecil dan jelas.
4. Dorong cabang (`git push -u origin nama-cabang`) lalu buka **Pull Request** ke `main`.
5. Minta minimal satu anggota lain meninjau. Gabungkan setelah semua pengecekan lolos.

Jangan push langsung ke `main` setelah aturan perlindungan cabang aktif.

## Pesan commit

Format: `jenis(lingkup): ringkasan singkat dalam huruf kecil`

| Jenis | Dipakai untuk |
|---|---|
| `feat` | fitur baru |
| `fix` | perbaikan bug |
| `docs` | dokumentasi |
| `test` | tes |
| `refactor` | merapikan kode tanpa mengubah perilaku |
| `chore` | konfigurasi, dependensi, struktur |
| `ci` | pipeline GitHub Actions |

Lingkup: `frontend`, `backend`, `gen-ai`, atau kosong bila menyentuh banyak bagian.
Contoh: `fix(frontend): perbaiki hitung mundur kirim ulang OTP`.

## Sebelum membuka Pull Request (frontend)

```bash
cd frontend
npm run lint
npm test
npm run build
```

CI menjalankan hal yang sama (ditambah tes E2E) pada setiap Pull Request.

## Yang tidak boleh masuk repo

Rahasia (`.env`, token, kata sandi), data pribadi, dan dokumen internal. Lihat bagian Aturan penting di [`README.md`](README.md).
