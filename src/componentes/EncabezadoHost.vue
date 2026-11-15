<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { ENTRADAS, entradaDeRuta } from '@/modulos'
import { cerrarSesion, iniciarSesion, loginDisponible, sesion } from '@/sesion'

const route = useRoute()

// Se marca la entrada más específica: en /carrito/pedidos se marca "Órdenes" y no "Carro".
const entradaActiva = computed(() => entradaDeRuta(route.path))

function activa(entrada) {
  return entradaActiva.value?.ruta === entrada.ruta
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
        v-for="e in ENTRADAS"
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
          <span class="nombre">{{ sesion.usuario.nombre }}</span>
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
  white-space: nowrap;
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
  white-space: nowrap;
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

/* En el celular no caben la marca, las cuatro entradas y la cuenta en una fila: sin esto, el menú se
   cortaba en «Carro» y no se alcanzaban «Órdenes» ni «Cerrar sesión». Pasa a dos filas: arriba la
   marca y la cuenta, abajo el menú, que se desliza de lado si no cabe. */
@media (max-width: 720px) {
  .encabezado {
    flex-wrap: wrap;
    height: auto;
    gap: 0 12px;
    padding: 10px 16px 0;
  }

  .cuenta {
    gap: 10px;
    font-size: 13px;
    min-width: 0;
  }

  .usuario {
    min-width: 0;
  }

  /* Un nombre largo se corta con «…» en vez de empujar «Cerrar sesión» fuera de la pantalla. */
  .nombre {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cuenta .boton {
    padding: 7px 12px;
    font-size: 13px;
  }

  .menu {
    order: 1;
    width: 100%;
    height: 44px;
    gap: 20px;
    margin-top: 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }
}
</style>
