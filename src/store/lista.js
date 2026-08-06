// =====================================================================
//  Lista de compra.
//
//  Sirve para cuando alguien viene a vender cartas: se van agregando una
//  por una con el precio que se le pone a cada una, y al final queda el
//  total con un descuento opcional.
//
//  Los precios se guardan YA EN PESOS, congelados en el momento de
//  agregarlos. Es a propósito: si guardáramos dólares y multiplicáramos
//  por la cotización del día, una lista armada ayer cambiaría sola de
//  total. Lo que se pactó, se pactó.
// =====================================================================

import { useCallback, useEffect, useState } from 'react'

const CLAVE = 'buta.pricer.lista'
const CLAVE_DESCUENTO = 'buta.pricer.descuento'

function leer(clave, porDefecto) {
  try {
    const raw = localStorage.getItem(clave)
    if (!raw) return porDefecto
    const valor = JSON.parse(raw)
    return valor ?? porDefecto
  } catch {
    return porDefecto
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    /* modo privado o sin espacio: se pierde al cerrar, no rompe nada */
  }
}

/** Id propio del ítem: la misma carta puede entrar varias veces. */
function nuevoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useLista() {
  const [items, setItems] = useState(() => {
    const lista = leer(CLAVE, [])
    return Array.isArray(lista) ? lista : []
  })
  const [descuento, setDescuento] = useState(() => Number(leer(CLAVE_DESCUENTO, 0)) || 0)

  useEffect(() => guardar(CLAVE, items), [items])
  useEffect(() => guardar(CLAVE_DESCUENTO, descuento), [descuento])

  const agregar = useCallback((item) => {
    setItems((prev) => [...prev, { ...item, id: nuevoId() }])
  }, [])

  const quitar = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const vaciar = useCallback(() => {
    setItems([])
    setDescuento(0)
  }, [])

  const subtotal = items.reduce((a, i) => a + (Number(i.precioArs) || 0), 0)
  // El descuento es un % sobre el subtotal, acotado a 0-100 para que un
  // número mal tipeado no dé un total negativo o inflado.
  const pct = Math.min(100, Math.max(0, Number(descuento) || 0))
  const ahorro = Math.round((subtotal * pct) / 100)
  const total = subtotal - ahorro

  return {
    items,
    cantidad: items.length,
    agregar,
    quitar,
    vaciar,
    descuento,
    setDescuento,
    subtotal,
    ahorro,
    total,
  }
}
