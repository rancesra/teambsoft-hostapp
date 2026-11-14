// Cómo le llega la sesión a cada módulo (contrato del Host App v1.3, sección 5).
//
// Cada módulo corre en su iframe, en otro puerto: no puede leer el sessionStorage del Host App ni
// usar provide/inject. Por eso el Host App le manda la sesión con un mensaje, igual que los módulos
// le piden navegar con "navegar":
//
//   Host App → módulo   { tipo: 'sesion', token, usuario }    al cargar el iframe y cada vez que cambia
//   módulo → Host App   { tipo: 'pedir-sesion' }              el módulo la pide cuando le hace falta
//   módulo → Host App   { tipo: 'iniciar-sesion' }            el módulo pide que el usuario inicie sesión
//
// El token se envía SOLO al origen exacto del módulo (el segundo argumento de postMessage): si en
// el iframe hubiera otra página, el navegador no le entrega el mensaje.

import { origenesDeModulos } from '@/navegacion'
import { iniciarSesion, loginDisponible, sesion } from '@/sesion'

/** El mensaje con la sesión actual. Copia los datos: un objeto reactivo de Vue no se puede enviar. */
export function mensajeDeSesion(actual = sesion) {
  return {
    tipo: 'sesion',
    token: actual.token,
    usuario: actual.usuario ? { ...actual.usuario, roles: [...actual.usuario.roles] } : null,
  }
}

/** Le envía la sesión a la ventana de un módulo, solo si sigue mostrando ese origen. */
export function enviarSesion(ventana, origen) {
  ventana?.postMessage(mensajeDeSesion(), origen)
}

/**
 * Decide qué hacer con un mensaje que llegó de un iframe.
 *
 * @returns {'enviar' | 'iniciar' | null} enviar la sesión, llevar al usuario al login, o ignorarlo.
 */
export function pedidoDeSesion(evento, origenes) {
  if (!origenes.has(evento.origin)) return null
  const tipo = evento.data?.tipo
  if (tipo === 'pedir-sesion') return 'enviar'
  if (tipo === 'iniciar-sesion') return 'iniciar'
  return null
}

/** Atiende los pedidos de los módulos. Se llama una vez, al arrancar el Host App. */
export function escucharPedidosDeSesion(origenes = origenesDeModulos()) {
  window.addEventListener('message', (evento) => {
    const pedido = pedidoDeSesion(evento, origenes)
    if (pedido === 'enviar') enviarSesion(evento.source, evento.origin)
    if (pedido === 'iniciar' && loginDisponible && !sesion.token) iniciarSesion()
  })
}
