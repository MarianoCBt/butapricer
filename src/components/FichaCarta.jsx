import { useState } from 'react'
import { moneda } from '../utils/format'
import { rarezaColor } from '../utils/rareza'
import { claveImpresion, idiomaDeCodigo } from '../data/ygoprodeck'

/**
 * Agrupa las impresiones por rareza para el desplegable. Los grupos se
 * ordenan por la impresión más cara de cada uno, así las rarezas que
 * importan quedan arriba en vez de mezcladas.
 */
function agruparPorRareza(sets) {
  const grupos = new Map()
  for (const s of sets) {
    const clave = s.rareza || 'Sin rareza'
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push(s)
  }
  const tope = (lista) => Math.max(...lista.map((s) => s.precioUsd || 0))
  return [...grupos.entries()].sort((a, b) => tope(b[1]) - tope(a[1]))
}

function Dato({ etiqueta, valor }) {
  if (valor === null || valor === undefined || valor === '') return null
  return (
    <div className="flex justify-between gap-3 py-1">
      <dt className="text-[var(--color-muted)]">{etiqueta}</dt>
      <dd className="tabular text-right text-[var(--color-ink)]">{valor}</dd>
    </div>
  )
}

function Imagen({ carta, className }) {
  const [sinImagen, setSinImagen] = useState(false)
  if (sinImagen || !carta.imagen) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-3xl ${className}`}
      >
        🃏
      </div>
    )
  }
  return (
    <img
      src={carta.imagen}
      alt={carta.nombre}
      className={`rounded-lg bg-[var(--color-surface-2)] object-contain ${className}`}
      onError={() => setSinImagen(true)}
    />
  )
}

/**
 * Ficha de la carta y selector de IMPRESIÓN.
 *
 * En teléfono va compacta a propósito: miniatura + nombre en una fila, y
 * los datos de la carta (ATK/DEF, atributo…) plegados. Quien consulta un
 * precio quiere el precio, no la ficha técnica; antes había que scrollear
 * media pantalla de foto y datos para llegar al primer número.
 * En escritorio, donde la ficha va en su propia columna, se muestra
 * entera y con la imagen grande.
 */
export default function FichaCarta({ carta, impresion, onCambiarImpresion }) {
  const idioma = impresion ? idiomaDeCodigo(impresion.codigo) : ''

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Encabezado: en mobile miniatura + nombre lado a lado */}
      <div className="flex items-start gap-3 md:block">
        <Imagen
          carta={carta}
          className="aspect-[59/86] w-20 shrink-0 md:mb-4 md:w-full"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold leading-snug text-[var(--color-ink)] md:text-lg">
            {carta.nombre}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">{carta.tipo}</p>
          {impresion && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span
                className="rounded-full px-2 py-0.5 font-semibold"
                style={{
                  color: rarezaColor(impresion.rareza),
                  backgroundColor:
                    'color-mix(in srgb, currentColor 15%, transparent)',
                }}
              >
                {impresion.rareza || 'Sin rareza'}
              </span>
              {idioma && (
                <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[var(--color-muted)]">
                  {idioma}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selector de impresión: el control principal, va antes que nada */}
      <div>
        <label
          htmlFor="impresion"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]"
        >
          Impresión
        </label>
        {carta.sets.length > 0 ? (
          <select
            id="impresion"
            value={impresion ? claveImpresion(impresion) : ''}
            onChange={(e) => onCambiarImpresion(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-brand)]"
          >
            <option value="">Todas (precio general de la carta)</option>
            {agruparPorRareza(carta.sets).map(([rareza, sets]) => (
              <optgroup key={rareza} label={rareza}>
                {sets.map((s, i) => (
                  <option key={`${claveImpresion(s)}-${i}`} value={claveImpresion(s)}>
                    {s.codigo} · {s.setNombre}
                    {s.precioUsd > 0 ? ` — ${moneda(s.precioUsd)}` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        ) : (
          <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-muted)]">
            Esta carta no tiene impresiones cargadas en la base.
          </p>
        )}
      </div>

      {/* Datos de la carta: plegados en mobile, abiertos en escritorio */}
      <details className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)] transition-colors duration-150 hover:text-[var(--color-ink)]">
          Datos de la carta
          <span className="float-right transition-transform duration-150 group-open:rotate-180">
            ▾
          </span>
        </summary>
        <dl className="border-t border-[var(--color-border)] px-3 py-2 text-sm">
          <Dato etiqueta="Raza" valor={carta.raza} />
          <Dato etiqueta="Atributo" valor={carta.atributo} />
          <Dato etiqueta="Nivel / Rango" valor={carta.nivel} />
          <Dato
            etiqueta="ATK / DEF"
            valor={carta.atk !== null ? `${carta.atk} / ${carta.def ?? '—'}` : null}
          />
          <Dato etiqueta="Arquetipo" valor={carta.arquetipo} />
          <Dato etiqueta="Passcode" valor={carta.id} />
        </dl>
      </details>
    </div>
  )
}
