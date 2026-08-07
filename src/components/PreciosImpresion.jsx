import FilaPrecio from './FilaPrecio'
import LogoTienda, { tiendaPorId } from './LogoTienda'
import { moneda } from '../utils/format'
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

  // El total más barato ya con envío, y cuánto suma respecto del listado
  // más barato. Si la API no manda el total con envío, se usa el listado.
  const total = producto?.lowestConEnvio || producto?.lowest || 0
  const masBarato = {
    total,
    envio: producto?.lowest > 0 ? Math.max(0, total - producto.lowest) : 0,
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--color-brand)]/40 bg-[var(--color-surface)]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[var(--color-border)] bg-[var(--color-brand-light)]/40 px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold text-[var(--color-ink)]">
          Esta impresión
          <span className="font-normal text-[var(--color-muted)]">·</span>
          <LogoTienda
            tienda={tiendaPorId('tcgplayer')}
            icono
            conTexto
            altoCuadrado="h-4"
            claseTexto="font-normal text-[var(--color-muted)]"
          />
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
            {/* En cartas baratas el envío pesa más que la carta, así que el
                número grande es el TOTAL puesto en tu casa y el desglose va
                abajo. Ver `lowestConEnvio` en tcgplayer.js: los dos precios
                pueden salir de vendedores distintos, por eso se dice "de
                envío" y no "envío del vendedor". */}
            <FilaPrecio
              titulo="Más barato"
              subtitulo={
                masBarato.envio > 0
                  ? `${moneda(producto.lowest)} + ${moneda(masBarato.envio)} de envío`
                  : producto.lowest > 0
                    ? 'envío incluido'
                    : null
              }
              usd={masBarato.total}
              tasaArs={tasaArs}
            />
          </ul>
          {/* El link a TCGPlayer vive en LinksTiendas, junto al de las otras
              páginas; acá quedaría duplicado. */}
          <p className="border-t border-[var(--color-border)] px-4 py-2.5 text-xs text-[var(--color-muted)]">
            {producto.listados > 0
              ? `${producto.listados} publicaciones activas`
              : 'Sin publicaciones activas'}
          </p>
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
