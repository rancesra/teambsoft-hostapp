<script setup>
import { ref, watch } from 'vue'

// Carga un módulo dentro de un iframe. Antes de mostrarlo comprueba que su servidor responda:
// si el iframe apuntara a un servidor apagado, se vería la página de error del navegador dentro
// del cascarón, y el iframe no avisa cuando eso pasa.

const props = defineProps({
  modulo: { type: Object, required: true },
  // La ruta completa que se pidió en el cascarón, por ejemplo /catalogo/admin?activo=false.
  ruta: { type: String, required: true },
})

// 'comprobando' | 'listo' | 'caido' | 'sin-configurar'
const estado = ref('comprobando')

async function comprobar() {
  if (!props.modulo.url) {
    estado.value = 'sin-configurar'
    return
  }
  estado.value = 'comprobando'
  try {
    // mode: 'no-cors' deja hacer la petición a otro origen sin leer la respuesta. No importa lo que
    // conteste: si el servidor está apagado, fetch falla, y eso es justo lo que se quiere saber.
    await fetch(props.modulo.url, { mode: 'no-cors' })
    estado.value = 'listo'
  } catch {
    estado.value = 'caido'
  }
}

watch(() => props.modulo.clave, comprobar, { immediate: true })
</script>

<template>
  <iframe
    v-if="estado === 'listo'"
    :src="modulo.url + ruta"
    :title="`Módulo de ${modulo.nombre}`"
    class="marco"
  ></iframe>

  <div v-else class="aviso">
    <template v-if="estado === 'comprobando'">
      <p>Cargando {{ modulo.nombre }}…</p>
    </template>

    <template v-else-if="estado === 'sin-configurar'">
      <span class="icono">🧩</span>
      <h2>{{ modulo.nombre }} todavía no está conectado</h2>
      <p>
        Es el módulo del {{ modulo.equipo }}. Cuando esté corriendo, se agrega su dirección en el
        archivo <code>.env.development</code> del Host App.
      </p>
    </template>

    <template v-else>
      <span class="icono">📡</span>
      <h2>El módulo de {{ modulo.nombre }} no está disponible</h2>
      <p>
        No responde en <code>{{ modulo.url }}</code>. Comprueba que esté corriendo
        (<code>npm run dev</code> en su repositorio).
      </p>
      <button class="boton" @click="comprobar">Reintentar</button>
    </template>
  </div>
</template>

<style scoped>
.marco {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.aviso {
  max-width: 480px;
  margin: 80px auto;
  text-align: center;
  color: var(--texto-suave);
  padding: 0 16px;
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
  margin: 0 0 8px;
}

p {
  font-size: 14px;
  line-height: 1.6;
}

code {
  background: #f0efed;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
}
</style>