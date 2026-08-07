import { useState } from 'react'
import { TIENDAS } from '../config'

export function tiendaPorId(id) {
  return TIENDAS.find((t) => t.id === id) || null
}

/**
 * Logo de una tienda, con el nombre en texto como respaldo.
 *
 * `tienda.logos` son candidatos (.svg y .png): si uno no está se prueba el
 * siguiente, y si no hay ninguno se muestra el nombre. Así da igual en qué
 * formato se guarde el archivo y la app nunca queda con un ícono roto.
 *
 * `alto` en clases de Tailwind. Los logos vienen en dos formas: banderas
 * anchas (el nombre escrito) e isotipos cuadrados; con la misma altura el
 * cuadrado queda diminuto al lado de uno ancho, así que se le da un poco más.
 * Se detecta solo por la proporción del archivo.
 */
export default function LogoTienda({
  tienda,
  alto = 'h-5',
  altoCuadrado = 'h-6',
  claseTexto = 'font-semibold',
}) {
  const [intento, setIntento] = useState(0)
  const [cuadrado, setCuadrado] = useState(false)

  if (!tienda) return null
  const src = (tienda.logos || [])[intento]

  if (!src) {
    return (
      <span className={claseTexto} style={{ color: tienda.color }}>
        {tienda.label}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={tienda.label}
      className={`w-auto max-w-28 object-contain ${cuadrado ? altoCuadrado : alto} ${
        tienda.fondoClaro ? 'rounded bg-white/90 px-1 py-0.5' : ''
      }`}
      onLoad={(e) => {
        const { naturalWidth: w, naturalHeight: h } = e.currentTarget
        if (h > 0) setCuadrado(w / h < 1.6)
      }}
      onError={() => setIntento((i) => i + 1)}
    />
  )
}
