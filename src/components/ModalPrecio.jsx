import { useEffect, useMemo, useRef, useState } from 'react'
import { ars, moneda } from '../utils/format'
import { rarezaColor } from '../utils/rareza'
import { opcionesDeCasas } from '../data/cotizacion'
import { config } from '../config'

const CONDICIONES = {
  'Near Mint': 'Near Mint',
  'Lightly Played': 'Poco jugada',
  'Moderately Played': 'Jugada',
  'Heavily Played': 'Muy jugada',
  Damaged: 'Dañada',
  Unopened: 'Sellada',
}

function fechaCorta(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(config.locale, {
    day: 'numeric',
    month: 'short',
  }).format(d)
}

/**
 * Popup para fijar el precio con el que la carta entra a la lista.
 *
 * Muestra la evidencia (últimas 3 ventas + market en USD), deja elegir con
 * qué dólar convertir —el oficial o uno propio a mano— y permite pisar el
 * número final a mano. El precio que se guarda queda congelado en pesos.
 */
export default function ModalPrecio({
  abierto,
  onCerrar,
  onAgregar,
  carta,
  impresion,
  producto,
  ventas,
  casas,
  casaId,
  setCasaId,
  esManual,
  dolarManual,
  setDolarManual,
  tasaArs,
}) {
  // Precio en pesos ya redondeado a partir del market y la cotización.
  const sugerido = useMemo(
    () => (producto?.market > 0 && tasaArs > 0 ? Math.round(producto.market * tasaArs) : 0),
    [producto, tasaArs],
  )

  // `null` = seguir al sugerido; un número = el usuario lo pisó a mano.
  const [manual, setManual] = useState(null)
  const precio = manual === null ? sugerido : manual

  const dialogo = useRef(null)
  const inputPrecio = useRef(null)

  // Al abrir (o cambiar de carta) se vuelve a seguir el sugerido.
  useEffect(() => {
    if (abierto) setManual(null)
  }, [abierto, producto?.productId])

  // Cerrar con Escape y atrapar el foco dentro del diálogo.
  useEffect(() => {
    if (!abierto) return
    const alTecla = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alTecla)
    inputPrecio.current?.focus()
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTecla)
      document.body.style.overflow = previo
    }
  }, [abierto, onCerrar])

  if (!abierto || !carta) return null

  const ultimas = (ventas || []).slice(0, 3)

  const confirmar = () => {
    if (precio <= 0) return
    onAgregar({
      cartaId: carta.id,
      nombre: carta.nombre,
      imagen: carta.imagenChica || carta.imagen,
      codigo: impresion?.codigo || '',
      rareza: impresion?.rareza || '',
      precioArs: precio,
      marketUsd: producto?.market || 0,
    })
    onCerrar()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-label={`Agregar ${carta.nombre} a la lista`}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] sm:rounded-2xl"
        style={{ animation: 'panel-in 160ms ease-out' }}
      >
        {/* Encabezado */}
        <div className="flex items-start gap-3 border-b border-[var(--color-border)] p-4">
          {carta.imagenChica && (
            <img
              src={carta.imagenChica}
              alt=""
              className="h-16 w-11 shrink-0 rounded object-contain"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold leading-snug text-[var(--color-ink)]">
              {carta.nombre}
            </h2>
            <p className="tabular mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-muted)]">
              {impresion?.codigo}
              {impresion?.rareza && (
                <span
                  className="rounded-full px-2 py-0.5 font-semibold"
                  style={{
                    color: rarezaColor(impresion.rareza),
                    backgroundColor: 'color-mix(in srgb, currentColor 15%, transparent)',
                  }}
                >
                  {impresion.rareza}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 min-h-9 rounded-md px-3 py-2 text-lg leading-none text-[var(--color-muted)] transition-colors duration-150 hover:text-[var(--color-ink)]"
          >
            ✕
          </button>
        </div>

        {/* Evidencia: market + últimas ventas */}
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-[var(--color-muted)]">Market Price</span>
            <span className="tabular font-semibold text-[var(--color-usd)]">
              {producto?.market > 0 ? moneda(producto.market) : '—'}
            </span>
          </div>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Últimas ventas
          </p>
          {ultimas.length ? (
            <ul className="mt-1 space-y-1">
              {ultimas.map((v, i) => (
                <li
                  key={`${v.fecha}-${i}`}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate text-[var(--color-muted)]">
                    {fechaCorta(v.fecha)} ·{' '}
                    {CONDICIONES[v.condicion] || v.condicion || '—'}
                  </span>
                  <span className="tabular shrink-0 font-medium text-[var(--color-usd)]">
                    {moneda(v.precio)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Sin ventas recientes registradas.
            </p>
          )}
        </div>

        {/* Con qué dólar convertir */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] p-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-muted)]">Dólar</span>
            <select
              value={casaId}
              onChange={(e) => setCasaId(e.target.value)}
              className="min-h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-sm text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-brand)]"
            >
              {opcionesDeCasas(casas).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          {esManual ? (
            <label className="flex items-center gap-1 text-sm">
              <span className="text-[var(--color-muted)]">$</span>
              <input
                type="number"
                min={0}
                step={10}
                value={dolarManual || ''}
                onChange={(e) => setDolarManual(Number(e.target.value))}
                aria-label="Valor del dólar"
                className="tabular min-h-9 w-24 rounded-md border border-[var(--color-brand)] bg-[var(--color-surface-2)] px-2 py-1.5 font-semibold text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-brand-ink)]"
              />
            </label>
          ) : (
            <span className="tabular text-sm text-[var(--color-muted)]">
              {tasaArs > 0 ? ars(tasaArs) : '—'}
            </span>
          )}
        </div>

        {/* Precio final */}
        <div className="p-4">
          <label
            htmlFor="precio-final"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]"
          >
            Precio final
          </label>
          <div className="flex items-center gap-2">
            <span className="text-lg text-[var(--color-muted)]">$</span>
            <input
              id="precio-final"
              ref={inputPrecio}
              type="number"
              min={0}
              step={100}
              value={precio || ''}
              onChange={(e) => setManual(Number(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && confirmar()}
              className="tabular min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-lg font-bold text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]"
            />
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--color-muted)]">
            {manual === null ? (
              sugerido > 0 ? (
                <>Calculado con el market y el dólar elegido.</>
              ) : (
                <>Sin market disponible: poné el precio a mano.</>
              )
            ) : (
              <>
                Precio puesto a mano.
                {sugerido > 0 && (
                  <button
                    type="button"
                    onClick={() => setManual(null)}
                    className="underline decoration-transparent underline-offset-2 transition-colors duration-150 hover:text-[var(--color-ink)] hover:decoration-[var(--color-brand-ink)]"
                  >
                    Volver al sugerido ({ars(sugerido)})
                  </button>
                )}
              </>
            )}
          </p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-muted)] transition-colors duration-150 hover:border-[var(--color-brand)] hover:text-[var(--color-ink)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={precio <= 0}
              className="min-h-11 flex-1 rounded-lg bg-[var(--color-brand)] px-4 py-2 font-semibold text-white transition-colors duration-150 hover:bg-[var(--color-brand-dark)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
