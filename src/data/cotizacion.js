// =====================================================================
//  Cotización del día (dolarapi.com — público, con CORS abierto).
//
//  `/v1/dolares` da todas las casas de dólar; nos quedamos con las de
//  `config.casasVisibles`. Todos los precios de la app vienen en dólares,
//  así que no hace falta ninguna otra moneda.
// =====================================================================

import { config } from '../config'

const DOLARES_API = 'https://dolarapi.com/v1/dolares'

const CACHE_KEY = 'buta.pricer.cotizacion'

// Valor de respaldo si la API no responde y no hay caché. Es solo para
// que la app no quede inservible: la UI avisa que está desactualizado.
const RESPALDO = {
  casas: [{ id: 'blue', nombre: 'Blue', compra: 0, venta: 0 }],
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
 * `{ casas: [{ id, nombre, compra, venta, fecha }], fecha, offline }`.
 */
export async function traerCotizacion() {
  const dolares = await fetchJson(DOLARES_API)

  if (!Array.isArray(dolares) || !dolares.length) {
    return leerCache() || RESPALDO
  }

  // Sólo las casas que configuramos, en el orden de `config.casasVisibles`.
  const porId = new Map(dolares.map((d) => [d.casa, d]))
  const casas = config.casasVisibles
    .map((id) => porId.get(id))
    .filter(Boolean)
    .map((d) => ({
      id: d.casa,
      nombre: d.nombre,
      compra: Number(d.compra) || 0,
      venta: Number(d.venta) || 0,
      fecha: d.fechaActualizacion || null,
    }))

  const datos = {
    casas,
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

// Id reservado para el dólar cargado a mano ("mi AVG"): no viene de la API,
// lo pone el usuario. Ver BarraCotizacion.
export const CASA_MANUAL = 'manual'

/**
 * Las casas tal como se ofrecen en un desplegable, con "Mi AVG" **segundo**,
 * justo debajo del oficial: es la opción que más se usa. Se ubica buscando
 * el oficial por id (no por posición) para no depender del orden de la API.
 *
 * Vive acá y no en un componente porque la usan el selector de la barra y
 * el del popup de precio, y tienen que coincidir.
 */
export function opcionesDeCasas(casas = []) {
  const manual = { id: CASA_MANUAL, nombre: 'Mi AVG (a mano)' }
  const i = casas.findIndex((c) => c.id === 'oficial')
  const pos = i >= 0 ? i + 1 : Math.min(1, casas.length)
  return [...casas.slice(0, pos), manual, ...casas.slice(pos)]
}

/** Busca una casa por id, con la primera como respaldo. */
export function casaPorId(cotizacion, id) {
  if (!cotizacion?.casas?.length || id === CASA_MANUAL) return null
  return cotizacion.casas.find((c) => c.id === id) || cotizacion.casas[0]
}
