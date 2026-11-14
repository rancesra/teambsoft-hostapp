// El mensaje "navegar" (contrato del Host App v1.2, sección 4): un módulo, desde su iframe, le pide al
// cascarón que lleve al usuario a otra ruta. Por ejemplo, Catálogo pide /carrito?agregar={id}.
//
// Cualquier página puede mandarle mensajes a esta ventana con postMessage, así que el Host App no
// obedece a ciegas. Antes de navegar comprueba dos cosas:
//   1. Que el mensaje venga de uno de los tres módulos (su origen, no lo que diga el mensaje).
//   2. Que la ruta sea de un módulo: /catalogo, /busqueda o /carrito.

import { MODULOS } from '@/modulos'

// La ruta tiene que empezar por el prefijo de un módulo, seguido de nada, "/", "?" o "#". Así
// /carrito?agregar=1 pasa, pero /carritos o //otro-sitio.com no.
const RUTA_DE_MODULO = /^\/(catalogo|busqueda|carrito)(?=$|[/?#])/

/**
 * Los orígenes desde los que se aceptan mensajes: el de cada módulo con dirección configurada.
 * El origen es esquema + host + puerto (http://localhost:5173), sin la ruta.
 */
export function origenesDeModulos(modulos = MODULOS) {
  return new Set(modulos.filter((m) => m.url).map((m) => new URL(m.url).origin))
}

/**
 * Decide si un mensaje es un "navegar" válido.
 *
 * @param {MessageEvent} evento el que entrega el navegador.
 * @param {Set<string>} origenes los de {@link origenesDeModulos}.
 * @returns {string | null} la ruta a la que hay que ir, o null si el mensaje se ignora.
 */
export function rutaANavegar(evento, origenes) {
  if (!origenes.has(evento.origin)) return null

  const datos = evento.data
  if (!datos || datos.tipo !== 'navegar' || typeof datos.ruta !== 'string') return null
  if (!RUTA_DE_MODULO.test(datos.ruta)) return null

  return datos.ruta
}

/**
 * La dirección sin el parámetro `agregar`, o null si no lo tiene.
 *
 * "Agregar al carro" navega a /carrito?agregar={id}, y el módulo de Carrito agrega el producto al
 * cargar. Si la barra de direcciones del Host App se quedara con ?agregar=..., recargar la página
 * volvería a cargar el iframe con esa dirección y agregaría otra unidad.
 */
export function direccionSinAgregar(direccion) {
  const url = new URL(direccion)
  if (!url.searchParams.has('agregar')) return null
  url.searchParams.delete('agregar')
  return url.pathname + url.search + url.hash
}

/** Empieza a escuchar los mensajes de los módulos. Se llama una vez, al arrancar el Host App. */
export function escucharNavegacion(router, origenes = origenesDeModulos()) {
  window.addEventListener('message', async (evento) => {
    const ruta = rutaANavegar(evento, origenes)
    if (!ruta) return
    await router.push(ruta)

    // Se quita ?agregar= solo de la barra de direcciones, no de la ruta: el iframe ya se está cargando
    // con él y lo necesita. Con replaceState el enrutador no navega otra vez; se actualiza también su
    // registro del historial ("current") para que atrás y adelante sigan funcionando.
    const limpia = direccionSinAgregar(window.location.href)
    if (limpia) window.history.replaceState({ ...window.history.state, current: limpia }, '', limpia)
  })
}
