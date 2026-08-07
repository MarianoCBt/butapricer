// =====================================================================
//  TCGPlayer — precios POR IMPRESIÓN/RAREZA y ÚLTIMAS VENTAS.
//
//  Complementa a YGOPRODeck, que sólo da un "menor precio" por carta:
//   - `buscarImpresiones(nombre)` trae cada impresión con su rareza y sus
//     precios reales: Market (promedio ponderado de ventas recientes),
//     Median y Lowest.
//   - `traerVentas(productId)` trae las ventas cerradas más recientes.
//
//  ---------------------------------------------------------------------
//  POR QUÉ HAY UN PROXY EN EL MEDIO
//  Estas APIs responden `access-control-allow-origin: https://www.tcgplayer.com`
//  y exigen ese mismo `Origin` en el pedido (si no, 403). El navegador no
//  puede falsificar `Origin`, así que el pedido tiene que salir de un
//  servidor. En dev lo hace el proxy de Vite (ver vite.config.js); publicado,
//  el Worker de `worker/tcgplayer-proxy.js`.
//
//  Si no hay proxy disponible, TODO acá devuelve null / lista vacía y la app
//  sigue andando con los datos de YGOPRODeck. Nunca tira error a la UI.
// =====================================================================

import { config } from '../config'

// Sin `proxyBase` usamos rutas del mismo origen: en dev las atiende Vite.
const base = () => (config.tcgplayer.proxyBase || '').replace(/\/$/, '')

const cache = new Map()

async function pedir(url, cuerpo) {
  const clave = url + JSON.stringify(cuerpo || null)
  if (cache.has(clave)) return cache.get(clave)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo || {}),
    })
    if (!res.ok) return null // 4xx/5xx: puede ser pasajero, no lo cacheamos
    const datos = await res.json().catch(() => null)
    // Sólo se cachea una respuesta buena. Cachear los fallos hacía que un
    // error pasajero dejara la carta sin ventas por el resto de la sesión.
    if (datos) cache.set(clave, datos)
    return datos
  } catch {
    return null // sin proxy, offline o TCGPlayer cortó: se degrada y listo
  }
}

// ---------------------------------------------------------------------
//  Normalización para emparejar con YGOPRODeck
// ---------------------------------------------------------------------

/** "RA03-EN080" / "ra03 en080" -> "RA03EN080" */
export function normCodigo(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/**
 * Las rarezas no se escriben igual en los dos lados: TCGPlayer usa
 * "Common / Short Print", "Quarter Century Secret Rare"… Comparamos por
 * palabras clave en vez de exigir el string exacto.
 */
export function normRareza(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/\bRARE\b/g, '')
    .replace(/[^A-Z0-9]/g, '')
}

function mismaRareza(a, b) {
  const x = normRareza(a)
  const y = normRareza(b)
  if (!x || !y) return false
  return x === y || x.includes(y) || y.includes(x)
}

