import { useState } from 'react'
import { TIENDAS } from '../config'

export function tiendaPorId(id) {
  return TIENDAS.find((t) => t.id === id) || null
}

/**
 * Marca de una tienda. Dos variantes, que NO son intercambiables:
 *
 *  - por defecto (`logos`): la bandera ancha con el nombre escrito. Va sola,
 *    en el bloque "Comparar en"; poner el nombre al lado quedaría duplicado.
 *  - `icono` (`iconos`, normalmente el favicon del sitio): el isotipo
 *    cuadrado. Se usa con `conTexto` para acompañar al nombre en los
 *    encabezados que declaran de dónde salen los datos.
 *
 * En las dos, las fuentes son CANDIDATOS: si un archivo no está se prueba el
 * siguiente, y si no hay ninguno queda el nombre en texto. Así la fuente
 * siempre se lee, con imagen o sin ella, y nunca queda un ícono roto.
 */
export default function LogoTienda({
  tienda,
  icono = false,
  conTexto = false,
  alto = 'h-5',
  altoCuadrado = 'h-6',
  claseTexto = 'font-semibold',
}) {
  const [intento, setIntento] = useState(0)
  const [cuadrado, setCuadrado] = useState(icono)

  if (!tienda) return null

  const fuentes = (icono ? tienda.iconos : tienda.logos) || []
  const src = fuentes[intento]

  const texto = (
    <span className={claseTexto} style={src && conTexto ? undefined : { color: tienda.color }}>
      {tienda.label}
    </span>
  )

  if (!src) return texto

  const img = (
    <img
      src={src}
      alt={conTexto ? '' : tienda.label}
      // Los logos anchos y los isotipos cuadrados no pueden ir a la misma
      // altura: el cuadrado quedaría diminuto al lado de uno ancho. Se
      // detecta solo por la proporción del archivo.
      className={`w-auto max-w-28 shrink-0 object-contain ${
        cuadrado ? altoCuadrado : alto
      } ${tienda.fondoClaro && !icono ? 'rounded bg-white/90 px-1 py-0.5' : ''}`}
      onLoad={(e) => {
        const { naturalWidth: w, naturalHeight: h } = e.currentTarget
        if (h > 0) setCuadrado(w / h < 1.6)
      }}
      onError={() => setIntento((i) => i + 1)}
    />
  )

  if (!conTexto) return img

  return (
    <span className="inline-flex items-center gap-1.5">
      {img}
      {texto}
    </span>
  )
}
