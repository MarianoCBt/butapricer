import { useCallback, useEffect, useMemo, useState } from 'react'
import { config } from './config'
import {
  buscarImpresion,
  buscarPorId,
  claveImpresion,
  resolverConsulta,
} from './data/ygoprodeck'
import { CASA_MANUAL, casaPorId, leerCache, traerCotizacion } from './data/cotizacion'
import {
  buscarImpresiones,
  emparejarImpresion,
  traerVentas,
} from './data/tcgplayer'
import { useLista } from './store/lista'
import Header from './components/Header'
import BarraCotizacion from './components/BarraCotizacion'
import Buscador from './components/Buscador'
import FichaCarta from './components/FichaCarta'
import PreciosImpresion from './components/PreciosImpresion'
import UltimasVentas from './components/UltimasVentas'
import LinksTiendas from './components/LinksTiendas'
import ModalPrecio from './components/ModalPrecio'
import Footer from './components/Footer'
import Lista from './views/Lista'
import Historial, { guardarEnHistorial, leerHistorial } from './components/Historial'

// ---------------------------------------------------------------------
//  Deep links: la carta consultada vive en el hash, así el link se puede
//  compartir o dejar guardado.  #carta/<passcode>[/<impresión>]
//  La impresión va como `código~rareza` (ver claveImpresion): el código
//  solo no alcanza porque se repite entre rarezas.
//  `#lista` abre la lista armada.
// ---------------------------------------------------------------------
function parseHash(hash) {
  const m = /^#carta\/(\d+)(?:\/(.+))?$/.exec(hash || '')
  if (!m) return { id: null, clave: null }
  return { id: Number(m[1]), clave: m[2] ? decodeURIComponent(m[2]) : null }
}

function armarHash(id, clave) {
  if (!id) return '#'
  return clave ? `#carta/${id}/${encodeURIComponent(clave)}` : `#carta/${id}`
}

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

// Cartas de ejemplo para arrancar (pasan por la misma búsqueda por nombre).
const EJEMPLOS = ['Dark Magician', 'Ash Blossom & Joyous Spring', 'Snake-Eye Ash']

