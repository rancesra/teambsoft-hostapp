// La sesión del usuario (contrato del Host App v1.3, sección 5).
//
// El Host App no guarda contraseñas ni pinta una pantalla de login: lleva al usuario a Keycloak, que
// es quien pregunta usuario y contraseña, y Keycloak lo devuelve aquí con un código. Ese código se
// cambia por un token firmado (un JWT) que dice quién es y qué roles tiene.
//
// Se usa el flujo "authorization code con PKCE", el recomendado para aplicaciones que corren en el
// navegador: como el navegador no puede guardar un secreto, en cada inicio de sesión se inventa uno
// de un solo uso (el verificador) y a Keycloak solo se le muestra su huella (el reto). Si alguien
// intercepta el código en la dirección, no le sirve sin el verificador, que nunca salió de esta pestaña.

import { reactive, readonly } from 'vue'

const EMISOR = import.meta.env.VITE_KEYCLOAK_URL // http://localhost:8180/realms/tienda
const CLIENTE = import.meta.env.VITE_KEYCLOAK_CLIENTE || 'tienda-web'

// La dirección a la que Keycloak devuelve al usuario después de iniciar sesión. Tiene que estar
// registrada en el cliente tienda-web del realm (keycloak/realm-tienda.json del backend).
const RUTA_DE_REGRESO = '/sesion'

// sessionStorage y no localStorage: la sesión dura lo que dura la pestaña. Es el término medio de
// una aplicación sin backend propio; el token igual vence a los 5 minutos y se renueva solo.
const CLAVE_SESION = 'tienda.sesion'
const CLAVE_PKCE = 'tienda.pkce'

const estado = reactive({ token: null, usuario: null })

/** La sesión actual, solo para leer: `{ token, usuario }`, o los dos en null si no hay sesión. */
export const sesion = readonly(estado)

/** ¿Hay Keycloak configurado? Sin VITE_KEYCLOAK_URL el Host App funciona igual, sin botón de login. */
export const loginDisponible = Boolean(EMISOR)

// --- Funciones puras (se prueban en __tests__/sesion.spec.js) ------------------------------------

/** Base64 "para URL": sin +, / ni =, que en una dirección significan otra cosa. */
export function base64Url(bytes) {
  let texto = ''
  for (const b of bytes) texto += String.fromCharCode(b)
  return btoa(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** El secreto de un solo uso de PKCE: 32 bytes al azar. */
export function generarVerificador() {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)))
}

/** La huella del verificador (SHA-256), que es lo único que ve Keycloak al empezar. */
export async function retoDe(verificador) {
  const huella = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificador))
  return base64Url(new Uint8Array(huella))
}

/**
 * Lee lo que dice un token. No comprueba la firma: eso lo hace cada backend con la llave de
 * Keycloak. Aquí solo sirve para mostrar el nombre y saber cuándo vence.
 */
export function leerToken(jwt) {
  const parte = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(parte), (c) => c.charCodeAt(0))
  const datos = JSON.parse(new TextDecoder().decode(bytes))
  return {
    id: datos.sub,
    usuario: datos.preferred_username,
    nombre: datos.name || datos.preferred_username,
    roles: datos.realm_access?.roles ?? [],
    vence: datos.exp * 1000,
  }
}

// --- Inicio y cierre de sesión -------------------------------------------------------------------

function urlDeRegreso() {
  return window.location.origin + RUTA_DE_REGRESO
}

/** Lleva al usuario a la pantalla de login de Keycloak. Al volver, termina en `volverA`. */
export async function iniciarSesion(volverA = window.location.pathname + window.location.search) {
  const verificador = generarVerificador()
  const estadoAleatorio = generarVerificador()
  sessionStorage.setItem(CLAVE_PKCE, JSON.stringify({ verificador, estado: estadoAleatorio, volverA }))

  const parametros = new URLSearchParams({
    client_id: CLIENTE,
    redirect_uri: urlDeRegreso(),
    response_type: 'code',
    scope: 'openid',
    code_challenge: await retoDe(verificador),
    code_challenge_method: 'S256',
    // "state" protege contra que otra página nos mande un código que no pedimos.
    state: estadoAleatorio,
  })
  window.location.assign(`${EMISOR}/protocol/openid-connect/auth?${parametros}`)
}

