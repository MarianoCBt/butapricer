// =====================================================================
//  YGOPRODeck — identificación de cartas y precios de referencia.
//
//  Es la única fuente de precios de la app. Devuelve, para cada carta:
//   - `card_prices`: el MENOR precio encontrado en cada página
//     (TCGPlayer / CardMarket / CoolStuffInc / eBay / Amazon), a nivel
//     CARTA (mezcla todas las impresiones). CardMarket viene en EUROS,
//     el resto en dólares.
//   - `card_sets[]`: cada impresión (código + set + rareza) con su
//     `set_price`, que es el precio de TCGPlayer DE ESA impresión.
//
//  Ojo: ninguno de los dos es un historial de ventas. La API no publica
//  ventas cerradas; lo más fino que hay es el `set_price` por impresión.
//
//  Rate limit de la API: 20 pedidos por segundo (pasarse = ban de 1 hora).
// =====================================================================

const CARDINFO_API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'
const SETINFO_API = 'https://db.ygoprodeck.com/api/v7/cardsetsinfo.php'

// Códigos como "RA03-SP001" o "LOB-005": prefijo + región (opcional) + número.
export const SETCODE_REGEX = /^([A-Z0-9]{2,5})-([A-Z]{0,3})(\d{3,4})$/

/** ¿El texto tipeado parece un código de set y no un nombre? */
export function esCodigoDeSet(texto) {
  return SETCODE_REGEX.test(String(texto || '').trim().toUpperCase())
}

// Región del código -> idioma legible.
const IDIOMAS = {
  '': 'Inglés',
  EN: 'Inglés',
  E: 'Inglés',
  A: 'Inglés',
  AE: 'Inglés',
  SP: 'Español',
  S: 'Español',
  FR: 'Francés',
  F: 'Francés',
  DE: 'Alemán',
  G: 'Alemán',
  IT: 'Italiano',
  I: 'Italiano',
  PT: 'Portugués',
  P: 'Portugués',
  JP: 'Japonés',
  JA: 'Japonés',
  KR: 'Coreano',
  K: 'Coreano',
  TC: 'Chino tradicional',
  SC: 'Chino simplificado',
}

export function idiomaDeCodigo(codigo) {
  const m = SETCODE_REGEX.exec(String(codigo || '').toUpperCase())
  return m ? IDIOMAS[m[2]] || '' : ''
}

// La base indexa los códigos en inglés. Si la carta es de otro idioma,
// probamos también su equivalente EN (RA05-SP028 -> RA05-EN028 / RA05-028).
function variantesDeCodigo(codigo) {
  const m = SETCODE_REGEX.exec(codigo)
  if (!m) return [codigo]
  const [, set, region, num] = m
  if (region === 'EN') return [codigo]
  return [codigo, `${set}-EN${num}`, `${set}-${num}`]
}

// ---------------------------------------------------------------------
//  Fetch con caché en memoria (dura lo que dura la pestaña). Evita
//  repetir pedidos al tipear y volver sobre la misma carta.
// ---------------------------------------------------------------------

const cache = new Map()

