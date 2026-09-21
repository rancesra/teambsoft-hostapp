# Contrato del Host App — Cliente Web

**Versión:** 1.0
**Fecha:** 2026-09-21
**Equipo responsable:** Equipo B (Catálogo)
**Consumido por:** Equipo A (Búsqueda), Equipo C (Carrito)

Este documento es al frontend lo que los contratos de servicio son al backend: define **la superficie de integración** entre el cascarón y cada módulo. No dice cómo debe estar hecho cada módulo por dentro — eso es asunto de cada equipo.

## 1. Qué es el Host App y qué no es

El Host App es la aplicación que el usuario abre en el navegador. Es **un cascarón**: encabezado, navegación, enrutador y los espacios donde se montan los módulos.

| El Host App **sí** hace | El Host App **no** hace |
|---|---|
| Encabezado, menú y disposición general | Pantallas de negocio |
| Decidir qué módulo atiende cada ruta | Llamar a ningún microservicio |
| Definir las variables de estilo compartidas | Guardar datos de negocio |
| Entregar la sesión a los módulos | Validar reglas de negocio |

Si el Host App llama a un endpoint de Catálogo, Búsqueda o Carrito, algo se hizo mal: esa llamada le toca al módulo correspondiente.

## 2. Espacio de rutas

Cada módulo es dueño de un prefijo y **no debe pintar nada fuera de él**.

| Prefijo | Módulo | Equipo |
|---|---|---|
| `/catalogo/*` | Catálogo | B |
| `/busqueda/*` | Búsqueda | A |
| `/carrito/*` | Carrito | C |
| `/` | Redirige a `/catalogo` | Host App |

Las rutas que cada módulo declara son **relativas a su prefijo**: el módulo declara `''` y `':id'`, y el Host App las monta bajo `/catalogo`. Así, si mañana el prefijo cambia, ningún módulo se entera.

## 3. La regla de oro

> **Cada módulo tiene que funcionar solo, sin el Host App.**

`npm run dev` en el repositorio de un módulo debe abrir ese módulo completo y usable. No es un capricho:

- Nadie queda bloqueado esperando a otro equipo.
- Cada uno prueba lo suyo de verdad, contra sus endpoints reales.
- Si el día de la sustentación la integración falla, hay plan B: se muestran los tres módulos por separado y se explica el mecanismo. Es mucho mejor que quedarse sin nada.

En la práctica, esto significa que el módulo **no puede asumir que la sesión, la navegación del cascarón o los estilos globales existen**. Ver sección 5.

## 4. Cómo se integra cada módulo

Se hace en dos etapas. La etapa 1 tiene que estar funcionando antes de intentar la 2.

### Etapa 1 — Composición por rutas (obligatoria)

Cada módulo se construye y se sirve por su cuenta; el Host App enlaza a él. Es lo que garantiza que haya algo que mostrar.

Requisito para los módulos: que el proyecto funcione servido **bajo un sub-path**, no solo en la raíz. En Vite se logra con la opción `base`:

```js
// vite.config.js
export default defineConfig({
  base: process.env.BASE_URL ?? '/',
})
```

### Etapa 2 — Module Federation

El Host App carga los módulos en caliente y comparte con ellos Vue y el enrutador. Cada módulo debe exponer **dos cosas**:

| Qué expone | Nombre | Qué es |
|---|---|---|
| Sus rutas | `./rutas` | Exportación por defecto: un arreglo de rutas de Vue Router, **relativas al prefijo** |
| Su pieza del encabezado (opcional) | `./Encabezado` | Un componente de Vue que el Host App monta en el encabezado. Búsqueda pondría ahí su barra; Carrito, su contador |

Configuración del lado del módulo:

```js
// vite.config.js del módulo
import federation from '@originjs/vite-plugin-federation'

federation({
  name: 'catalogo',                       // 'busqueda' / 'carrito'
  filename: 'remoteEntry.js',
  exposes: {
    './rutas': './src/rutas.js',
    './Encabezado': './src/Encabezado.vue' // solo si el módulo aporta algo al encabezado
  },
  shared: ['vue', 'vue-router']
})
```

Y `src/rutas.js` exporta algo con esta forma:

