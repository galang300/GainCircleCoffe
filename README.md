# Gain Circle Coffee

Sistem reservasi meja online dan dashboard kesehatan arus kas untuk **Gain Circle Coffee** (Jl. Pacar No. 2, Surabaya).
Proyek Capstone A26-CS264.

Pelanggan memilih tanggal, jam, dan meja di denah lalu mendapat e-ticket. Staf mengelola reservasi dan status meja.
Owner memantau kesehatan arus kas (Sehat / Waspada / Kritis) dan bertanya ke asisten AI.

## Isi repo

| Folder | Isi | Status |
|---|---|---|
| [`frontend/`](frontend/) | Aplikasi web React: sisi pelanggan, staf, dan owner (31 layar) | Siap diintegrasikan. Berjalan penuh dengan data contoh |
| [`backend/`](backend/) | API, basis data, autentikasi | Menunggu pengerjaan |
| [`GEN-AI/`](GEN-AI/) | Pemodelan status kas dan asisten AI: notebook, data sintetis, model demo v0.1 | Model demo sudah ada |
| [`docs/`](docs/) | Kontrak API antar-tim dan catatan keputusan | Aktif |

## Mulai cepat (frontend)

```bash
nvm use                      # Node 22, lihat .nvmrc
cd frontend
npm install
cp .env.example .env.local   # untuk demo tanpa backend: set VITE_USE_MOCKS=true
npm run dev                  # http://localhost:5173
```

Akun demo dan penjelasan lengkap ada di [`frontend/README.md`](frontend/README.md).

## Dokumen penting

- [`docs/KONTRAK_API.md`](docs/KONTRAK_API.md): endpoint yang diharapkan frontend. **Backend dan GEN-AI mulai dari sini.**
- [`docs/KEPUTUSAN.md`](docs/KEPUTUSAN.md): keputusan tim dan pertanyaan yang masih terbuka.
- [`frontend/docs/CATATAN_DESAIN.md`](frontend/docs/CATATAN_DESAIN.md): perbedaan dari desain Figma dan alasannya.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): alur kerja cabang, commit, dan Pull Request.

## Aturan penting

Repo ini **publik**. Jangan pernah commit:

- berkas `.env`, kata sandi, token, atau kunci API (gunakan `.env.example` tanpa nilai rahasia),
- data pribadi (nomor HP, email, nama asli pelanggan atau narasumber),
- dokumen internal seperti hasil wawancara. Simpan itu di penyimpanan tim.