async function fetchJson(url) {
  if (cache.has(url)) return cache.get(url)
  try {
    const res = await fetch(url)
    const data = await res.json().catch(() => null)
    // Cuando no hay resultados la API responde 400 con `{ error }`. Eso sí
    // se cachea (la respuesta no va a cambiar), pero una caída de red no:
    // si no, un error pasajero deja la carta rota por toda la sesión.
    if (data?.error) {
      cache.set(url, null)
      return null
    }
    if (!res.ok || !data) return null
    cache.set(url, data)
    return data
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------
//  Mapeo al modelo que usa la app
// ---------------------------------------------------------------------

function numero(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Modelo de carta de la app:
 * `{ id, nombre, tipo, raza, atributo, nivel, atk, def, arquetipo,
 *    descripcion, imagen, imagenChica, precios, sets }`
 * - `precios`: `{ tcgplayer_price, cardmarket_price, ... }` ya numérico.
 * - `sets`: impresiones ordenadas de más cara a más barata.
 */
function mapearCarta(c) {
  const p = c.card_prices?.[0] || {}
  return {
    id: c.id,
    nombre: c.name || '',
    tipo: c.type || '',
    raza: c.race || '',
    atributo: c.attribute || '',
    nivel: c.level ?? c.linkval ?? null,
    escala: c.scale ?? null,
    atk: c.atk ?? null,
    def: c.def ?? null,
    arquetipo: c.archetype || '',
    descripcion: c.desc || '',
    imagen: c.card_images?.[0]?.image_url || '',
    imagenChica: c.card_images?.[0]?.image_url_small || '',
    precios: {
      tcgplayer_price: numero(p.tcgplayer_price),
      cardmarket_price: numero(p.cardmarket_price),
      coolstuffinc_price: numero(p.coolstuffinc_price),
      ebay_price: numero(p.ebay_price),
      amazon_price: numero(p.amazon_price),
    },
    sets: (c.card_sets || [])
      .map((s) => ({
        codigo: s.set_code || '',
        setNombre: s.set_name || '',
        rareza: s.set_rarity || '',
        rarezaCorta: (s.set_rarity_code || '').replace(/[()]/g, ''),
        precioUsd: numero(s.set_price),
      }))
      .sort((a, b) => b.precioUsd - a.precioUsd),
  }
}

// ---------------------------------------------------------------------
//  Identificación de una impresión
//
//  El código NO alcanza para identificarla: una misma carta puede salir
//  en el mismo código con dos rarezas distintas y precios muy diferentes
//  (RA05-EN083 existe como Starlight Rare y como Ultra Rare). Por eso la
//  clave lleva también la rareza.
// ---------------------------------------------------------------------

const SEPARADOR = '~'

export function claveImpresion(set) {
  if (!set?.codigo) return ''
  return set.rareza ? `${set.codigo}${SEPARADOR}${set.rareza}` : set.codigo
}

/**
 * Busca una impresión dentro de `carta.sets` a partir de una clave.
 * Acepta la clave completa (`código~rareza`) y también un código pelado,
 * para que un link escrito a mano (#carta/46986414/LOB-005) funcione.
 */
export function buscarImpresion(carta, clave) {
  if (!carta?.sets?.length || !clave) return null
  const buscada = String(clave).toUpperCase()
  return (
    carta.sets.find((s) => claveImpresion(s).toUpperCase() === buscada) ||
    carta.sets.find((s) => s.codigo.toUpperCase() === buscada) ||
    null
  )
}

// ---------------------------------------------------------------------
//  Búsquedas
// ---------------------------------------------------------------------

/** Sugerencias por nombre parcial (para el autocompletado). */
export async function buscarPorNombre(texto, num = 10) {
  const q = String(texto || '').trim()
  if (q.length < 3) return []
  const data = await fetchJson(
    `${CARDINFO_API}?fname=${encodeURIComponent(q)}&num=${num}&offset=0`,
  )
  return (data?.data || []).map(mapearCarta)
}

/** Trae una carta puntual por su passcode/id. */
export async function buscarPorId(id) {
  const data = await fetchJson(`${CARDINFO_API}?id=${encodeURIComponent(id)}`)
  const c = data?.data?.[0]
  return c ? mapearCarta(c) : null
}

/**
 * Busca por código de set exacto (ej: "RA03-SP001").
 * Devuelve `{ carta, codigo, impresion }`, donde `impresion` es la entrada
 * de `carta.sets` que corresponde a ese código, o `null` si no existe.
 */
export async function buscarPorCodigo(codigoCrudo) {
  const codigo = String(codigoCrudo || '').trim().toUpperCase()
  if (!codigo) return null

  for (const variante of variantesDeCodigo(codigo)) {
    const info = await fetchJson(
      `${SETINFO_API}?setcode=${encodeURIComponent(variante)}`,
    )
    if (!info?.name) continue

    // `cardsetsinfo` no trae la carta completa: la pedimos por id (o por
    // nombre, para las respuestas viejas que no incluyen id).
    const carta = info.id
      ? await buscarPorId(info.id)
      : (await buscarPorNombre(info.name, 1))[0]
    if (!carta) continue

    // `cardsetsinfo` nos dice la rareza exacta: la usamos para elegir la
    // impresión correcta cuando el código está repetido con dos rarezas.
    const impresion =
      buscarImpresion(
        carta,
        claveImpresion({ codigo: variante, rareza: info.set_rarity || '' }),
      ) || {
        codigo: variante,
        setNombre: info.set_name || '',
        rareza: info.set_rarity || '',
        rarezaCorta: '',
        precioUsd: numero(info.set_price),
      }

    return { carta, codigo, impresion }
  }
  return null
}

/**
 * Resuelve lo que el usuario tipeó: si es un código de set devuelve esa
 * impresión ya seleccionada; si es un nombre, devuelve la primera
 * coincidencia exacta (o la más parecida).
 */
export async function resolverConsulta(texto) {
  const q = String(texto || '').trim()
  if (!q) return null

  if (esCodigoDeSet(q)) {
    const r = await buscarPorCodigo(q)
    if (r) return r
  }

  // Nombre exacto primero (evita que "Pot of Greed" traiga "Pot of
  // Greed's Gluttony"), después búsqueda parcial.
  const exacta = await fetchJson(`${CARDINFO_API}?name=${encodeURIComponent(q)}`)
  const carta = exacta?.data?.[0]
    ? mapearCarta(exacta.data[0])
    : (await buscarPorNombre(q, 1))[0]
  return carta ? { carta, codigo: null, impresion: null } : null
}
