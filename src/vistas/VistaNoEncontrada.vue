<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="aviso">
    <span class="icono">🧭</span>
    <h2>Esta página no existe</h2>
    <RouterLink class="boton" to="/catalogo">Ir al catálogo</RouterLink>
  </div>
</template>

<style scoped>
.aviso {
  text-align: center;
  margin: 80px auto;
  color: var(--texto-suave);
}

.icono {
  font-size: 34px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.6;
}

h2 {
  font-size: 19px;
  color: var(--texto);
}
</style>