export default function App() {
  const hash = useHash()
  const { id: idHash, clave: claveHash } = useMemo(() => parseHash(hash), [hash])

  // ---- Cotización -------------------------------------------------
  const [cotizacion, setCotizacion] = useState(() => leerCache())
  const [cargandoCotiz, setCargandoCotiz] = useState(false)
  const [casaId, setCasaId] = useState(
    () => localStorage.getItem('buta.pricer.casa') || config.casaDolarPorDefecto,
  )

  const refrescarCotizacion = useCallback(async () => {
    setCargandoCotiz(true)
    setCotizacion(await traerCotizacion())
    setCargandoCotiz(false)
  }, [])

  useEffect(() => {
    refrescarCotizacion()
    const t = setInterval(refrescarCotizacion, config.refreshMinutos * 60_000)
    return () => clearInterval(t)
  }, [refrescarCotizacion])

  useEffect(() => {
    localStorage.setItem('buta.pricer.casa', casaId)
  }, [casaId])

  // "Mi AVG": el dólar al que uno decide cobrar, cargado a mano. No es una
  // cotización, es una decisión de precio, así que va aparte de las casas.
  const [dolarManual, setDolarManual] = useState(
    () => Number(localStorage.getItem('buta.pricer.dolarManual')) || 0,
  )
  useEffect(() => {
    localStorage.setItem('buta.pricer.dolarManual', String(dolarManual))
  }, [dolarManual])

  const esManual = casaId === CASA_MANUAL
  const casa = casaPorId(cotizacion, casaId)
  const blue = casaPorId(cotizacion, 'blue')
  const tasaArs = esManual ? dolarManual : casa?.venta || 0

  // Al pasar a manual por primera vez, arrancamos desde el valor que estaba
  // a la vista en vez de dejar el campo en cero (y toda la app en "—").
  const elegirCasa = (id) => {
    if (id === CASA_MANUAL && !dolarManual) {
      setDolarManual(Math.round(casa?.venta || blue?.venta || 0))
    }
    setCasaId(id)
  }

  // ---- Carta ------------------------------------------------------
  const [carta, setCarta] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [historial, setHistorial] = useState(leerHistorial)

  // El hash manda: cuando cambia, se carga la carta que corresponda.
  useEffect(() => {
    let vigente = true
    if (!idHash) {
      setCarta(null)
      setError('')
      return
    }
    if (carta?.id === idHash) return

    setCargando(true)
    setError('')
    buscarPorId(idHash).then((c) => {
      if (!vigente) return
      setCargando(false)
      if (c) {
        setCarta(c)
        setHistorial(guardarEnHistorial(c))
      } else {
        setCarta(null)
        setError('No encontré esa carta.')
      }
    })
    return () => {
      vigente = false
    }
  }, [idHash, carta?.id])

  const irACarta = useCallback((id, clave) => {
    window.location.hash = armarHash(id, clave)
  }, [])

  // Búsqueda por texto libre (Enter o botón Buscar).
  const consultar = useCallback(
    async (texto) => {
      setCargando(true)
      setError('')
      const r = await resolverConsulta(texto)
      setCargando(false)
      if (!r) {
        setError(`No encontré ninguna carta para "${texto}".`)
        return
      }
      irACarta(r.carta.id, r.impresion ? claveImpresion(r.impresion) : null)
    },
    [irACarta],
  )

  // ---- Impresión elegida ------------------------------------------
  // OJO: esto NO puede depender de `tasaArs`. Si depende, cambiar la
  // cotización recrea el objeto, lo que reinicia los efectos de TCGPlayer y
  // borra las ventas ya traídas sin volver a pedirlas (el productId no
  // cambió, así que su efecto no se vuelve a disparar). La conversión a
  // pesos la hace cada componente, que ya recibe `tasaArs`.
  const impresion = useMemo(
    () => buscarImpresion(carta, claveHash),
    [carta, claveHash],
  )

  const cambiarImpresion = (clave) => irACarta(carta.id, clave || null)

  // ---- TCGPlayer: precios por rareza + ventas reales ---------------
  // Va por un proxy (dev: Vite; publicado: Worker). Si no hay proxy todo
  // esto queda vacío y la app sigue andando con YGOPRODeck.
  const [impresionesTcg, setImpresionesTcg] = useState(null) // null = cargando
  const [productoTcg, setProductoTcg] = useState(null)
  const [ventas, setVentas] = useState([])
  const [cargandoTcg, setCargandoTcg] = useState(false)
  const [cargandoVentas, setCargandoVentas] = useState(false)

  // Todas las impresiones de la carta en TCGPlayer (una sola vez por carta).
  useEffect(() => {
    let vigente = true
    setImpresionesTcg(null)
    if (!carta?.nombre) return
    buscarImpresiones(carta.nombre).then((r) => vigente && setImpresionesTcg(r))
    return () => {
      vigente = false
    }
  }, [carta?.nombre])

  // La impresión elegida -> su producto puntual en TCGPlayer.
  // Espera a que la lista esté cargada (`null` = todavía viene en camino):
  // si no, empareja contra una lista vacía y dispara una búsqueda por código
  // al pedazo, para después rehacer todo cuando llega la lista.
  useEffect(() => {
    let vigente = true
    if (!impresion || impresionesTcg === null) {
      setProductoTcg(null)
      // Mientras viene la lista seguimos "cargando", así no se muestra
      // "no encontré esta impresión" antes de haber buscado.
      setCargandoTcg(Boolean(impresion))
      return
    }
    setCargandoTcg(true)
    emparejarImpresion(impresion, impresionesTcg, carta?.nombre).then((p) => {
      if (!vigente) return
      setCargandoTcg(false)
      setProductoTcg(p)
    })
    return () => {
      vigente = false
    }
  }, [impresion, impresionesTcg, carta?.nombre])

  // Y de ese producto, sus últimas ventas cerradas.
  // Este efecto es el ÚNICO dueño de `ventas`: si otro efecto la limpiaba y
  // después volvía a dejar el mismo productId, acá no se disparaba nada y la
  // lista quedaba vacía para siempre.
  useEffect(() => {
    let vigente = true
    const id = productoTcg?.productId
    if (!id) {
      setVentas([])
      return
    }
    setCargandoVentas(true)
    traerVentas(id).then((v) => {
      if (!vigente) return
      setCargandoVentas(false)
      setVentas(v)
    })
    return () => {
      vigente = false
    }
  }, [productoTcg?.productId])

  // El promedio de ventas sirve para tasar sólo si se compara contra la
  // misma condición: mezclar Near Mint con Damaged da un número inservible.
  // Por eso el filtro vive acá y también alimenta el precio sugerido.
  const [condicionVenta, setCondicionVenta] = useState('todas')

  useEffect(() => {
    const presentes = new Set(ventas.map((v) => v.condicion))
    setCondicionVenta(presentes.has('Near Mint') ? 'Near Mint' : 'todas')
  }, [ventas])

  const ventasFiltradas = useMemo(
    () =>
      condicionVenta === 'todas'
        ? ventas
        : ventas.filter((v) => v.condicion === condicionVenta),
    [ventas, condicionVenta],
  )

  // ---- Lista de compra ---------------------------------------------
  const lista = useLista()
  const [modalAbierto, setModalAbierto] = useState(false)
  const enLista = hash === '#lista'

  const limpiarHistorial = () => {
    localStorage.removeItem('buta.pricer.historial')
    setHistorial([])
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-30">
        <Header
          onInicio={() => (window.location.hash = '')}
          onLista={() => (window.location.hash = '#lista')}
          cantidadLista={lista.cantidad}
        />
        {/* En la lista no va: los precios ya están congelados en pesos desde
            que se agregaron, y tener el selector de dólar arriba hacía creer
            que cambiándolo cambiaban los precios de la lista. */}
        {!enLista && (
        <BarraCotizacion
          cotizacion={cotizacion}
          casaId={casaId}
          setCasaId={elegirCasa}
          casa={casa}
          esManual={esManual}
          dolarManual={dolarManual}
          setDolarManual={setDolarManual}
          referencia={blue}
          tasaArs={tasaArs}
          cargando={cargandoCotiz}
          onRefrescar={refrescarCotizacion}
        />
        )}
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 md:py-6">
        {enLista ? (
          <Lista
            items={lista.items}
            quitar={lista.quitar}
            vaciar={lista.vaciar}
            cambiarPrecio={lista.cambiarPrecio}
            redondear={lista.redondear}
            deshacerRedondeo={lista.deshacerRedondeo}
            hayRedondeo={lista.hayRedondeo}
            descuento={lista.descuento}
            setDescuento={lista.setDescuento}
            subtotal={lista.subtotal}
            ahorro={lista.ahorro}
            total={lista.total}
            onSeguirCargando={() => (window.location.hash = '')}
          />
        ) : carta ? (
          <>
            <Buscador compacto onElegir={(c) => irACarta(c.id)} onConsultar={consultar} />

            {error && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div
              className="mt-4 grid gap-4 md:mt-6 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-6"
              style={{ animation: 'panel-in 160ms ease-out' }}
            >
              <FichaCarta
                carta={carta}
                impresion={impresion}
                onCambiarImpresion={cambiarImpresion}
              />
              <div className="flex flex-col gap-4 md:gap-6">
                <PreciosImpresion
                  impresion={impresion}
                  producto={productoTcg}
                  tasaArs={tasaArs}
                  cargando={cargandoTcg}
                />
                <UltimasVentas
                  ventas={ventas}
                  filtradas={ventasFiltradas}
                  condicion={condicionVenta}
                  setCondicion={setCondicionVenta}
                  tasaArs={tasaArs}
                  cargando={cargandoVentas}
                  hayProducto={Boolean(productoTcg)}
                />
                <LinksTiendas carta={carta} producto={productoTcg} />

                {/* Pegado abajo en el teléfono: se usa cargando una carta
                    atrás de otra, y así no hay que scrollear para agregar. */}
                <div className="sticky bottom-0 z-20 -mx-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(true)}
                    className="min-h-11 w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 font-semibold text-white transition-colors duration-150 hover:bg-[var(--color-brand-dark)]"
                  >
                    Agregar a la lista
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-2xl pt-8 pb-4 text-center">
            <h1 className="text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
              ¿Cuánto vale esta carta?
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
              Compará el precio en TCGPlayer, CardMarket y CoolStuffInc, pasado a
              pesos con la cotización de hoy.
            </p>

            <div className="mt-6 text-left">
              <Buscador onElegir={(c) => irACarta(c.id)} onConsultar={consultar} />
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="py-1 text-xs text-[var(--color-muted)]">
                Probá con:
              </span>
              {EJEMPLOS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => consultar(e)}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)] transition-colors duration-150 hover:border-[var(--color-brand)] hover:text-[var(--color-ink)]"
                >
                  {e}
                </button>
              ))}
            </div>

            <div className="text-left">
              <Historial
                items={historial}
                onElegir={(id) => irACarta(id)}
                onLimpiar={limpiarHistorial}
              />
            </div>
          </div>
        )}

        {cargando && (
          <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
            Buscando…
          </p>
        )}
      </main>

      <Footer />

      <ModalPrecio
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onAgregar={lista.agregar}
        carta={carta}
        impresion={impresion}
        producto={productoTcg}
        ventas={ventasFiltradas}
        casas={cotizacion?.casas || []}
        casaId={casaId}
        setCasaId={elegirCasa}
        esManual={esManual}
        dolarManual={dolarManual}
        setDolarManual={setDolarManual}
        tasaArs={tasaArs}
      />
    </div>
  )
}
