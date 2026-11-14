import { createApp } from 'vue'

import { escucharNavegacion } from './navegacion'
import { prepararSesion } from './sesion'
import { escucharPedidosDeSesion } from './sesionCompartida'
import './estilos.css'

// Primero la sesión: si el usuario vuelve de Keycloak, se cambia el código por los tokens y se
// corrige la dirección (/sesion?code=... pasa a ser la página en la que estaba).
await prepararSesion()

// El enrutador se importa después a propósito: lee la dirección del navegador en el momento en que
// se crea, y si se creara antes vería /sesion?code=... y mostraría "esta página no existe".
const { default: App } = await import('./App.vue')
const { default: router } = await import('./router')

createApp(App).use(router).mount('#app')

// Los módulos piden ir a otra ruta con el mensaje "navegar" (contrato v1.2, sección 4), y piden la
// sesión o el login con "pedir-sesion" e "iniciar-sesion" (contrato v1.3, sección 5).
escucharNavegacion(router)
escucharPedidosDeSesion()
