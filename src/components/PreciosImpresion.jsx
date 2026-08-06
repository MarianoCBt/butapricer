import FilaPrecio from './FilaPrecio'
import { rarezaColor } from '../utils/rareza'

/**
 * Precios de TCGPlayer para UNA impresión concreta (código + rareza).
 *
 * Es el bloque más importante: a diferencia del precio general, acá los
 * números corresponden a esa rareza exacta y no al mínimo de todas las
 * versiones de la carta. Por eso va primero.
 */
export default function PreciosImpresion({ impresion, producto, tasaArs, cargando }) {
  if (!impresion) return null

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--color-brand)]/40 bg-[var(--color-surface)]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[var(--color-border)] bg-[var(--color-brand-light)]/40 px-4 py-3">
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
          <ul className="divide-y divide-[var(--color-border)]">
            <FilaPrecio
              titulo="Market Price"
              subtitulo="Promedio de las ventas recientes"
              usd={producto.market}
              tasaArs={tasaArs}
              destacado
            />
            <FilaPrecio
              titulo="Mediana de listados"
              usd={producto.median}
              tasaArs={tasaArs}
            />
            <FilaPrecio
              titulo="Más barato listado"
              usd={producto.lowest}
              tasaArs={tasaArs}
            />
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-2.5 text-xs text-[var(--color-muted)]">
            <span>
              {producto.listados > 0
                ? `${producto.listados} publicaciones activas`
                : 'Sin publicaciones activas'}
            </span>
            <a
              href={producto.url}
              target="_blank"
              rel="noreferrer noopener"
              className="underline decoration-transparent underline-offset-2 transition-colors duration-150 hover:text-[var(--color-ink)] hover:decoration-[var(--color-brand-ink)]"
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