function num(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function mapearProducto(p) {
  return {
    productId: p.productId,
    nombre: p.productName || '',
    codigo: p.customAttributes?.number || '',
    rareza: p.rarityName || '',
    setNombre: p.setName || '',
    market: num(p.marketPrice),
    median: num(p.medianPrice),
    lowest: num(p.lowestPrice),
    // `lowestPriceWithShipping` es el TOTAL más barato entre todas las
    // publicaciones ya con el envío sumado. Ojo: puede venir de un vendedor
    // distinto que el de `lowest` (vimos $0,01 sin envío contra $0,15 con
    // envío), así que la resta es la DIFERENCIA hasta el más barato puesto
    // en tu casa, no la tarifa que cobra ese vendedor.
    lowestConEnvio: num(p.lowestPriceWithShipping),
    listados: p.totalListings || 0,
    url: p.productUrlName
      ? `https://www.tcgplayer.com/product/${p.productId}/${p.productUrlName}`
      : `https://www.tcgplayer.com/product/${p.productId}`,
  }
}

// ---------------------------------------------------------------------
//  Búsqueda de impresiones
// ---------------------------------------------------------------------

// El body que espera la API de búsqueda. `size` tiene tope: 50 anda, 60 da 400.
function cuerpoBusqueda(nombre, size = 50) {
  return {
    algorithm: 'sales_synonym_v2',
    from: 0,
    size,
    filters: {
      term: { productLineName: ['yugioh'], ...(nombre ? { productName: [nombre] } : {}) },
      range: {},
      match: {},
    },
    context: { cart: {}, shippingCountry: 'US' },
    sort: { field: 'product-sorting-name', order: 'asc' },
  }
}

/**
 * Todas las impresiones de una carta en TCGPlayer, con sus precios reales.
 * Devuelve `[]` si no hay proxy (la app sigue con YGOPRODeck).
 */
export async function buscarImpresiones(nombre) {
  if (!nombre) return []
  const data = await pedir(
    `${base()}/tcg/search?q=${encodeURIComponent(nombre)}`,
    cuerpoBusqueda(nombre),
  )
  return (data?.results?.[0]?.results || []).map(mapearProducto)
}

/**
 * Búsqueda dirigida por CÓDIGO de impresión. Se usa cuando el nombre no
 * alcanzó: TCGPlayer nombra distinto algunos sets nuevos (RA03/RA04) y esas
 * impresiones no aparecen filtrando por `productName`.
 */
export async function buscarPorCodigoTcg(codigo, nombre) {
  if (!codigo) return []
  const data = await pedir(
    `${base()}/tcg/search?q=${encodeURIComponent(codigo)}`,
    cuerpoBusqueda(null, 24),
  )
  const todos = (data?.results?.[0]?.results || []).map(mapearProducto)
  const objetivo = normCodigo(codigo)
  return todos.filter(
    (p) =>
      normCodigo(p.codigo) === objetivo &&
      (!nombre || p.nombre.toLowerCase() === nombre.toLowerCase()),
  )
}

/**
 * Empareja UNA impresión de YGOPRODeck (`{ codigo, rareza }`) con su producto
 * en TCGPlayer. Primero busca dentro de la lista ya traída por nombre; si el
 * código no está, hace una búsqueda dirigida.
 *
 * Cuando un mismo código existe en varias rarezas, se queda con la que
 * coincide en rareza — nunca con "la primera", que suele ser la más cara.
 */
export async function emparejarImpresion(impresion, impresionesTcg, nombreCarta) {
  if (!impresion?.codigo) return null
  const objetivo = normCodigo(impresion.codigo)

  const candidatos = (impresionesTcg || []).filter(
    (p) => normCodigo(p.codigo) === objetivo,
  )
  const elegir = (lista) =>
    lista.find((p) => mismaRareza(p.rareza, impresion.rareza)) ||
    (lista.length === 1 ? lista[0] : null)

  const local = elegir(candidatos)
  if (local) return local

  const remotos = await buscarPorCodigoTcg(impresion.codigo, nombreCarta)
  return elegir(remotos)
}

// ---------------------------------------------------------------------
//  Últimas ventas
// ---------------------------------------------------------------------

function mapearVenta(v) {
  return {
    fecha: v.orderDate || '',
    precio: num(v.purchasePrice),
    envio: num(v.shippingPrice),
    cantidad: Number(v.quantity) || 1,
    condicion: v.condition || '',
    variante: v.variant || '',
    idioma: v.language || '',
  }
}

/**
 * Ventas cerradas más recientes de un producto, de la más nueva a la más
 * vieja. `[]` si no hay proxy o el producto no tiene ventas.
 */
export async function traerVentas(productId, limite = config.tcgplayer.ventasVisibles) {
  if (!productId) return []
  const data = await pedir(`${base()}/tcg/sales/${productId}`, {
    conditions: [],
    languages: [],
    variants: [],
    listingType: 'All',
    offset: 0,
    limit: limite,
  })
  return (data?.data || []).map(mapearVenta).filter((v) => v.precio > 0)
}

/** Promedio ponderado por cantidad de una lista de ventas. */
export function promedioVentas(ventas = []) {
  const unidades = ventas.reduce((a, v) => a + v.cantidad, 0)
  if (!unidades) return 0
  return ventas.reduce((a, v) => a + v.precio * v.cantidad, 0) / unidades
}
