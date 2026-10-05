<script setup>
import { RouterView } from 'vue-router'

import EncabezadoHost from '@/componentes/EncabezadoHost.vue'
</script>

<template>
  <!-- El cascarón: el encabezado se queda fijo y debajo se carga el módulo de cada ruta. -->
  <div class="host">
    <EncabezadoHost />
    <main class="contenido">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.host {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Ocupa todo el alto que deja el encabezado, para que el iframe del módulo lo llene. */
.contenido {
  flex: 1;
  min-height: 0;
}
</style>