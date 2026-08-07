# Logos de las tiendas

Hay **dos usos distintos** y conviene tener los dos archivos:

- **Logo ancho** (el nombre escrito): va **solo**, en los botones del bloque
  **“Comparar en”**. Por eso ahí no se repite el nombre al lado.
- **Ícono cuadrado** (sirve el **favicon** del sitio, `.ico`): va
  **acompañando al nombre** en los encabezados que dicen de dónde salen los
  datos (“Esta impresión · TCGPlayer”, “Operaciones cerradas en TCGPlayer”).

## Íconos

| Archivo             | Tienda       | ¿Está? |
|---------------------|--------------|--------|
| `tcgplayer.ico`     | TCGPlayer    | ✅ |
| `coolstuffinc.ico`  | CoolStuffInc | ❌ |
| `cardmarket.ico`    | CardMarket   | ❌ |

También acepta `<tienda>-icono.svg` o `<tienda>-icono.png` si no tenés el
`.ico`. Se bajan del favicon del sitio (`https://www.tcgplayer.com/favicon.ico`
y equivalentes). Si falta, el encabezado muestra sólo el nombre.

## Logos anchos

Nombres que busca la app (definidos en `src/config.js` → `TIENDAS`). Para cada
tienda prueba primero `.svg` y después `.png`, así que cualquiera de los dos
sirve:

| Archivo                              | Tienda       | ¿Está? |
|--------------------------------------|--------------|--------|
| `tcgplayer.svg` o `tcgplayer.png`    | TCGPlayer    | ✅ png |
| `coolstuffinc.svg` o `.png`          | CoolStuffInc | ✅ png |
| `cardmarket.svg` o `.png`            | CardMarket   | ✅ png (versión oscura, ver abajo) |

## Reglas

- **El nombre va todo en minúscula.** Windows no distingue mayúsculas, pero
  GitHub Pages corre en Linux y `CoolStuffInc.png` ahí daría 404.
- **SVG** es lo ideal: nítido en cualquier pantalla y pesa nada. Si es PNG, que
  sea **con fondo transparente** y de al menos 2x el tamaño final (se muestran
  a 20px de alto, así que ~40-60px de alto alcanza).
- **El sitio es oscuro**: un logo negro sobre `#0d1018` no se ve. Si sólo
  conseguís la versión oscura, poné `fondoClaro: true` en esa tienda en
  `src/config.js`: le pone una pastilla blanca detrás. Es lo que está hecho
  con CardMarket — si algún día conseguís la versión blanca, borrá esa línea.
- Si el archivo que conseguiste es **cuadrado** (como el de CardMarket, que es
  el isotipo y no la bandera), se dibuja un poco más grande para que no quede
  diminuto al lado de uno ancho. Se detecta solo por la proporción, no hay que
  configurar nada.
- Se muestran con `object-contain` a 20px de alto (24px los cuadrados) y hasta
  112px de ancho, así que la proporción no importa.

## Si falta alguno

No pasa nada: la app muestra el nombre de la tienda en texto, con su color.
No hace falta que estén los tres.

## Ojo

Son marcas de terceros. Van sólo para señalar de dónde sale cada link —
no los uses de una forma que sugiera que la tienda tiene algo que ver con
ButaPricer.
