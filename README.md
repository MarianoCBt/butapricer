# ButaPricer

Consulta rápida de precios de cartas de Yu-Gi-Oh!. Buscás una carta por
**nombre** o por **código de impresión** y te muestra los precios de referencia
de esa impresión puntual, pasados a pesos con la cotización del día.

Pensado para usarse **desde el teléfono**, con la carta en la mano.

🔗 **[Ver la app](https://marianocbt.github.io/butapricer/)** ·
🛒 [Tienda](https://marianocbt.github.io/butatcg/) ·
📷 [@butatcg](https://www.instagram.com/butatcg/)

---

## Qué hace

- **Precios por impresión, no por carta.** Una Common y una Secret Rare de la
  misma carta no valen lo mismo; el desplegable agrupa las impresiones por
  rareza y los precios corresponden a la que elegiste.
- **Últimas ventas cerradas**, con fecha y condición. La condición mueve mucho
  el precio (vimos la misma carta a US$ 70,97 en Near Mint y US$ 24,52 en
  Moderately Played), así que se puede filtrar por condición.
- **El envío cuenta.** En cartas baratas pesa más que la carta, así que el
  "más barato" muestra el total puesto en destino y el desglose.
- **Cotización del día** (dolarapi.com), con la opción de cargar **tu propio
  dólar** a mano — el valor al que cobrás, que no es ninguna cotización de
  mercado sino una decisión de precio.
- **Listas**: vas cargando cartas con el precio que le ponés a cada una y te
  queda el total, con descuento opcional por cantidad.

## Correr el proyecto

```bash
npm install
npm run dev      # http://localhost:5174
```

Otros comandos: `npm run build`, `npm run preview`, `npm run lint`.

Para abrirlo desde el celular en la misma red: `npm run dev -- --host`.

## Precios en vivo

Los precios y las ventas salen de las APIs internas de TCGPlayer, que exigen
`Origin: https://www.tcgplayer.com` y sólo devuelven CORS para ese dominio. El
navegador no puede falsificar ese header, así que el pedido tiene que salir de
un servidor.

- **En desarrollo** lo resuelve el proxy de `vite.config.js`. No hay que
  configurar nada.
- **Publicado** hace falta un proxy propio (por ejemplo un Cloudflare Worker) y
  poner su URL en `tcgplayer.proxyBase` dentro de `src/config.js`. **Ese proxy
  no está en este repo.**

Sin proxy la app no se rompe: busca la carta, lista sus impresiones y avisa que
los precios en vivo no están disponibles.

## Stack

Vite + React + Tailwind CSS v4, sin dependencias de runtime más allá de React.
Estático, sin backend. Los datos salen de
[YGOPRODeck](https://ygoprodeck.com/api-guide/) (identificación de cartas e
impresiones), TCGPlayer (precios y ventas) y
[dolarapi.com](https://dolarapi.com) (cotización).

## Marcas

Yu-Gi-Oh! es marca registrada de Konami. TCGPlayer, CoolStuffInc y CardMarket
son marcas de sus respectivos dueños; sus logos se usan sólo para señalar de
dónde sale cada dato o link. Este proyecto no está afiliado a ninguno de ellos.
