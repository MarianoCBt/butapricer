const CLAVE = 'buta.pricer.historial'
const MAXIMO = 12

export function leerHistorial() {
  try {
    const raw = localStorage.getItem(CLAVE)
    const lista = raw ? JSON.parse(raw) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

/** Agrega una carta al historial (sin repetir) y devuelve la lista nueva. */
export function guardarEnHistorial(carta) {
  const entrada = {
    id: carta.id,
    nombre: carta.nombre,
    imagenChica: carta.imagenChica,
  }
  const lista = [entrada, ...leerHistorial().filter((c) => c.id !== carta.id)].slice(
    0,
    MAXIMO,
  )
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista))
  } catch {
    /* modo privado: se pierde al cerrar, no rompe nada */
  }
  return lista
}

export default function Historial({ items, onElegir, onLimpiar }) {
  if (!items.length) return null

  return (
    <section className="mt-8">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Consultadas hace poco
        </h3>
        <button
          type="button"
          onClick={onLimpiar}
          className="text-xs text-[var(--color-muted)] transition-colors duration-150 hover:text-[var(--color-ink)]"
        >
          Limpiar
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onElegir(c.id)}
              className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-1 pr-3 text-sm text-[var(--color-muted)] transition-colors duration-150 hover:border-[var(--color-brand)] hover:text-[var(--color-ink)]"
            >
              <img
                src={c.imagenChica}
                alt=""
                loading="lazy"
                className="h-7 w-5 rounded-sm object-contain"
              />
              <span className="max-w-[14rem] truncate">{c.nombre}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
