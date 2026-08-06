import { ars, moneda } from '../utils/format'
import { rarezaColor } from '../utils/rareza'

function Fila({ etiqueta, ayuda, usd, tasaArs, fuerte }) {
  return (
    <tr className="transition-colors duration-150 hover:bg-[var(--color-surface-2)]">
      <th scope="row" className="px-4 py-2.5 text-left font-normal">
        <span className={fuerte ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}>
          {etiqueta}
        </span>
        {ayuda && (
          <span className="block text-xs text-[var(--color-muted)]">{ayuda}</span>
        )}
      </th>
      <td className="tabular px-4 py-2.5 text-right text-[var(--color-ink)]">
        {usd > 0 ? moneda(usd) : '—'}
      </td>
      <td
        className={`tabular px-4 py-2.5 text-right font-semibold ${
          fuerte ? 'text-[var(--color-brand-ink)]' : 'text-[var(--color-ink)]'
        }`}
      >
        {usd > 0 ? ars(usd * tasaArs) : '—'}
      </td>
    </tr>
  )
}

/**
 * Precios de TCGPlayer para UNA impresión concreta (código + rareza).
 *
 * Es el bloque más importante para tasar: a diferencia de la tabla general,
 * acá los números corresponden a esa rareza exacta y no al mínimo de todas
 * las versiones de la carta.
 */
export default function PreciosImpresion({ impresion, producto, tasaArs, cargando }) {
  if (!impresion) return null

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--color-brand)]/40 bg-[var(--color-surface)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-[var(--color-border)] bg-[var(--color-brand-light)]/40 px-4 py-3">
        <h3 className="font-semibold text-[var(--color-ink)]">
          Esta impresión{' '}
          <span className="font-normal text-[var(--color-muted)]">· TCGPlayer</span>
        </h3>
        <p className="flex items-center gap-2 text-sm">
          <span className="tabular text-[var(--color-muted)]">{impresion.codigo}</span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              color: rarezaColor(impresion.rareza),
              backgroundColor: 'color-mix(in srgb, currentColor 15%, transparent)',
            }}
          >
            {impresion.rareza || 'Sin rareza'}
          </span>
        </p>
      </div>

      {cargando ? (
        <p className="px-4 py-4 text-sm text-[var(--color-muted)]">
          Buscando esta impresión en TCGPlayer…
        </p>
      ) : producto ? (
        <>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--color-border)]">
              <Fila
                etiqueta="Market Price"
                ayuda="Promedio ponderado de las ventas recientes"
                usd={producto.market}
                tasaArs={tasaArs}
                fuerte
              />
              <Fila
                etiqueta="Mediana de listados"
                usd={producto.median}
                tasaArs={tasaArs}
              />
              <Fila
                etiqueta="Más barato listado"
                usd={producto.lowest}
                tasaArs={tasaArs}
              />
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted)]">
            <span>
              {producto.listados > 0
                ? `${producto.listados} publicaciones activas`
                : 'Sin publicaciones activas'}
            </span>
            <a
              href={producto.url}
              target="_blank"
              rel="noreferrer noopener"
              className="underline decoration-transparent underline-offset-2 transition-colors duration-150 hover:decoration-[var(--color-brand-ink)] hover:text-[var(--color-ink)]"
            >
              Ver en TCGPlayer →
            </a>
          </div>
        </>
      ) : (
        <p className="px-4 py-4 text-sm text-[var(--color-muted)]">
          No encontré esta impresión en TCGPlayer. Puede ser que la listen con
          otro nombre, o que sea una edición que no venden.
        </p>
      )}
    </section>
  )
}
