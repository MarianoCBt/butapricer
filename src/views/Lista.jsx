import { ars } from '../utils/format'
import { rarezaColor } from '../utils/rareza'

/**
 * La lista armada: una línea por carta con su precio, el descuento
 * opcional y el total. Nada más — no es una calculadora de márgenes.
 */
export default function Lista({
  items,
  quitar,
  vaciar,
  descuento,
  setDescuento,
  subtotal,
  ahorro,
  total,
  onSeguirCargando,
}) {
  if (!items.length) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-4xl">🧾</p>
        <h1 className="mt-3 text-xl font-bold text-[var(--color-ink)]">
          La lista está vacía
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Buscá una carta y tocá “Agregar a la lista” para empezar.
        </p>
        <button
          type="button"
          onClick={onSeguirCargando}
          className="mt-5 min-h-11 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 font-semibold text-white transition-colors duration-150 hover:bg-[var(--color-brand-dark)]"
        >
          Buscar una carta
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">
          Lista
          <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">
            {items.length} {items.length === 1 ? 'carta' : 'cartas'}
          </span>
        </h1>
        <button
          type="button"
          onClick={vaciar}
          className="min-h-9 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] transition-colors duration-150 hover:border-red-500/60 hover:text-red-400"
        >
          Vaciar lista
        </button>
      </div>

      <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 px-3 py-2.5">
            {i.imagen ? (
              <img
                src={i.imagen}
                alt=""
                loading="lazy"
                className="h-12 w-9 shrink-0 rounded object-contain"
              />
            ) : (
              <span className="flex h-12 w-9 shrink-0 items-center justify-center rounded bg-[var(--color-surface-2)]">
                🃏
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--color-ink)]">{i.nombre}</p>
              <p className="tabular mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-muted)]">
                {i.codigo}
                {i.rareza && (
                  <span style={{ color: rarezaColor(i.rareza) }}>{i.rareza}</span>
                )}
              </p>
            </div>

            <span className="tabular shrink-0 font-semibold text-[var(--color-ink)]">
              {ars(i.precioArs)}
            </span>

            <button
              type="button"
              onClick={() => quitar(i.id)}
              aria-label={`Quitar ${i.nombre}`}
              className="-mr-1 min-h-9 shrink-0 rounded-md px-2.5 py-2 text-[var(--color-muted)] transition-colors duration-150 hover:text-red-400"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* Descuento y total */}
      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <label className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-[var(--color-ink)]">
            Descuento
            <span className="ml-1.5 text-xs text-[var(--color-muted)]">
              por {items.length} {items.length === 1 ? 'carta' : 'cartas'}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={descuento || ''}
              placeholder="0"
              onChange={(e) => setDescuento(Number(e.target.value))}
              className="tabular min-h-9 w-20 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-right text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-brand)]"
            />
            <span className="text-sm text-[var(--color-muted)]">%</span>
          </span>
        </label>

        <dl className="mt-4 space-y-1.5 border-t border-[var(--color-border)] pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">Subtotal</dt>
            <dd className="tabular text-[var(--color-ink)]">{ars(subtotal)}</dd>
          </div>
          {ahorro > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-muted)]">Descuento</dt>
              <dd className="tabular text-[var(--color-ink)]">− {ars(ahorro)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-3 border-t border-[var(--color-border)] pt-2">
            <dt className="font-semibold text-[var(--color-ink)]">Total</dt>
            <dd className="tabular text-2xl font-bold text-[var(--color-brand-ink)]">
              {ars(total)}
            </dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        onClick={onSeguirCargando}
        className="mt-4 min-h-11 w-full rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[var(--color-muted)] transition-colors duration-150 hover:border-[var(--color-brand)] hover:text-[var(--color-ink)]"
      >
        Seguir cargando cartas
      </button>
    </div>
  )
}
