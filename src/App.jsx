import { useCallback, useEffect, useMemo, useState } from 'react'
import { config } from './config'
import {
  buscarImpresion,
  buscarPorId,
  claveImpresion,
  resolverConsulta,
} from './data/ygoprodeck'
import { casaPorId, leerCache, traerCotizacion } from './data/cotizacion'
import {
  buscarImpresiones,
  emparejarImpresion,
  promedioVentas,
  traerVentas,
} from './data/tcgplayer'
import { filasDePrecios, resumen as calcularResumen } from './utils/precio'
import Header from './components/Header'
import BarraCotizacion from './components/BarraCotizacion'
import Buscador from './components/Buscador'
import FichaCarta from './components/FichaCarta'
import PreciosImpresion from './components/PreciosImpresion'
import UltimasVentas from './components/UltimasVentas'
import TablaPrecios from './components/TablaPrecios'
import PrecioVenta from './components/PrecioVenta'
import Historial, { guardarEnHistorial, leerHistorial } from './components/Historial'

// ---------------------------------------------------------------------
//  Deep links: la carta consultada vive en el hash, así el link se puede
//  compartir o dejar guardado.  #carta/<passcode>[/<impresión>]
//  La impresión va como `código~rareza` (ver claveImpresion): el código
//  solo no alcanza porque se repite entre rarezas.
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

  const casa = casaPorId(cotizacion, casaId)
  const tasaArs = casa?.venta || 0
  const eurUsd = cotizacion?.eurUsd || 0

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
  const impresion = useMemo(() => {
    const encontrada = buscarImpresion(carta, claveHash)
    if (!encontrada) return null
    return { ...encontrada, ars: encontrada.precioUsd * tasaArs }
  }, [carta, claveHash, tasaArs])

  const cambiarImpresion = (clave) => irACarta(carta.id, clave || null)

  // ---- TCGPlayer: precios por rareza + ventas reales ---------------
  // Va por un proxy (dev: Vite; publicado: Worker). Si no hay proxy todo
  // esto queda vacío y la app sigue andando con YGOPRODeck.
  const [impresionesTcg, setImpresionesTcg] = useState([])
  const [productoTcg, setProductoTcg] = useState(null)
  const [ventas, setVentas] = useState([])
  const [cargandoTcg, setCargandoTcg] = useState(false)
  const [cargandoVentas, setCargandoVentas] = useState(false)

  // Todas las impresiones de la carta en TCGPlayer (una sola vez por carta).
  useEffect(() => {
    let vigente = true
    setImpresionesTcg([])
    if (!carta?.nombre) return
    buscarImpresiones(carta.nombre).then((r) => vigente && setImpresionesTcg(r))
    return () => {
      vigente = false
    }
  }, [carta?.nombre])

  // La impresión elegida -> su producto puntual en TCGPlayer.
  useEffect(() => {
    let vigente = true
    setProductoTcg(null)
    setVentas([])
    if (!impresion) return
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
  useEffect(() => {
    let vigente = true
    setVentas([])
    if (!productoTcg?.productId) return
    setCargandoVentas(true)
    traerVentas(productoTcg.productId).then((v) => {
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

  const promedioVentasUsd = useMemo(
    () => promedioVentas(ventasFiltradas),
    [ventasFiltradas],
  )

  // ---- Cálculos ---------------------------------------------------
  const filas = useMemo(
    () => (carta ? filasDePrecios(carta, eurUsd, tasaArs) : []),
    [carta, eurUsd, tasaArs],
  )
  const resumen = useMemo(() => calcularResumen(filas, tasaArs), [filas, tasaArs])

  const limpiarHistorial = () => {
    localStorage.removeItem('buta.pricer.historial')
    setHistorial([])
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-30">
        <Header onInicio={() => (window.location.hash = '')} />
        <BarraCotizacion
          cotizacion={cotizacion}
          casaId={casaId}
          setCasaId={setCasaId}
          casa={casa}
          cargando={cargandoCotiz}
          onRefrescar={refrescarCotizacion}
        />
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {carta ? (
          <>
            <Buscador compacto onElegir={(c) => irACarta(c.id)} onConsultar={consultar} />

            {error && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div
              className="mt-6 grid gap-6 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]"
              style={{ animation: 'panel-in 160ms ease-out' }}
            >
              <FichaCarta
                carta={carta}
                impresion={impresion}
                onCambiarImpresion={cambiarImpresion}
              />
              <div className="flex flex-col gap-6">
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
                <TablaPrecios
                  filas={filas}
                  resumen={resumen}
                  hayImpresion={Boolean(impresion)}
                />
                <PrecioVenta
                  resumen={resumen}
                  impresion={impresion}
                  productoTcg={productoTcg}
                  promedioVentasUsd={promedioVentasUsd}
                  tasaArs={tasaArs}
                />
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

      <footer className="border-t border-[var(--color-border)] px-4 py-4 text-center text-xs text-[var(--color-muted)]">
        Precios de referencia vía YGOPRODeck · cotización vía dolarapi.com. Los
        valores son orientativos, no ventas cerradas.
      </footer>
    </div>
  )
}