/** Cierra la sesión aquí y en Keycloak, y vuelve al inicio de la tienda. */
export function cerrarSesion() {
  const guardada = leerGuardada()
  olvidar()
  const parametros = new URLSearchParams({
    client_id: CLIENTE,
    post_logout_redirect_uri: window.location.origin + '/',
  })
  if (guardada?.idToken) parametros.set('id_token_hint', guardada.idToken)
  window.location.assign(`${EMISOR}/protocol/openid-connect/logout?${parametros}`)
}

/**
 * Se llama una vez, antes de montar la aplicación. Si el usuario viene de vuelta de Keycloak,
 * cambia el código por los tokens; si ya tenía sesión en esta pestaña, la recupera.
 */
export async function prepararSesion() {
  if (!loginDisponible) return

  if (window.location.pathname === RUTA_DE_REGRESO) {
    await completarInicioDeSesion()
    return
  }

  const guardada = leerGuardada()
  if (!guardada) return
  if (leerToken(guardada.token).vence > Date.now() + 10_000) {
    aplicar(guardada)
  } else {
    await renovar(guardada.renovacion)
  }
}

async function completarInicioDeSesion() {
  const parametros = new URLSearchParams(window.location.search)
  const pkce = JSON.parse(sessionStorage.getItem(CLAVE_PKCE) || 'null')
  sessionStorage.removeItem(CLAVE_PKCE)
  const volverA = pkce?.volverA || '/'

  try {
    if (!pkce || parametros.get('state') !== pkce.estado || !parametros.get('code')) {
      throw new Error('La respuesta de Keycloak no corresponde a un inicio de sesión de esta pestaña')
    }
    await pedirTokens({
      grant_type: 'authorization_code',
      code: parametros.get('code'),
      redirect_uri: urlDeRegreso(),
      code_verifier: pkce.verificador,
    })
  } catch (error) {
    console.warn('No se pudo completar el inicio de sesión:', error.message)
  } finally {
    // Se quita /sesion?code=... de la barra de direcciones: un código ya usado no sirve, y recargar
    // la página no debe intentar usarlo otra vez.
    window.history.replaceState(null, '', volverA)
  }
}

// --- Tokens --------------------------------------------------------------------------------------

let temporizador = null

async function pedirTokens(campos) {
  const respuesta = await fetch(`${EMISOR}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENTE, ...campos }),
  })
  if (!respuesta.ok) throw new Error(`Keycloak respondió ${respuesta.status}`)
  const datos = await respuesta.json()
  const nueva = { token: datos.access_token, renovacion: datos.refresh_token, idToken: datos.id_token }
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(nueva))
  aplicar(nueva)
}

/** Pide un token nuevo con el de renovación. Si Keycloak ya cerró la sesión, se olvida aquí también. */
async function renovar(renovacion) {
  try {
    await pedirTokens({ grant_type: 'refresh_token', refresh_token: renovacion })
  } catch {
    olvidar()
  }
}

function aplicar({ token, renovacion }) {
  const usuario = leerToken(token)
  estado.token = token
  estado.usuario = { id: usuario.id, usuario: usuario.usuario, nombre: usuario.nombre, roles: usuario.roles }

  // El token dura 5 minutos: se renueva 30 segundos antes de que venza, sin que el usuario lo note.
  clearTimeout(temporizador)
  const espera = Math.max(usuario.vence - Date.now() - 30_000, 5_000)
  temporizador = setTimeout(() => renovar(renovacion), espera)
}

function olvidar() {
  clearTimeout(temporizador)
  sessionStorage.removeItem(CLAVE_SESION)
  estado.token = null
  estado.usuario = null
}

function leerGuardada() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_SESION) || 'null')
  } catch {
    return null
  }
}
