import { createRouter, createWebHistory } from 'vue-router'

import { MODULOS } from '@/modulos'

// Una ruta por módulo, con todo lo que cuelgue de su prefijo. /catalogo, /catalogo/123 y
// /catalogo/admin caen las tres en la misma vista, que carga el módulo de Catálogo.
const rutasDeModulos = MODULOS.map((modulo) => ({
  path: `/${modulo.clave}/:resto(.*)*`,
  name: modulo.clave,
  component: () => import('@/vistas/VistaModulo.vue'),
  props: { clave: modulo.clave },
}))

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Catálogo es la puerta de entrada: es el único módulo que hoy tiene backend funcionando.
    { path: '/', redirect: '/catalogo' },
    ...rutasDeModulos,
    { path: '/:rutaInvalida(.*)', component: () => import('@/vistas/VistaNoEncontrada.vue') },
  ],
})