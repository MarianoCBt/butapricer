import { config } from '../config'

const arsFmt = new Intl.NumberFormat(config.locale, {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const usdFmt = new Intl.NumberFormat(config.locale, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// narrowSymbol para que salga "€ 0,02" y no "EUR 0,02".
// El dólar se deja con el símbolo largo ("US$") a propósito: en es-AR el
// símbolo corto es "$", que se confundiría con los pesos.
const eurFmt = new Intl.NumberFormat(config.locale, {
  style: 'currency',
  currency: 'EUR',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formatea ARS sin decimales: 12345 -> "$ 12.345". */
export function ars(n) {
  return Number.isFinite(n) ? arsFmt.format(n) : '—'
}

/** Formatea una cifra en la moneda indicada ('USD' | 'EUR'). */
export function moneda(n, cual = 'USD') {
  if (!Number.isFinite(n)) return '—'
  return cual === 'EUR' ? eurFmt.format(n) : usdFmt.format(n)
}

/** Número suelto con coma decimal: 1.1393 -> "1,139". */
export function numero(n, decimales = 2) {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n)
}

/** Fecha corta y legible, en 24 h: "6/8, 13:01". */
export function fechaCorta(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(config.locale, {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}
