<script setup>
import { RouterView } from 'vue-router'

import EncabezadoHost from '@/componentes/EncabezadoHost.vue'
import PieHost from '@/componentes/PieHost.vue'
</script>

<template>
  <!-- El cascarón: el encabezado y el pie se quedan fijos, y entre los dos se carga el módulo de cada ruta. -->
  <div class="host">
    <EncabezadoHost />
    <main class="contenido">
      <RouterView />
    </main>
    <PieHost />
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