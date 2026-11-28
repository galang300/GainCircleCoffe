# Kontrak API yang diharapkan frontend

Basis: `VITE_API_BASE_URL` (mis. `/api/v1`). Auth: `Authorization: Bearer <token>`. Semua JSON kecuali impor (multipart).

**Respons seragam**

```json
{ "success": true, "data": {} }
{ "success": false, "error": { "code": "TABLE_ALREADY_BOOKED", "message": "…", "fields": { "guests": "…" }, "retry_after": 30, "meta": {} } }
```

Frontend memetakan `error.code` ke pesan Bahasa Indonesia (`src/lib/errors.js`) dan tidak pernah menampilkan error mentah server.
Referensi implementasi lengkap ada di `frontend/src/mocks/server.js` (diuji oleh `frontend/src/mocks/__tests__/`).

Tanda: **[spec]** = ada di spesifikasi awal, **[tambahan]** = endpoint/field yang dibutuhkan desain dan **perlu disepakati dengan tim backend**.

## Auth

| Endpoint | Body → respons |
|---|---|
| `POST /auth/register` [spec] | `{name,email,phone,password}` → 201 `{email_masked, resend_in}`. 409 `EMAIL_ALREADY_REGISTERED`, 422 `fields` |
| `POST /auth/login` [spec] | `{email,password}` → `{email_masked, resend_in}`. 401 `INVALID_CREDENTIALS` |
| `POST /staff/auth/login` [spec] | sama; hanya akun staf/owner |
| `POST /auth/otp/verify` · `/staff/auth/otp/verify` [spec] | `{email,code}` → `{token, user:{id,name,email,phone,role}}`. 422 `OTP_INVALID` (`meta.attempts_left`), 410 `OTP_EXPIRED`, 429 `OTP_TOO_MANY` |
| `POST /auth/otp/resend` [spec] | `{email}` → `{resend_in}` |
| `POST /auth/logout`, `GET /auth/me` [spec] | |

Aturan OTP yang diasumsikan UI: 6 digit, berlaku 5 menit, 3 percobaan, kirim ulang setelah `resend_in` detik. `role` ∈ `customer | staff | owner`.
Field `demo_hint` hanya dikirim oleh mock; backend asli tidak boleh mengirimnya.

## Reservasi pelanggan

| Endpoint | Catatan |
|---|---|
| `GET /tables` [spec] | `[{id, shape:'c'|'r', x, y, w, h, seats, area}]`. Koordinat pada kanvas 640×430 |
| `GET /availability?date=&slot=` [spec] | `{tables:[{id,status:'free'|'booked'}], full}` |
| `GET /availability?date=` [tambahan] | `{slots:[{slot,total,free}]}` untuk menandai slot penuh di pemilih jam |
| `POST /reservations` [spec] | Header `Idempotency-Key`. Body `{date,slot,table_id,guests,purpose,note?}` → 201 reservasi. 409 `TABLE_ALREADY_BOOKED`, 422 `fields` / `SLOT_PAST` |
| `GET /reservations/mine?status=upcoming|history&page=` [spec] | `{items,page,page_size,total,total_pages}` |
| `GET /reservations/lookup?code=&phone4=` [spec] | Tanpa login. 404 `TICKET_NOT_FOUND`, 429 `RATE_LIMITED` + `retry_after` |
| `GET /reservations/:code` [spec] | Hanya milik pemanggil |

Objek reservasi: `{code,name,table,slot,date,guests,status}` dengan `slot` seperti `19-21` dan `status` ∈ `dikonfirmasi | check_in | selesai | no_show | dibatalkan`.
Server wajib memvalidasi ulang slot lewat, kapasitas meja (tamu ≤ kursi), dan rentang tanggal (hari ini sampai +30 hari).

## Staf & owner

| Endpoint | Catatan |
|---|---|
| `GET /staff/reservations?date=&status=&q=&page=&page_size=` [spec] | Mengembalikan `{...pagination, kpi:{total,guests,occupied,tables,full_slots,full_slot_labels,delta}}` (`kpi` [tambahan]) |
| `GET /staff/reservations/:code` [spec] | Menambah `purpose,note,phone,email,history:[{at,text}]` |
| `PATCH /staff/reservations/:code` [spec] | `{action:'check_in'|'no_show'|'cancel', reason?}`. 422 `NOT_ALLOWED` (mis. no-show sebelum 15 menit) |
| `GET /staff/tables/status` [spec] | `[{id,status:'kosong'|'dipesan'|'terisi'|'perlu_disiapkan', next}]` |
| `PATCH /staff/tables/:id/status` [spec] | `{status}` |
| `GET /staff/tables/log` [tambahan] | `[{id,at,table,status,by}]` untuk "Log terakhir" |

## Keuangan

| Endpoint | Catatan |
|---|---|
| `GET /expenses?category=&page=&page_size=` [spec] | Paginasi |
| `GET /expenses/summary` [tambahan] | `{today:{revenue,outflow,ratio,status}, month:[{category,total}]}` |
| `POST /expenses`, `PATCH /expenses/:id` [spec] | `{date,category,amount,note?}`. Kategori: Bahan baku, Gaji & upah, Sewa & utilitas, Marketing & event, Peralatan & perawatan, Lainnya |
| `GET /sales/daily?limit=` [spec] | `[{date,revenue,outflow,ratio,status,source:'Manual'|'Impor'}]` |
| `POST /sales/daily` [spec] | `{date,revenue}`. Satu tanggal satu nilai (menimpa) |
| `POST /sales/import/preview` · `/commit` [spec] | multipart `file` (.csv/.xlsx, maks 2 MB). Preview: `{valid, overwrite, errors:[{row,date,value,reason}], rows:[{row,date,value,overwrite}]}`. Commit: `{imported, overwritten, skipped}` |

## Arus kas & asisten (owner)

| Endpoint | Catatan |
|---|---|
| `GET /cashflow/summary?period=month|week&category=` [spec] | `{status,ratio,confidence,inflow,outflow,top_category:{name,share},warning:{title,detail,ask}|null,main_factor,period_label,f1,model_error,updated_at,…}` |
| `GET /cashflow/series`, `/categories`, `/shap`, `/history` [spec] | Seri `[{label,inflow,outflow}]`, `[{category,total}]`, `[{label,value}]`, `[{id,at,status,ratio,confidence,factor}]` |
| `GET /notifications` [spec] | `[{id,unread,title,detail,created_at}]` |
| `POST /assistant/messages` [spec] | `{text}` → `{text,intent,intent_score,sources,created_at}`. 503 `AI_UNAVAILABLE` boleh membawa `meta.fallback` (ringkasan tanpa AI) |
| `GET /assistant/history` [spec] | `[{role,text,at,…}]` |

`status` ∈ `sehat | waspada | kritis | belum`. Frontend menerima status dari server, tetapi memakai ambang 70%/90% (`src/lib/constants.js`) untuk keterangan di layar. Jika ambang berubah, ubah di kedua sisi.
