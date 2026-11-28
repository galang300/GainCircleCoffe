// Perhitungan arus kas tiruan: angka dasar tetap (fiktif) + penyesuaian dari data yang diinput selama sesi.
import { CATEGORIES } from '../lib/constants'
import {
  addDays,
  addMonths,
  formatDayMonth,
  monthKey,
  monthLabel,
  startOfWeek,
  todayWIB,
  dayNumber,
} from '../lib/format'
import { cashStatus } from '../lib/validators'

const M = { inflow: [78, 82, 85, 80, 88, 41.5], outflow: [52, 55, 61, 60, 70, 34.0] }
const W = { inflow: [19.2, 20.1, 18.6, 21.0, 19.8, 9.6], outflow: [12.6, 13.8, 12.9, 15.4, 15.9, 7.9] }
const SHARE = {
  'Bahan baku': 0.46,
  'Gaji & upah': 0.22,
  'Sewa & utilitas': 0.14,
  'Marketing & event': 0.08,
  'Peralatan & perawatan': 0.06,
  Lainnya: 0.04,
}
const CONF = { sehat: 0.91, waspada: 0.87, kritis: 0.89 }

export function compute(db, { period = 'month', category = '' } = {}) {
  const today = todayWIB()
  const base = period === 'month' ? M : W
  const inPeriod = (d) =>
    period === 'month' ? monthKey(d) === monthKey(today) : d >= startOfWeek(today) && d <= today
  const adj = db.adj.filter((a) => inPeriod(a.date))
  const addIn = adj.filter((a) => a.kind === 'in').reduce((s, a) => s + a.amount, 0)
  const addOut = adj.filter((a) => a.kind === 'out').reduce((s, a) => s + a.amount, 0)
  const last = base.inflow.length - 1
  const inflow = base.inflow.map((v, i) => v * 1e6 + (i === last ? addIn : 0))
  const outflow = base.outflow.map((v, i) => v * 1e6 + (i === last ? addOut : 0))
  const cats = CATEGORIES.map((c) => ({
    category: c,
    total:
      base.outflow[last] * 1e6 * SHARE[c] +
      adj.filter((a) => a.kind === 'out' && a.cat === c).reduce((s, a) => s + a.amount, 0),
  })).sort((a, b) => b.total - a.total)
  const totalOut = cats.reduce((s, c) => s + c.total, 0)
  const ratio = inflow[last] > 0 ? outflow[last] / inflow[last] : null
  const status = cashStatus(ratio)
  const labels =
    period === 'month'
      ? Array.from({ length: 6 }, (_, i) => monthLabel(addMonths(monthKey(today), i - 5)))
      : Array.from({ length: 6 }, (_, i) => formatDayMonth(addDays(startOfWeek(today), (i - 5) * 7)))
  const scale = category ? (cats.find((c) => c.category === category)?.total || 0) / (totalOut || 1) : 1
  const series = labels.map((label, i) => ({ label, inflow: inflow[i], outflow: outflow[i] * scale }))
  const top = cats[0]
  const sign = status === 'sehat' ? -1 : 1
  return {
    today,
    status,
    ratio,
    inflow: inflow[last],
    outflow: outflow[last] * scale,
    cats,
    totalOut,
    series,
    top,
    sign,
    labels,
  }
}

