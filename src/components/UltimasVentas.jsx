import { useMemo } from 'react'
import FilaPrecio from './FilaPrecio'
import LogoTienda, { tiendaPorId } from './LogoTienda'
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
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="font-semibold text-[var(--color-ink)]">Últimas ventas</h3>
        <p className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          Operaciones cerradas en
          <LogoTienda
            tienda={tiendaPorId('tcgplayer')}
            icono
            conTexto
            altoCuadrado="h-4"
            claseTexto="font-semibold text-[var(--color-ink)]"
          />
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
            <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-border)] px-4 py-3">
              {['todas', ...condicionesPresentes].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondicion(c)}
                  className={`min-h-9 rounded-full border px-3.5 py-2 text-xs transition-colors duration-150 ${
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

          <ul className="divide-y divide-[var(--color-border)]">
            {filtradas.map((v, i) => (
              <FilaPrecio
                key={`${v.fecha}-${i}`}
                titulo={etiquetaCondicion(v.condicion)}
                subtitulo={[
                  fechaVenta(v.fecha),
                  v.cantidad > 1 ? `×${v.cantidad}` : null,
                  v.idioma && v.idioma !== 'English' ? v.idioma : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                usd={v.precio}
                tasaArs={tasaArs}
              />
            ))}
            <FilaPrecio
              titulo="Promedio"
              subtitulo={`${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`}
              usd={promedio}
              tasaArs={tasaArs}
              destacado
            />
          </ul>

          <p className="border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-muted)]">
            Promedio ponderado por cantidad. La condición cambia mucho el precio:
            filtrá por la condición en la que esté tu copia.
          </p>
        </>
      )}
    </section>
  )
}
