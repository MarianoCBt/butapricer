import FilaPrecio from './FilaPrecio'
import { moneda } from '../utils/format'

/**
 * Comparativa entre las tres páginas, a nivel CARTA (mezcla todas las
 * rarezas). Sirve de contexto, no para tasar: por eso va después del
 * bloque de la impresión y lo dice en la nota.
 */
export default function TablaPrecios({ filas, resumen, hayImpresion, tasaArs }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="font-semibold text-[var(--color-ink)]">
          Precio general de la carta
        </h3>
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
          Menor precio por página · todas las rarezas juntas
        </p>
      </div>

      <ul className="divide-y divide-[var(--color-border)]">
        {filas.map((f) => (
          <FilaPrecio
            key={f.id}
            titulo={f.label}
            href={f.url}
            color={f.color}
            etiqueta={
              resumen.baratas?.includes(f.id) && resumen.cantidad > 1
                ? 'más barato'
                : null
            }
            usd={f.usd}
            original={f.original}
            monedaOriginal={f.moneda}
            tasaArs={tasaArs}
          />
        ))}
        <FilaPrecio
          titulo="Media"
          subtitulo={
            resumen.cantidad > 1
              ? `${resumen.cantidad} páginas · ${moneda(resumen.minUsd)} a ${moneda(resumen.maxUsd)}`
              : `${resumen.cantidad} de ${filas.length} páginas`
          }
          usd={resumen.mediaUsd}
          tasaArs={tasaArs}
          destacado
        />
      </ul>

      {/* Qué es cada número. Va explícito para no tomar decisiones sobre un
          supuesto equivocado. */}
      <ul className="space-y-1 border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-muted)]">
        {filas.map((f) => (
          <li key={f.id} className="flex items-baseline gap-2">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: f.color }}
            />
            <span>
              <span className="text-[var(--color-ink)]">{f.label}:</span> {f.nota}
            </span>
          </li>
        ))}
        <li className="pt-1">
          Fuente: YGOPRODeck. Son precios de lista de la carta en general, sin
          separar por rareza
          {hayImpresion
            ? ' — para una referencia fina, mirá el bloque de arriba, que sí es de esta impresión.'
            : ' — elegí una impresión para ver los precios de esa rareza.'}
        </li>
      </ul>
    </section>
  )
}
