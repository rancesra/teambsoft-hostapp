<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import MarcoModulo from '@/componentes/MarcoModulo.vue'
import { buscarModulo } from '@/modulos'

const props = defineProps({ clave: { type: String, required: true } })
const route = useRoute()

const modulo = computed(() => buscarModulo(props.clave))
</script>

<template>
  <!--
    La ruta del cascarón se pasa tal cual al módulo: /catalogo/admin en el Host App abre
    /catalogo/admin dentro del módulo de Catálogo. Por eso cada módulo conserva su prefijo.
  -->
  <MarcoModulo v-if="modulo" :modulo="modulo" :ruta="route.fullPath" />
</template>