```js
export default [
  { path: '',      name: 'catalogo-listado', component: () => import('./vistas/Listado.vue') },
  { path: ':id',   name: 'catalogo-detalle', component: () => import('./vistas/Detalle.vue') },
]
```

**`shared` es obligatorio** para `vue` y `vue-router`: si cada módulo trae su propia copia de Vue, la aplicación falla en tiempo de ejecución con errores que no dicen nada útil.

## 5. Qué le entrega el Host App a los módulos

Se entrega con `provide` / `inject` de Vue. **El módulo debe funcionar si no está** (regla de oro): si `inject` devuelve `undefined`, es que el módulo corre solo.

| Clave | Qué es | Si no está |
|---|---|---|
| `sesion` | `{ token, userId }` del usuario, o `null` si no ha iniciado sesión | El módulo asume que no hay sesión |
| `navegar` | Función para ir a otra ruta, incluso de otro módulo | El módulo usa su propio enrutador |

Ejemplo dentro de un componente del módulo:

```js
const sesion = inject('sesion', null)   // el segundo argumento es el valor por defecto
```

El Host App **no** entrega estado de negocio: ni el carrito, ni los productos, ni los resultados de búsqueda. Si un módulo necesita un dato de otro, lo pide al microservicio que corresponda a través de Kong.

## 6. Estilo compartido

El Host App define estas variables en `:root`. **Los módulos las usan con `var(--...)` y no escriben colores a mano**, para que las tres partes se vean como la misma tienda.

| Variable | Valor | Para qué |
|---|---|---|
| `--acento` | `#0F766E` | Botones principales, elementos activos |
| `--texto` | `#1C1917` | Texto normal |
| `--texto-suave` | `#57534E` | Texto secundario |
| `--borde` | `#E7E5E4` | Bordes y separadores |
| `--fondo` | `#FAFAF9` | Fondo de la página |
| `--superficie` | `#FFFFFF` | Tarjetas, paneles |
| `--ok` | `#15803D` | Éxito, disponible |
| `--aviso` | `#B45309` | Advertencias |
| `--error` | `#B91C1C` | Errores |
| `--radio` | `8px` / `12px` | Botones y campos / tarjetas |
| `--sombra` | `0 4px 14px rgba(28,25,23,.08)` | Elevación de tarjetas |

Tipografía: la del sistema (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). No se descarga ninguna fuente.

**Aislamiento:** cada módulo usa `<style scoped>` en sus componentes. Las clases globales que no se puedan evitar van con el prefijo del módulo (`catalogo-`, `busqueda-`, `carrito-`). Sin esto, los estilos de un módulo se filtran a los otros.

## 7. Versiones alineadas

Los tres módulos y el Host App tienen que usar la **misma versión mayor y menor de Vue**. La fija el Host App en su `package.json` cuando se cree, y se anuncia en el grupo. Cambiarla es un acuerdo entre los tres equipos, no una decisión de un módulo.

Node.js en versión LTS.

## 8. Fuera de alcance en esta entrega

- **Autenticación real.** Keycloak no está integrado, igual que en los tres contratos de servicio. El Host App entrega `sesion` con un token simulado.
- **Estado global compartido entre módulos** más allá de `sesion`.
- **Despliegue del Host App** en un servidor: por ahora corre local.
- **Comunicación directa entre módulos.** Si Catálogo necesita avisarle algo al Carrito, se hace por navegación o por el backend, no por eventos del navegador. Esto se puede revisar si aparece un caso real.

## 9. Lo que falta acordar

- **El botón “Agregar al carro” en la vista de detalle de Catálogo.** Hoy el módulo de Catálogo deja un espacio reservado. Falta decidir si lo pinta Catálogo y emite algo, o si el Host App monta ahí un componente del módulo de Carrito (el mismo mecanismo de `./Encabezado`, pero para ese espacio).
- **Qué se muestra en `/`**: hoy redirige a `/catalogo` por ser el único módulo con backend funcionando. Si alguien quiere una portada, hay que decidir de quién es.

## 10. Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-09-21 | v1.0 — versión inicial. El Host App queda a cargo del Equipo B por acuerdo de los 3 equipos |
