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

/**
 * Imagen + datos de la carta y, debajo, el selector de IMPRESIÓN.
 * La impresión importa: el precio de una Secret Rare y el de la misma
 * carta en Common no tienen nada que ver.
 */
export default function FichaCarta({ carta, impresion, onCambiarImpresion }) {
  const [sinImagen, setSinImagen] = useState(false)
  const idioma = impresion ? idiomaDeCodigo(impresion.codigo) : ''

  return (
    <div className="flex flex-col gap-4">
      {/* En mobile la ficha ocupa todo el ancho: sin tope, la carta se
          estiraría a ~700px de alto y taparía la tabla de precios. */}
      <div className="mx-auto w-full max-w-[13rem] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] md:max-w-none">
        {sinImagen || !carta.imagen ? (
          <div className="flex aspect-[59/86] items-center justify-center text-5xl">
            🃏
          </div>
        ) : (
          <img
            src={carta.imagen}
            alt={carta.nombre}
            className="aspect-[59/86] w-full object-contain"
            onError={() => setSinImagen(true)}
          />
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold leading-snug text-[var(--color-ink)]">
          {carta.nombre}
        </h2>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">{carta.tipo}</p>
      </div>

      <dl className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
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

      {/* Selector de impresión */}
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
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-brand)]"
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

        {impresion && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span
              className="rounded-full px-2 py-0.5 font-semibold"
              style={{
                color: rarezaColor(impresion.rareza),
                backgroundColor: 'color-mix(in srgb, currentColor 15%, transparent)',
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
  )
}
