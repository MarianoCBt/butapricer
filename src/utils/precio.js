// =====================================================================
//  Cálculos de precio: normalización a USD, conversión a ARS, promedio
//  entre páginas y precio de venta sugerido.
// =====================================================================

import { TIENDAS } from '../config'

/** Pasa una cifra de EUR a USD usando el cruce del día. */
export function eurAUsd(eur, eurUsd) {
  return Number.isFinite(eur) && Number.isFinite(eurUsd) ? eur * eurUsd : 0
}

/**
 * Arma las filas de la tabla comparativa.
 *
 * Cada fila trae el valor tal cual lo publica la página (`original`, en su
 * moneda), el mismo valor llevado a USD y a ARS con la casa de dólar
 * elegida. Las páginas sin precio quedan con `original: 0` y se muestran
 * como "sin dato" (no entran en el promedio).
 */
export function filasDePrecios(carta, eurUsd, tasaArs) {
  return TIENDAS.map((t) => {
    const original = carta?.precios?.[t.campo] || 0
    const usd = t.moneda === 'EUR' ? eurAUsd(original, eurUsd) : original
    return {
      id: t.id,
      label: t.label,
      color: t.color,
      nota: t.nota,
      moneda: t.moneda,
      original,
      usd,
      ars: usd * tasaArs,
      url: carta?.nombre ? t.url(carta.nombre) : null,
      hayDato: original > 0,
    }
  })
}

/**
 * Resumen de un conjunto de filas: promedio, mínimo y máximo en USD,
 * ignorando las páginas que no publicaron precio.
 */
export function resumen(filas, tasaArs) {
  const validas = filas.filter((f) => f.hayDato)
  if (!validas.length) {
    return { cantidad: 0, mediaUsd: 0, mediaArs: 0, minUsd: 0, maxUsd: 0 }
  }
  const valores = validas.map((f) => f.usd)
  const mediaUsd = valores.reduce((a, b) => a + b, 0) / valores.length
  return {
    cantidad: validas.length,
    mediaUsd,
    mediaArs: mediaUsd * tasaArs,
    minUsd: Math.min(...valores),
    maxUsd: Math.max(...valores),
    baratas: validas.filter((f) => f.usd === Math.min(...valores)).map((f) => f.id),
  }
}
