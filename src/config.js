// =====================================================================
//  CONFIGURACIÓN DE ButaPricer
//  Reglas de negocio para pasar de un precio de referencia en USD/EUR
//  a un precio de venta en ARS. Editá acá.
// =====================================================================

export const config = {
  appName: 'ButaPricer',
  tagline: 'Precios de referencia de Yu-Gi-Oh!',

  // Logo (archivo dentro de /public). Si no existe, se muestra un emoji.
  logo: import.meta.env.BASE_URL + 'logo.png',

  currency: 'ARS',
  locale: 'es-AR',

  // Casa de dólar usada por defecto para convertir a ARS.
  casaDolarPorDefecto: 'blue',

  // Qué casas de dolarapi.com se ofrecen, EN ESTE ORDEN. La API devuelve
  // más (bolsa, contadoconliqui, mayorista, tarjeta) pero no aportan para
  // tasar cartas y sólo alargan el desplegable en el teléfono.
  // "Mi AVG" no está acá: no viene de la API y se inserta después del
  // oficial (ver BarraCotizacion).
  casasVisibles: ['oficial', 'blue', 'cripto'],

  // Cada cuánto refrescar la cotización automáticamente (minutos).
  refreshMinutos: 30,

  // -------------------------------------------------------------------
  //  TCGPlayer: precios por rareza + últimas ventas.
  //  Sus APIs exigen `Origin: https://www.tcgplayer.com`, que el navegador
  //  no puede mandar, así que el pedido tiene que pasar por un servidor.
  //
  //  - En DEV (npm run dev) lo resuelve el proxy de Vite: dejá `proxyBase`
  //    vacío y anda solo.
  //  - PUBLICADO hay que desplegar `worker/tcgplayer-proxy.js` en Cloudflare
  //    (plan gratis) y poner acá su URL, ej:
  //      proxyBase: 'https://butapricer-tcg.TUUSUARIO.workers.dev'
  //  Si queda vacío en producción, la app no rompe: simplemente no muestra
  //  ventas ni precios por rareza, y avisa por qué.
  // -------------------------------------------------------------------
  tcgplayer: {
    proxyBase: '',
    ventasVisibles: 12,
  },
}

// Las tres páginas que comparamos, en el orden en que se muestran.
// `campo` es la clave dentro de `card_prices` de YGOPRODeck.
export const TIENDAS = [
  {
    id: 'tcgplayer',
    label: 'TCGPlayer',
    campo: 'tcgplayer_price',
    moneda: 'USD',
    color: 'var(--color-tcg)',
    // Qué es exactamente el número que devuelve la API.
    nota: 'Menor precio entre las versiones de la carta.',
    url: (nombre) =>
      `https://www.tcgplayer.com/search/yugioh/product?productLineName=yugioh&q=${encodeURIComponent(nombre)}`,
  },
  {
    id: 'cardmarket',
    label: 'CardMarket',
    campo: 'cardmarket_price',
    moneda: 'EUR',
    color: 'var(--color-mkt)',
    nota: 'Menor precio en euros (mercado europeo).',
    url: (nombre) =>
      `https://www.cardmarket.com/en/YuGiOh/Products/Search?searchString=${encodeURIComponent(nombre)}`,
  },
  {
    id: 'coolstuffinc',
    label: 'CoolStuffInc',
    campo: 'coolstuffinc_price',
    moneda: 'USD',
    color: 'var(--color-csi)',
    nota: 'Precio de venta al público de la tienda.',
    url: (nombre) =>
      `https://www.coolstuffinc.com/main_search.php?pa=searchOnName&page=1&q=${encodeURIComponent(nombre)}`,
  },
]
