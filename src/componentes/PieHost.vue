<script setup>
import { MODULOS } from '@/modulos'

// Quién hace cada parte sale de la lista de módulos, la misma que arma el menú. El Host App lo hace
// el Equipo B, igual que Catálogo.
const autores = MODULOS.map((m) => `${m.nombre}: ${m.equipo}`)
</script>

<template>
  <footer class="pie">
    <span>Tienda Virtual · Ingeniería de Software II · UIS</span>
    <span class="equipos">Host App: Equipo B · {{ autores.join(' · ') }}</span>
  </footer>
</template>

<style scoped>
.pie {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 24px;
  background: var(--superficie);
  border-top: 1px solid var(--borde);
  color: var(--texto-suave);
  font-size: 12px;
  flex-shrink: 0;
}

/* En el celular, la lista de equipos no cabe y le quita espacio al módulo: queda solo la primera línea. */
@media (max-width: 720px) {
  .pie {
    justify-content: center;
    padding: 7px 16px;
  }

  .equipos {
    display: none;
  }
}
</style>
