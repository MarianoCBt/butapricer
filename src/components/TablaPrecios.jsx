import { ars, moneda } from '../utils/format'

function Punto({ color }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  )
}

/**
 * Tabla comparativa entre las tres páginas.
 *
 * Cada fila muestra el valor tal cual lo publica la página (en su moneda),
 * el mismo valor en USD y en ARS según la cotización elegida. Abajo, el
 * promedio y el rango.
 */
export default function TablaPrecios({ filas, resumen, hayImpresion }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="font-semibold text-[var(--color-ink)]">
          Precio general de la carta
        </h3>
        <p className="text-xs text-[var(--color-muted)]">
          Menor precio por página · todas las rarezas juntas
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
              <th scope="col" className="px-4 py-2 font-medium">
                Página
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                Publicado
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                En USD
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                En ARS
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border)]">
            {filas.map((f) => (
              <tr
                key={f.id}
                className="transition-colors duration-150 hover:bg-[var(--color-surface-2)]"
              >
                <th scope="row" className="px-4 py-2.5 text-left font-normal">
                  <span className="flex items-center gap-2">
                    <Punto color={f.color} />
                    {f.url ? (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[var(--color-ink)] underline decoration-transparent underline-offset-2 transition-colors duration-150 hover:decoration-[var(--color-brand)]"
                      >
                        {f.label}
                      </a>
                    ) : (
                      <span className="text-[var(--color-ink)]">{f.label}</span>
                    )}
                    {resumen.baratas?.includes(f.id) && resumen.cantidad > 1 && (
                      <span className="rounded bg-[var(--color-brand-light)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-brand-ink)]">
                        más barato
                      </span>
                    )}
                  </span>
                </th>
                <td className="tabular px-4 py-2.5 text-right text-[var(--color-muted)]">
                  {f.hayDato ? moneda(f.original, f.moneda) : 'sin dato'}
                </td>
                <td className="tabular px-4 py-2.5 text-right text-[var(--color-ink)]">
                  {f.hayDato ? moneda(f.usd) : '—'}
                </td>
                <td className="tabular px-4 py-2.5 text-right font-semibold text-[var(--color-ink)]">
                  {f.hayDato ? ars(f.ars) : '—'}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot className="border-t-2 border-[var(--color-border)]">
            <tr className="bg-[var(--color-surface-2)]">
              <th scope="row" className="px-4 py-3 text-left font-semibold">
                Media
                <span className="ml-1 text-xs font-normal text-[var(--color-muted)]">
                  ({resumen.cantidad} de {filas.length})
                </span>
              </th>
              <td className="px-4 py-3" />
              <td className="tabular px-4 py-3 text-right font-semibold text-[var(--color-ink)]">
                {resumen.cantidad ? moneda(resumen.mediaUsd) : '—'}
              </td>
              <td className="tabular px-4 py-3 text-right text-base font-bold text-[var(--color-brand-ink)]">
                {resumen.cantidad ? ars(resumen.mediaArs) : '—'}
              </td>
            </tr>
            {resumen.cantidad > 1 && (
              <tr className="bg-[var(--color-surface-2)]">
                <th
                  scope="row"
                  className="px-4 pb-3 text-left text-xs font-normal text-[var(--color-muted)]"
                >
                  Rango
                </th>
                <td className="px-4 pb-3" />
                <td
                  colSpan={2}
                  className="tabular px-4 pb-3 text-right text-xs text-[var(--color-muted)]"
                >
                  {moneda(resumen.minUsd)} – {moneda(resumen.maxUsd)}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* La impresión elegida es el dato más fino que da la API: el precio
          de TCGPlayer para ese código + rareza puntual. */}
      {/* Qué es cada número. Va explícito para no tomar decisiones de precio
          sobre un supuesto equivocado. */}
      <ul className="space-y-1 border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-muted)]">
        {filas.map((f) => (
          <li key={f.id} className="flex items-baseline gap-2">
            <Punto color={f.color} />
            <span>
              <span className="text-[var(--color-ink)]">{f.label}:</span> {f.nota}
            </span>
          </li>
        ))}
        <li className="pt-1">
          Fuente: YGOPRODeck. Son precios de lista de la carta en general, sin
          separar por rareza
          {hayImpresion
            ? ' — para tasar, mirá el bloque de arriba, que sí es de esta impresión.'
            : ' — elegí una impresión para ver los precios de esa rareza.'}
        </li>
      </ul>
    </section>
  )
}
