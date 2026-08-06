import { ars, fechaCorta, numero } from '../utils/format'

/**
 * Barra con la cotización del día. El usuario elige QUÉ dólar usar para
 * convertir a pesos (blue, oficial, tarjeta…) y de ahí sale todo lo demás.
 */
export default function BarraCotizacion({
  cotizacion,
  casaId,
  setCasaId,
  casa,
  cargando,
  onRefrescar,
}) {
  const casas = cotizacion?.casas || []

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-[var(--color-muted)]">Dólar</span>
          <select
            value={casaId}
            onChange={(e) => setCasaId(e.target.value)}
            disabled={!casas.length}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-brand)] disabled:opacity-50"
          >
            {casas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <span className="tabular font-semibold text-[var(--color-ink)]">
          {casa?.venta ? ars(casa.venta) : '—'}
          <span className="ml-1 text-xs font-normal text-[var(--color-faint)]">
            venta
          </span>
        </span>

        <span className="tabular text-[var(--color-muted)]">
          1 € ={' '}
          <span className="text-[var(--color-ink)]">
            US$ {numero(cotizacion?.eurUsd || 0, 3)}
          </span>
        </span>

        <span className="ml-auto flex items-center gap-3 text-xs text-[var(--color-muted)]">
          {cotizacion?.offline ? (
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-400">
              Sin conexión — último valor guardado
            </span>
          ) : (
            cotizacion?.fecha && <span>Actualizado {fechaCorta(cotizacion.fecha)}</span>
          )}
          <button
            type="button"
            onClick={onRefrescar}
            disabled={cargando}
            className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[var(--color-muted)] transition-colors duration-150 hover:border-[var(--color-brand)] hover:text-[var(--color-ink)] disabled:opacity-50"
          >
            {cargando ? 'Actualizando…' : '↻ Actualizar'}
          </button>
        </span>
      </div>
    </div>
  )
}
