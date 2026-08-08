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

  // Redes (las mismas que la tienda: marianocbt.github.io/butatcg)
  instagramUrl: 'https://www.instagram.com/butatcg/',
  instagramUser: '@butatcg',
  tiendaUrl: 'https://marianocbt.github.io/butatcg/',

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
  //  - PUBLICADO hace falta un proxy propio (p. ej. un Cloudflare Worker;
  //    no está en este repo) y poner acá su URL, ej:
  //      proxyBase: 'https://butapricer-tcg.TUUSUARIO.workers.dev'
  //  Si queda vacío en producción, la app no rompe: simplemente no muestra
  //  ventas ni precios por rareza, y avisa por qué.
  // -------------------------------------------------------------------
  tcgplayer: {
    // En DEV va vacío: el mismo origen, que atiende el proxy de Vite. Así el
    // trabajo diario no consume la cuota del Worker (ni la de nadie que
    // clone el repo). Publicado sí se usa el Worker.
    proxyBase: import.meta.env.PROD
      ? 'https://butapricer-tcg.butatcg.workers.dev'
      : '',
    ventasVisibles: 12,
  },
}

// ---------------------------------------------------------------------
//  Páginas para comparar a mano.
//
//  Son SOLO LINKS, no fuentes de precio. Los precios de la app salen todos
//  de TCGPlayer (ver src/data/tcgplayer.js). CardMarket responde 403 detrás
//  de Cloudflare y las páginas de búsqueda de CoolStuffInc devuelven cuerpo
//  vacío a cualquier cliente que no sea un navegador real: sacarles precios
//  necesitaría un navegador headless, no el proxy simple que usamos. Así que
//  se ofrece el link y el precio lo mira el usuario.
//
//  `logos` es opcional y son CANDIDATOS: se prueban en orden y se muestra
//  el primero que exista, así da igual si el archivo es .svg o .png. Si no
//  hay ninguno se muestra el nombre en texto y no se rompe nada.
// ---------------------------------------------------------------------
const asset = (f) => import.meta.env.BASE_URL + f

// Dos cosas distintas y no intercambiables:
//  - `logos`: la bandera ancha con el nombre escrito. Va sola (bloque
//    "Comparar en"): poner el nombre al lado quedaría duplicado.
//  - `iconos`: el isotipo cuadrado, normalmente el favicon del sitio. Va
//    ACOMPAÑANDO al nombre en los encabezados que declaran la fuente.
const logos = (id) => [asset(`tiendas/${id}.svg`), asset(`tiendas/${id}.png`)]
const iconos = (id) => [
  asset(`tiendas/${id}.ico`),
  asset(`tiendas/${id}-icono.svg`),
  asset(`tiendas/${id}-icono.png`),
]

export const TIENDAS = [
  {
    id: 'tcgplayer',
    label: 'TCGPlayer',
    logos: logos('tcgplayer'),
    iconos: iconos('tcgplayer'),
    color: 'var(--color-tcg)',
    url: (nombre) =>
      `https://www.tcgplayer.com/search/yugioh/product?productLineName=yugioh&q=${encodeURIComponent(nombre)}`,
  },
  {
    id: 'coolstuffinc',
    label: 'CoolStuffInc',
    logos: logos('coolstuffinc'),
    iconos: iconos('coolstuffinc'),
    color: 'var(--color-csi)',
    url: (nombre) =>
      `https://www.coolstuffinc.com/main_search.php?pa=searchOnName&page=1&q=${encodeURIComponent(nombre)}`,
  },
  {
    id: 'cardmarket',
    label: 'CardMarket',
    logos: logos('cardmarket'),
    iconos: iconos('cardmarket'),
    // El logo que tenemos es la versión oscura: sobre el fondo del botón
    // (#1e2533) queda casi invisible. Se le pone una pastilla clara detrás.
    // Si algún día conseguís la versión blanca, borrá esta línea.
    fondoClaro: true,
    color: 'var(--color-mkt)',
    url: (nombre) =>
      `https://www.cardmarket.com/en/YuGiOh/Products/Search?searchString=${encodeURIComponent(nombre)}`,
  },
]
