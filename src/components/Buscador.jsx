import { useEffect, useRef, useState } from 'react'
import { buscarPorNombre, esCodigoDeSet } from '../data/ygoprodeck'

/**
 * Input único: acepta el NOMBRE de la carta (con autocompletado) o el
 * CÓDIGO de la impresión (ej: RA03-SP001). Si es un código no tiene
 * sentido autocompletar por nombre, así que solo espera el Enter.
 */
export default function Buscador({ onElegir, onConsultar, compacto }) {
  const [texto, setTexto] = useState('')
  const [sugerencias, setSugerencias] = useState([])
  const [abierto, setAbierto] = useState(false)
  const [marcado, setMarcado] = useState(-1)
  const contenedor = useRef(null)
  // Cada búsqueda lleva número: si vuelve una vieja tarde, se descarta.
  const pedido = useRef(0)

  const esCodigo = esCodigoDeSet(texto)

  // Autocompletado por nombre, con un respiro de 300 ms al tipear.
  useEffect(() => {
    const q = texto.trim()
    if (q.length < 3 || esCodigo) {
      setSugerencias([])
      return
    }
    const nro = ++pedido.current
    const t = setTimeout(async () => {
      const res = await buscarPorNombre(q, 8)
      if (nro !== pedido.current) return
      setSugerencias(res)
      setAbierto(true)
      setMarcado(-1)
    }, 300)
    return () => clearTimeout(t)
  }, [texto, esCodigo])

  // Cerrar el desplegable al hacer clic afuera.
  useEffect(() => {
    const fuera = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  const elegir = (carta) => {
    setTexto(carta.nombre)
    setAbierto(false)
    setSugerencias([])
    onElegir(carta)
  }

  const enviar = () => {
    const q = texto.trim()
    if (!q) return
    setAbierto(false)
    onConsultar(q)
  }

  const teclas = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (abierto && marcado >= 0 && sugerencias[marcado]) elegir(sugerencias[marcado])
      else enviar()
    } else if (e.key === 'ArrowDown' && sugerencias.length) {
      e.preventDefault()
      setAbierto(true)
      setMarcado((i) => (i + 1) % sugerencias.length)
    } else if (e.key === 'ArrowUp' && sugerencias.length) {
      e.preventDefault()
      setMarcado((i) => (i <= 0 ? sugerencias.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setAbierto(false)
    }
  }

  return (
    <div ref={contenedor} className="relative w-full">
      <div className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={teclas}
          onFocus={() => sugerencias.length && setAbierto(true)}
          placeholder="Nombre de la carta o código (ej: Dark Magician o RA03-EN001)"
          aria-label="Buscar carta por nombre o código"
          className={`min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] transition-colors duration-150 hover:border-[var(--color-brand)] focus:border-[var(--color-brand)] ${
            compacto ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base'
          }`}
        />
        <button
          type="button"
          onClick={enviar}
          disabled={!texto.trim()}
          className={`shrink-0 rounded-lg bg-[var(--color-brand)] font-semibold text-white transition-colors duration-150 hover:bg-[var(--color-brand-dark)] disabled:cursor-not-allowed disabled:opacity-40 ${
            compacto ? 'px-3 py-2 text-sm' : 'px-5 py-3'
          }`}
        >
          Buscar
        </button>
      </div>

      {esCodigo && (
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Parece un código de impresión — presioná Enter para buscarlo.
        </p>
      )}

      {abierto && sugerencias.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl shadow-black/40"
          style={{ animation: 'panel-in 120ms ease-out' }}
        >
          {sugerencias.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseEnter={() => setMarcado(i)}
                onClick={() => elegir(c)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 ${
                  i === marcado
                    ? 'bg-[var(--color-brand-light)]'
                    : 'hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <img
                  src={c.imagenChica}
                  alt=""
                  loading="lazy"
                  className="h-12 w-9 shrink-0 rounded object-contain"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-[var(--color-ink)]">
                    {c.nombre}
                  </span>
                  <span className="block truncate text-xs text-[var(--color-muted)]">
                    {c.tipo}
                    {c.sets.length > 0 && ` · ${c.sets.length} impresiones`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
