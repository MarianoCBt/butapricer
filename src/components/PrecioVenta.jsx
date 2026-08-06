import { useEffect, useMemo, useState } from 'react'
import { config } from '../config'
import { ars, moneda } from '../utils/format'
import { precioVenta } from '../utils/precio'

const CLAVE = 'buta.pricer.venta'

function leerReglas() {
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? { ...config.venta, ...JSON.parse(raw) } : { ...config.venta }
  } catch {
    return { ...config.venta }
  }
}

function CampoNumero({ etiqueta, sufijo, valor, onChange, paso = 1, min = 0 }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-[var(--color-muted)]">{etiqueta}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          value={valor}
          min={min}
          step={paso}
          onChange={(e) => onChange(Number(e.target.value))}
          className="tabular w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-sm text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-brand)]"
        />
        {sufijo && (
          <span className="shrink-0 text-xs text-[var(--color-muted)]">{sufijo}</span>
        )}
      </span>
    </label>
  )
}

/**
 * Precio de venta sugerido en ARS. Toma una base en dólares (el promedio,
 * la impresión elegida, el mínimo o el máximo) y le aplica la regla del
 * negocio: cotización × margen + recargo fijo, redondeado.
 */
export default function PrecioVenta({ resumen, impresion, tasaArs }) {
  const [reglas, setReglas] = useState(leerReglas)
  const [base, setBase] = useState('media')

  // Si hay una impresión con precio, es la base más precisa.
  useEffect(() => {
    setBase(impresion?.precioUsd > 0 ? 'impresion' : 'media')
  }, [impresion])

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(reglas))
    } catch {
      /* modo privado: no persistimos y listo */
    }
  }, [reglas])

  const bases = useMemo(
    () =>
      [
        { id: 'media', label: 'Media', usd: resumen.mediaUsd },
        impresion?.precioUsd > 0 && {
          id: 'impresion',
          label: 'Esta impresión',
          usd: impresion.precioUsd,
        },
        { id: 'min', label: 'Más barato', usd: resumen.minUsd },
        { id: 'max', label: 'Más caro', usd: resumen.maxUsd },
      ].filter(Boolean),
    [resumen, impresion],
  )

  const baseActiva = bases.find((b) => b.id === base) || bases[0]
  const usd = baseActiva?.usd || 0
  const sugerido = precioVenta(usd, tasaArs, reglas)
  const costo = usd * tasaArs

  const set = (k) => (v) => setReglas((r) => ({ ...r, [k]: v }))

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="font-semibold text-[var(--color-ink)]">
          Precio de venta sugerido
        </h3>
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
          referencia × cotización × (1 + margen) + recargo, redondeado
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pt-3">
        {bases.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBase(b.id)}
            disabled={!b.usd}
            className={`rounded-full border px-3 py-1 text-xs transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
              b.id === baseActiva?.id
                ? 'border-[var(--color-brand)] bg-[var(--color-brand)] font-semibold text-white hover:border-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-ink)]'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 pt-3">
        <CampoNumero
          etiqueta="Margen"
          sufijo="%"
          valor={reglas.margen}
          onChange={set('margen')}
        />
        <CampoNumero
          etiqueta="Recargo fijo"
          sufijo="$"
          valor={reglas.recargoFijo}
          paso={50}
          onChange={set('recargoFijo')}
        />
        <CampoNumero
          etiqueta="Redondeo"
          sufijo="$"
          valor={reglas.redondeo}
          paso={50}
          min={1}
          onChange={set('redondeo')}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
        <div className="text-xs text-[var(--color-muted)]">
          <p className="tabular">
            Base: {moneda(usd)}{' '}
            <span className="text-[var(--color-muted)]">
              ({baseActiva?.label?.toLowerCase()})
            </span>
          </p>
          <p className="tabular">
            Costo al cambio: {costo > 0 ? ars(costo) : '—'}
          </p>
        </div>
        <p className="tabular text-2xl font-bold text-[var(--color-brand-ink)]">
          {sugerido > 0 ? ars(sugerido) : '—'}
        </p>
      </div>
    </section>
  )
}
