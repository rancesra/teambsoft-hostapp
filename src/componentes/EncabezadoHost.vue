<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { ATAJOS, MODULOS } from '@/modulos'
import { cerrarSesion, iniciarSesion, loginDisponible, sesion } from '@/sesion'

const route = useRoute()

// El menú sale de la lista de módulos y de los atajos: un módulo nuevo aparece aquí solo.
const entradas = [...MODULOS.map((m) => ({ nombre: m.nombre, ruta: `/${m.clave}` })), ...ATAJOS]

function coincide(ruta) {
  return route.path === ruta || route.path.startsWith(ruta + '/')
}

// Se marca la entrada más específica: en /carrito/pedidos se marca "Órdenes" y no "Carro".
function activa(entrada) {
  return coincide(entrada.ruta) && !entradas.some((o) => o.ruta.length > entrada.ruta.length && coincide(o.ruta))
}

const esAdmin = computed(() => sesion.usuario?.roles.includes('admin'))
</script>

<template>
  <header class="encabezado">
    <RouterLink to="/" class="marca">
      <span class="logo">◈</span>
      Tienda Virtual
    </RouterLink>

    <nav class="menu">
      <RouterLink
        v-for="e in entradas"
        :key="e.ruta"
        :to="e.ruta"
        :class="{ activa: activa(e) }"
        active-class=""
        exact-active-class=""
      >
        {{ e.nombre }}
      </RouterLink>
    </nav>

    <!-- El login: lleva a la pantalla de Keycloak, que es quien pide usuario y contraseña. -->
    <div v-if="loginDisponible" class="cuenta">
      <template v-if="sesion.usuario">
        <span class="usuario">
          {{ sesion.usuario.nombre }}
          <span v-if="esAdmin" class="etiqueta">admin</span>
        </span>
        <button class="boton-texto" @click="cerrarSesion()">Cerrar sesión</button>
      </template>
      <button v-else class="boton" @click="iniciarSesion()">Iniciar sesión</button>
    </div>
  </header>
</template>

<style scoped>
.encabezado {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 0 24px;
  height: 60px;
  background: var(--superficie);
  border-bottom: 1px solid var(--borde);
  flex-shrink: 0;
}

.marca {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 700;
  font-size: 16px;
  color: var(--texto);
  text-decoration: none;
}

.logo {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--acento), #14b8a6);
  color: #fff;
  display: grid;
  place-items: center;
}

.menu {
  display: flex;
  gap: 24px;
  height: 100%;
}

.menu a {
  display: flex;
  align-items: center;
  color: var(--texto-suave);
  text-decoration: none;
  font-size: 14px;
  border-bottom: 2px solid transparent;
}

/* "activa" marca la entrada en la que estás, incluidas sus subrutas. */
.menu a.activa {
  color: var(--acento);
  font-weight: 600;
  border-bottom-color: var(--acento);
}
.cuenta {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
}

.usuario {
  color: var(--texto);
  display: flex;
  align-items: center;
  gap: 8px;
}

.etiqueta {
  background: var(--acento-suave);
  color: var(--acento);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
}

.boton-texto {
  background: none;
  border: 0;
  color: var(--texto-suave);
  font: inherit;
  cursor: pointer;
  padding: 0;
}

.boton-texto:hover {
  color: var(--acento);
}
</style>
