import { useState } from 'react'
import { TIENDAS } from '../config'

/**
 * Logo de la tienda, con el nombre en texto como respaldo.
 *
 * `tienda.logos` son candidatos (.svg y .png): si uno no está, se prueba el
 * siguiente, y si no hay ninguno se muestra el nombre. Así da igual en qué
 * formato se guarde el archivo y la app nunca queda con un ícono roto.
 */
function Logo({ tienda }) {
  const [intento, setIntento] = useState(0)
  const candidatos = tienda.logos || []
  const src = candidatos[intento]

  if (!src) {
    return (
      <span className="font-semibold" style={{ color: tienda.color }}>
        {tienda.label}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={tienda.label}
      className="h-5 w-auto max-w-28 object-contain"
      onError={() => setIntento((i) => i + 1)}
    />
  )
}

/**
 * Links para comparar la carta a mano en las otras páginas.
 *
 * No traen precios: CardMarket bloquea con Cloudflare y CoolStuffInc
 * devuelve cuerpo vacío fuera de un navegador real (ver config.TIENDAS).
 * El link abre la búsqueda de esa carta y el precio lo mira el usuario.
 *
 * Si hay producto de TCGPlayer, el suyo apunta a la impresión exacta en
 * vez de a la búsqueda por nombre.
 */
export default function LinksTiendas({ carta, producto }) {
  if (!carta?.nombre) return null

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        Comparar en
      </h3>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {TIENDAS.map((t) => {
          const href =
            t.id === 'tcgplayer' && producto?.url ? producto.url : t.url(carta.nombre)
          return (
            <li key={t.id}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-muted)] transition-colors duration-150 hover:border-[var(--color-brand)] hover:text-[var(--color-ink)]"
              >
                <Logo tienda={t} />
                <span aria-hidden="true" className="text-xs">
                  ↗
                </span>
              </a>
            </li>
          )
        })}
      </ul>
      <p className="mt-2.5 text-xs text-[var(--color-muted)]">
        Los precios de arriba son de TCGPlayer. Estos links abren la misma carta
        en las otras páginas para chequear a mano.
      </p>
    </section>
  )
}
