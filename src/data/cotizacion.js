// =====================================================================
//  Cotización del día (dolarapi.com — público, con CORS abierto).
//
//  - `/v1/dolares` da todas las casas de dólar (oficial, blue, tarjeta…).
//  - `/v1/cotizaciones` da además el EURO oficial, con el que calculamos
//    el cruce EUR/USD para poder pasar los precios de CardMarket (que
//    están en euros) a la misma moneda que el resto.
//
//  El cruce se calcula como EUR_oficial / USD_oficial en vez de usar un
//  "euro blue": lo que nos interesa es cuántos dólares vale un euro en el
//  mercado internacional, y después multiplicar por la casa de dólar que
//  el usuario realmente paga.
// =====================================================================

const DOLARES_API = 'https://dolarapi.com/v1/dolares'
const COTIZACIONES_API = 'https://dolarapi.com/v1/cotizaciones'

const CACHE_KEY = 'buta.pricer.cotizacion'

// Valor de respaldo si la API no responde y no hay caché. Es solo para
// que la app no quede inservible: la UI avisa que está desactualizado.
const RESPALDO = {
  casas: [{ id: 'blue', nombre: 'Blue', compra: 0, venta: 0 }],
  eurUsd: 1.08,
  fecha: null,
  offline: true,
}

async function fetchJson(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Descarga la cotización. Devuelve
 * `{ casas: [{ id, nombre, compra, venta, fecha }], eurUsd, fecha, offline }`.
 */
export async function traerCotizacion() {
  const [dolares, cotizaciones] = await Promise.all([
    fetchJson(DOLARES_API),
    fetchJson(COTIZACIONES_API),
  ])

  if (!Array.isArray(dolares) || !dolares.length) {
    return leerCache() || RESPALDO
  }

  const casas = dolares.map((d) => ({
    id: d.casa,
    nombre: d.nombre,
    compra: Number(d.compra) || 0,
    venta: Number(d.venta) || 0,
    fecha: d.fechaActualizacion || null,
  }))

  // Cruce EUR/USD a partir de las cotizaciones oficiales en ARS.
  const eur = cotizaciones?.find((c) => c.moneda === 'EUR' && c.casa === 'oficial')
  const usd = cotizaciones?.find((c) => c.moneda === 'USD' && c.casa === 'oficial')
  const eurUsd =
    eur?.venta && usd?.venta ? Number(eur.venta) / Number(usd.venta) : RESPALDO.eurUsd

  const datos = {
    casas,
    eurUsd,
    fecha: casas[0]?.fecha || new Date().toISOString(),
    offline: false,
  }
  guardarCache(datos)
  return datos
}

// ---------------------------------------------------------------------
//  Caché en localStorage: si la API se cae, seguimos mostrando el último
//  valor conocido (marcado como desactualizado).
// ---------------------------------------------------------------------

function guardarCache(datos) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ datos, guardadoEn: Date.now() }),
    )
  } catch {
    /* sin espacio o modo privado: seguimos sin caché */
  }
}

export function leerCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { datos } = JSON.parse(raw)
    return datos ? { ...datos, offline: true } : null
  } catch {
    return null
  }
}

/** Busca una casa por id, con la primera como respaldo. */
export function casaPorId(cotizacion, id) {
  if (!cotizacion?.casas?.length) return null
  return cotizacion.casas.find((c) => c.id === id) || cotizacion.casas[0]
}
