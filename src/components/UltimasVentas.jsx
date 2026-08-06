import { useMemo } from 'react'
import { ars, moneda } from '../utils/format'
import { promedioVentas } from '../data/tcgplayer'
import { config } from '../config'

// Condición de la carta en inglés -> etiqueta corta en español.
// Es el dato que más mueve el precio: la misma carta puede vender a US$ 71
// en Near Mint y a US$ 24 en Moderately Played.
const CONDICIONES = {
  'Near Mint': 'Near Mint',
  'Lightly Played': 'Poco jugada',
  'Moderately Played': 'Jugada',
  'Heavily Played': 'Muy jugada',
  Damaged: 'Dañada',
  Unopened: 'Sellada',
}

function etiquetaCondicion(c) {
  return CONDICIONES[c] || c || '—'
}

function fechaVenta(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(config.locale, {
    day: 'numeric',
    month: 'short',
  }).format(d)
}

/**
 * Últimas ventas CERRADAS de TCGPlayer para la impresión elegida.
 *
 * A diferencia del resto de la app, esto no son precios de lista: son
 * operaciones que efectivamente ocurrieron. Se puede filtrar por condición
 * porque mezclar Near Mint con Damaged da un promedio que no sirve.
 */
export default function UltimasVentas({
  ventas = [],
  filtradas = [],
  condicion,
  setCondicion,
  tasaArs,
  cargando,
  hayProducto,
}) {
  const condicionesPresentes = useMemo(
    () => [...new Set(ventas.map((v) => v.condicion).filter(Boolean))],
    [ventas],
  )

  const promedio = promedioVentas(filtradas)
  const unidades = filtradas.reduce((a, v) => a + v.cantidad, 0)

  if (!hayProducto) return null

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="font-semibold text-[var(--color-ink)]">Últimas ventas</h3>
        <p className="text-xs text-[var(--color-muted)]">
          Operaciones cerradas en TCGPlayer
        </p>
      </div>

      {cargando ? (
        <p className="px-4 py-4 text-sm text-[var(--color-muted)]">Buscando ventas…</p>
      ) : !ventas.length ? (
        <p className="px-4 py-4 text-sm text-[var(--color-muted)]">
          Esta impresión no registra ventas recientes.
        </p>
      ) : (
        <>
          {condicionesPresentes.length > 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 pt-3">
              {['todas', ...condicionesPresentes].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondicion(c)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors duration-150 ${
                    c === condicion
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand)] font-semibold text-white hover:border-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {c === 'todas' ? 'Todas' : etiquetaCondicion(c)}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[26rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  <th scope="col" className="px-4 py-2 font-medium">
                    Fecha
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Condición
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Cant.
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    USD
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    ARS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtradas.map((v, i) => (
                  <tr
                    key={`${v.fecha}-${i}`}
                    className="transition-colors duration-150 hover:bg-[var(--color-surface-2)]"
                  >
                    <td className="tabular whitespace-nowrap px-4 py-2 text-[var(--color-muted)]">
                      {fechaVenta(v.fecha)}
                    </td>
                    <td className="px-4 py-2 text-[var(--color-ink)]">
                      {etiquetaCondicion(v.condicion)}
                      {v.idioma && v.idioma !== 'English' && (
                        <span className="ml-1 text-xs text-[var(--color-muted)]">
                          ({v.idioma})
                        </span>
                      )}
                    </td>
                    <td className="tabular px-4 py-2 text-right text-[var(--color-muted)]">
                      {v.cantidad}
                    </td>
                    <td className="tabular px-4 py-2 text-right text-[var(--color-ink)]">
                      {moneda(v.precio)}
                    </td>
                    <td className="tabular px-4 py-2 text-right font-semibold text-[var(--color-ink)]">
                      {ars(v.precio * tasaArs)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-[var(--color-border)]">
                <tr className="bg-[var(--color-surface-2)]">
                  <th
                    scope="row"
                    colSpan={2}
                    className="px-4 py-3 text-left font-semibold text-[var(--color-ink)]"
                  >
                    Promedio
                    <span className="ml-1 text-xs font-normal text-[var(--color-muted)]">
                      ({unidades} {unidades === 1 ? 'unidad' : 'unidades'})
                    </span>
                  </th>
                  <td className="px-4 py-3" />
                  <td className="tabular px-4 py-3 text-right font-semibold text-[var(--color-ink)]">
                    {promedio > 0 ? moneda(promedio) : '—'}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-base font-bold text-[var(--color-brand-ink)]">
                    {promedio > 0 ? ars(promedio * tasaArs) : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-muted)]">
            Promedio ponderado por cantidad. La condición cambia mucho el precio,
            así que este filtro también manda sobre el precio de venta sugerido:
            elegí la condición en la que esté tu copia.
          </p>
        </>
      )}
    </section>
  )
}