export function summary(db, p) {
  const c = compute(db, p)
  const [prevIn, prevOut] = [
    c.series[c.series.length - 2]?.inflow || 0,
    c.series[c.series.length - 2]?.outflow || 0,
  ]
  const d = dayNumber(c.today)
  const warn =
    c.status === 'sehat'
      ? null
      : {
          title:
            c.status === 'kritis'
              ? 'Rasio pengeluaran melewati 90% dari omzet.'
              : 'Pengeluaran bahan baku naik 18% dalam 3 hari terakhir.',
          detail:
            'Jika tren berlanjut, status bisa naik ke Kritis dalam ±4 hari. Tanyakan ke Asisten AI untuk detail.',
          ask: 'Kenapa pengeluaran bahan baku naik?',
        }
  return {
    status: c.status,
    ratio: c.ratio,
    confidence: CONF[c.status] ?? null,
    inflow: c.inflow,
    outflow: c.outflow,
    f1: 0.89,
    model_error: false,
    inflow_note:
      p.period === 'week'
        ? 'Minggu ini · data kasir'
        : `${monthLabel(monthKey(c.today))} 1–${d} · data kasir`,
    net_note: `Sebelumnya (penuh): ${(prevIn - prevOut >= 0 ? 'Rp ' : '-Rp ') + (Math.abs(prevIn - prevOut) / 1e6).toFixed(0).replace('.', ',')} jt`,
    top_category: { name: c.top.category, share: c.top.total / (c.totalOut || 1) },
    main_factor: 'Rasio & bahan baku',
    period_label:
      p.period === 'week'
        ? 'Minggu ini'
        : `${monthLabel(monthKey(c.today))} ${c.today.slice(0, 4)} (s.d. ${d})`,
    warning: warn,
    updated_at: new Date().toISOString(),
  }
}
export const series = (db, p) => compute(db, p).series
export const categories = (db, p) => compute(db, p).cats
export function shap(db, p) {
  const c = compute(db, p)
  const s = c.sign
  return [
    { label: 'Rasio pengeluaran / omzet', value: 0.41 * s },
    { label: 'Proporsi bahan baku', value: 0.29 * s },
    { label: 'Lonjakan marketing / event', value: 0.12 * s },
    { label: 'Pengeluaran peralatan', value: 0.05 * s },
    { label: 'Omzet terakhir', value: -0.15 },
  ]
}
export function history(db) {
  const c = compute(db, { period: 'month' })
  const t = c.today
  const at = (d) => `${d}T08:00:00+07:00`
  return [
    {
      id: 1,
      at: at(t),
      status: c.status,
      ratio: c.ratio ?? 0,
      confidence: CONF[c.status] ?? 0.8,
      factor: 'Rasio pengeluaran / omzet',
    },
    {
      id: 2,
      at: at(addDays(t, -7)),
      status: 'sehat',
      ratio: 0.66,
      confidence: 0.91,
      factor: 'Omzet naik, bahan baku stabil',
    },
    {
      id: 3,
      at: at(addDays(t, -14)),
      status: 'waspada',
      ratio: 0.74,
      confidence: 0.84,
      factor: 'Proporsi bahan baku naik',
    },
  ]
}
export function notifications(db) {
  const s = summary(db, { period: 'month' })
  if (!s.warning) return []
  return [
    {
      id: 'n1',
      unread: true,
      title: s.warning.title,
      detail: 'Early warning',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'n2',
      unread: true,
      title: `Status kas: ${s.status === 'kritis' ? 'Kritis' : 'Waspada'}`,
      detail: `Rasio ${Math.round((s.ratio || 0) * 100)}%`,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]
}

/** Asisten berbasis aturan sederhana (pengganti LLM + RAG). Hanya untuk demo UI. */
export function answer(db, text) {
  const t = text.toLowerCase()
  const s = summary(db, { period: 'month' })
  const c = compute(db, { period: 'month' })
  const pct = Math.round((s.ratio || 0) * 100)
  const lbl = { sehat: 'Sehat', waspada: 'Waspada', kritis: 'Kritis' }[s.status]
  const src = [`Data kas ${s.period_label}`]
  const out = (intent, score, body, sources = src) => ({ intent, intent_score: score, text: body, sources })
  if (/kuota|limit/.test(t)) return { error: 'AI_UNAVAILABLE' }
  if (/bandingkan|minggu lalu/.test(t)) {
    if (!db.aiFailedOnce) {
      db.aiFailedOnce = true
      return { error: 'AI_UNAVAILABLE' }
    }
    const w = compute(db, { period: 'week' })
    const p = w.series[w.series.length - 2]
    return out(
      'bandingkan_periode',
      0.88,
      `Minggu ini pengeluaran Rp ${(w.outflow / 1e6).toFixed(1).replace('.', ',')} jt dibanding Rp ${(p.outflow / 1e6).toFixed(1).replace('.', ',')} jt minggu lalu. Omzet minggu ini Rp ${(w.inflow / 1e6).toFixed(1).replace('.', ',')} jt (masih berjalan).`,
      ['Data kas mingguan', 'Glosarium: rasio pengeluaran'],
    )
  }
  if (/kenapa|mengapa|status/.test(t))
    return out(
      'tanya_status_kas',
      0.94,
      `Status kas bulan ini ${lbl}. Rasio pengeluaran terhadap omzet ${pct}% (batas Sehat 70%, Kritis di atas 90%). Faktor terbesar: proporsi ${c.top.category.toLowerCase()} (${Math.round((c.top.total / c.totalOut) * 100)}% dari pengeluaran) dan rasio pengeluaran itu sendiri.`,
      [...src, 'Glosarium: status kas'],
    )
  if (/paling besar|terbesar|kategori/.test(t))
    return out(
      'tanya_kategori',
      0.91,
      `Pengeluaran terbesar bulan ini adalah ${c.top.category} sebesar Rp ${(c.top.total / 1e6).toFixed(1).replace('.', ',')} jt (${Math.round((c.top.total / c.totalOut) * 100)}% dari total).`,
    )
  if (/hemat|turun|kurang/.test(t))
    return out(
      'minta_saran',
      0.87,
      `Dua area yang paling mungkin dihemat: (1) ${c.top.category.toLowerCase()}: bandingkan harga pemasok dan atur stok mingguan; (2) marketing & event: pilih event yang terbukti menaikkan omzet. Targetkan rasio turun ke ≤ 70% agar kembali Sehat.`,
      [...src, 'Glosarium: efisiensi biaya'],
    )
  if (/kritis|kapan/.test(t))
    return out(
      'prediksi_status',
      0.82,
      s.status === 'kritis'
        ? 'Status sudah Kritis. Fokus menurunkan pengeluaran bahan baku dan tunda belanja peralatan.'
        : `Dengan tren saat ini, status bisa naik ke Kritis dalam ±4 hari bila pengeluaran bahan baku terus naik. Saat ini ${lbl} (${pct}%).`,
    )
  if (/halo|hai|terima kasih|makasih/.test(t))
    return out(
      'sapaan',
      0.99,
      'Halo! Saya bisa membantu membaca kondisi kas Gain Circle. Coba tanya: "Kenapa status kas bulan ini waspada?"',
      [],
    )
  return out(
    'di_luar_konteks',
    0.35,
    'Maaf, saya hanya bisa menjawab soal kondisi kas dan keuangan Gain Circle. Coba tanyakan tentang status kas, pengeluaran, atau saran penghematan.',
    [],
  )
}
