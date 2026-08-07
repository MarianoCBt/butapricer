import { ars as fmtArs, moneda } from '../utils/format'

/**
 * Una fila de precio: descripción a la izquierda, plata a la derecha.
 *
 * Reemplaza a las tablas de varias columnas. En un teléfono de 375px una
 * tabla de 4-5 columnas obliga a scrollear al costado y la columna de ARS
 * —el número que la persona vino a buscar— queda fuera de pantalla. Acá el
 * precio en pesos siempre se ve, y el detalle (USD, moneda original) va
 * abajo en chico.
 */
export default function FilaPrecio({
  titulo,
  subtitulo,
  etiqueta,
  color,
  usd,
  tasaArs,
  destacado = false,
  href,
}) {
  const hayDato = usd > 0
  const Titulo = href ? 'a' : 'span'
  const propsTitulo = href
    ? { href, target: '_blank', rel: 'noreferrer noopener' }
    : {}

  return (
    <li
      className={`flex items-start justify-between gap-3 px-4 py-2.5 ${
        destacado ? 'bg-[var(--color-surface-2)]' : ''
      }`}
    >
      <div className="flex min-w-0 items-start gap-2">
        {color && (
          <span
            className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <div className="min-w-0">
          <p
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${
              destacado ? 'font-semibold' : ''
            } text-[var(--color-ink)]`}
          >
            <Titulo
              {...propsTitulo}
              className={
                href
                  ? 'underline decoration-transparent underline-offset-2 transition-colors duration-150 hover:decoration-[var(--color-brand-ink)]'
                  : undefined
              }
            >
              {titulo}
            </Titulo>
            {etiqueta && (
              <span className="rounded bg-[var(--color-brand-light)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-brand-ink)]">
                {etiqueta}
              </span>
            )}
          </p>
          {subtitulo && (
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">{subtitulo}</p>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`tabular font-semibold ${
            destacado
              ? 'text-base text-[var(--color-brand-ink)]'
              : 'text-[var(--color-ink)]'
          }`}
        >
          {hayDato ? fmtArs(usd * tasaArs) : '—'}
        </p>
        {/* El USD es la referencia real —el precio en pesos sale de
            multiplicarlo por la cotización del momento—, así que va
            destacado en verde y no como texto secundario gris. */}
        <p
          className={`tabular mt-0.5 font-medium ${
            hayDato ? 'text-sm text-[var(--color-usd)]' : 'text-xs text-[var(--color-muted)]'
          }`}
        >
          {hayDato ? moneda(usd) : 'sin dato'}
        </p>
      </div>
    </li>
  )
}
