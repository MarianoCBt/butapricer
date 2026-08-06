import { useMemo } from 'react'
import { ars, fechaCorta, numero } from '../utils/format'
import { CASA_MANUAL } from '../data/cotizacion'

/**
 * Barra con la cotización del día. El usuario elige QUÉ dólar usar para
 * convertir a pesos y de ahí sale todo lo demás.
 *
 * Además de las casas reales (blue, oficial, tarjeta…) está el **AVG
 * propio**: el valor al que uno cobra el dólar, que en la práctica no es
 * ninguna cotización de mercado sino una decisión de precio (hay quien
 * vende a $2.000 con el blue a $1.530). Se carga a mano y se muestra al
 * lado cuánto es de recargo sobre el blue, para que el número no quede
 * suelto.
 */
export default function BarraCotizacion({
  cotizacion,
  casaId,
  setCasaId,
  casa,
  esManual,
  dolarManual,
  setDolarManual,
  referencia,
  tasaArs,
  cargando,
  onRefrescar,
}) {
  const casas = cotizacion?.casas || []

  // "Mi AVG" va segundo, justo debajo de Oficial: es la opción que más se
  // usa, no tiene sentido tenerla al final. Se ubica buscando el oficial por
  // id (no por posición) para no depender del orden en que venga la API.
  const opciones = useMemo(() => {
    const manual = { id: CASA_MANUAL, nombre: 'Mi AVG (a mano)' }
    const i = casas.findIndex((c) => c.id === 'oficial')
    const pos = i >= 0 ? i + 1 : Math.min(1, casas.length)
    return [...casas.slice(0, pos), manual, ...casas.slice(pos)]
  }, [casas])

  // Cuánto se está cobrando por encima (o por debajo) del blue.
  const recargo =
    referencia?.venta > 0 && tasaArs > 0
      ? (tasaArs / referencia.venta - 1) * 100
      : null

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-[var(--color-muted)]">Dólar</span>
          <select
            value={casaId}
            onChange={(e) => setCasaId(e.target.value)}
            className="min-h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-brand)]"
          >
            {opciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>

        {esManual ? (
          <label className="flex items-center gap-2">
            <span className="text-[var(--color-muted)]">$</span>
            <input
              type="number"
              min={0}
              step={10}
              value={dolarManual || ''}
              onChange={(e) => setDolarManual(Number(e.target.value))}
              placeholder="2000"
              aria-label="Valor del dólar con el que tasás"
              className="tabular min-h-9 w-24 rounded-md border border-[var(--color-brand)] bg-[var(--color-surface)] px-2 py-1.5 font-semibold text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-brand-ink)]"
            />
          </label>
        ) : (
          <span className="tabular font-semibold text-[var(--color-ink)]">
            {casa?.venta ? ars(casa.venta) : '—'}
            <span className="ml-1 text-xs font-normal text-[var(--color-muted)]">
              venta
            </span>
          </span>
        )}

        {recargo !== null && Math.abs(recargo) >= 0.5 && (
          <span
            className="tabular rounded-full px-2 py-0.5 text-xs"
            style={{
              color: recargo > 0 ? 'var(--color-brand-ink)' : 'var(--color-muted)',
              backgroundColor: 'color-mix(in srgb, currentColor 15%, transparent)',
            }}
            title={`Blue: ${ars(referencia.venta)}`}
          >
            {recargo > 0 ? '+' : ''}
            {numero(recargo, 1)}% vs blue
          </span>
        )}

        {/* El cruce del euro y la fecha son detalle: en el teléfono ocupaban
            dos renglones enteros arriba de todo. Se ven de md para arriba. */}
        <span className="tabular hidden text-[var(--color-muted)] md:inline">
          1 € ={' '}
          <span className="text-[var(--color-ink)]">
            US$ {numero(cotizacion?.eurUsd || 0, 3)}
          </span>
        </span>

        <span className="ml-auto flex items-center gap-3 text-xs text-[var(--color-muted)]">
          {cotizacion?.offline ? (
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-400">
              Sin conexión
            </span>
          ) : (
            cotizacion?.fecha && (
              <span className="hidden md:inline">
                Actualizado {fechaCorta(cotizacion.fecha)}
              </span>
            )
          )}
          <button
            type="button"
            onClick={onRefrescar}
            disabled={cargando}
            title="Actualizar cotización"
            className="min-h-9 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-muted)] transition-colors duration-150 hover:border-[var(--color-brand)] hover:text-[var(--color-ink)] disabled:opacity-50"
          >
            {cargando ? '…' : '↻'}
            <span className="ml-1 hidden md:inline">
              {cargando ? 'Actualizando' : 'Actualizar'}
            </span>
          </button>
        </span>
      </div>
    </div>
  )
}
