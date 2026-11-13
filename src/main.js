import { createApp } from 'vue'

import App from './App.vue'
import { escucharNavegacion } from './navegacion'
import router from './router'
import './estilos.css'

createApp(App).use(router).mount('#app')

// Los módulos piden ir a otra ruta con el mensaje "navegar" (contrato v1.2, sección 4).
escucharNavegacion(router)