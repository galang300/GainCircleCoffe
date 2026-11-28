# Backend

Folder untuk API, basis data, dan autentikasi.

Frontend sudah selesai dan menunggu backend sesuai kontrak di [`../docs/KONTRAK_API.md`](../docs/KONTRAK_API.md).
Referensi perilaku yang sudah diuji ada di `../frontend/src/mocks/server.js` (backend tiruan). Pakai itu untuk memahami
aturan bisnisnya, bukan sebagai kode yang disalin.

Hal-hal yang wajib ditangani di server (frontend hanya membantu pengalaman pengguna):

- Otorisasi peran `customer`, `staff`, `owner` di setiap endpoint.
- Validasi ulang slot lewat, kapasitas meja, rentang tanggal, dan double-booking (respons 409).
- OTP 6 digit: berlaku 5 menit, 3 percobaan, kirim ulang dengan jeda.
- Rate limit pada cek tiket tanpa login (respons 429 dengan `retry_after`).
- Dukungan header `Idempotency-Key` pada pembuatan reservasi.

Isi folder ini mengikuti keputusan tim backend. Tambahkan README sendiri berisi cara menjalankan.
