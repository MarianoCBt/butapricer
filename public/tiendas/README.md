# Logos de las tiendas

Dejá acá los logos que se muestran en el bloque **“Comparar en”** de cada carta.

Nombres que busca la app (definidos en `src/config.js` → `TIENDAS`). Para cada
tienda prueba primero `.svg` y después `.png`, así que cualquiera de los dos
sirve:

| Archivo                              | Tienda       | ¿Está? |
|--------------------------------------|--------------|--------|
| `tcgplayer.svg` o `tcgplayer.png`    | TCGPlayer    | ✅ png |
| `coolstuffinc.svg` o `.png`          | CoolStuffInc | ✅ png |
| `cardmarket.svg` o `.png`            | CardMarket   | ❌ falta |

## Reglas

- **El nombre va todo en minúscula.** Windows no distingue mayúsculas, pero
  GitHub Pages corre en Linux y `CoolStuffInc.png` ahí daría 404.
- **SVG** es lo ideal: nítido en cualquier pantalla y pesa nada. Si es PNG, que
  sea **con fondo transparente** y de al menos 2x el tamaño final (se muestran
  a 20px de alto, así que ~40-60px de alto alcanza).
- **El sitio es oscuro**: un logo negro sobre `#0d1018` no se ve. Si tenés
  dudas, mirá el logo puesto y fijate que se lea.
- Se muestran con `object-contain` a 20px de alto y hasta 112px de ancho, así
  que la proporción no importa.

## Si falta alguno

No pasa nada: la app muestra el nombre de la tienda en texto, con su color.
No hace falta que estén los tres.

## Ojo

Son marcas de terceros. Van sólo para señalar de dónde sale cada link —
no los uses de una forma que sugiera que la tienda tiene algo que ver con
ButaPricer.
