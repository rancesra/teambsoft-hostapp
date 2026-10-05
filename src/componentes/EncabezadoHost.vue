<script setup>
import { RouterLink } from 'vue-router'

import { MODULOS } from '@/modulos'
</script>

<template>
  <header class="encabezado">
    <RouterLink to="/" class="marca">
      <span class="logo">◈</span>
      Tienda Virtual
    </RouterLink>

    <!-- El menú sale de la lista de módulos: un módulo nuevo aparece aquí solo. -->
    <nav class="menu">
      <RouterLink v-for="m in MODULOS" :key="m.clave" :to="`/${m.clave}`">
        {{ m.nombre }}
      </RouterLink>
    </nav>
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

/* router-link-active marca el módulo en el que estás, incluidas sus subrutas. */
.menu a.router-link-active {
  color: var(--acento);
  font-weight: 600;
  border-bottom-color: var(--acento);
}
</style>