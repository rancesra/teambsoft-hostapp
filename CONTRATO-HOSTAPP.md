# Contrato del Host App — Cliente Web

**Versión:** 1.2\
**Fecha:** 2026-11-05\
**Estado:** los cambios de la v1.2 tienen plazo para objetar hasta el **8 de noviembre de 2026**. Si los equipos A y C no objetan antes de esa fecha, quedan acordados.\
**Equipo responsable:** Equipo B (Catálogo)\
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

### Etapa 1 — Composición con iframes (obligatoria)

El encabezado del Host App queda fijo, y **cada módulo se carga dentro de un iframe** debajo de él. Cada módulo se construye, se sirve y se despliega por su cuenta, en su propia dirección; el Host App solo sabe dónde está.

Se eligió así porque es la única forma de tener un cascarón de verdad **sin que ningún equipo tenga que cambiar su configuración de build** ni alinear versiones. Y aísla los estilos sin esfuerzo: lo que un módulo declare en CSS no puede pisar a otro.

**Lo que tiene que cumplir cada módulo**, y nada más:

1. **Estar corriendo en una dirección fija.** El Host App la lee de su archivo `.env.development` (`VITE_MODULO_CATALOGO`, `VITE_MODULO_BUSQUEDA`, `VITE_MODULO_CARRO`). Ese archivo sí se sube al repositorio: son direcciones de desarrollo, no secretos. Si alguien necesita otras en su máquina, las pone en un `.env.development.local`, que git ignora. Cada módulo usa su puerto, con `server.port` y `server.strictPort: true` en su `vite.config.js`, para que Vite no lo cambie solo si está ocupado:

   | Módulo | Puerto | Dirección |
   |---|---|---|
   | Catálogo | `5173` | `http://localhost:5173` |
   | Búsqueda | `5174` | `http://localhost:5174` |
   | Carrito | `5175` | `http://localhost:5175` |
   | Host App | `5050` | `http://localhost:5050` |

   Cada módulo llama a su backend a través del Kong compartido, en `http://localhost:8000` (contrato de Catálogo v2.4, sección 10).
2. **Conservar su prefijo en sus propias rutas.** El Host App le pasa la ruta tal cual: `/carrito/checkout` en el cascarón abre `/carrito/checkout` dentro del módulo de Carro.
3. **No pintar su propio encabezado cuando está dentro del Host App.** Si no, se ven dos. Un módulo sabe que está dentro de un iframe así:

   ```js
   const embebido = window.self !== window.top
   ```

   y oculta su barra con `v-if="!embebido"`. Cuando corre solo, la sigue mostrando: la regla de oro se mantiene.
4. **Dejarse cargar en un iframe.** No enviar la cabecera `X-Frame-Options: DENY` ni una política `frame-ancestors 'none'`. Vite no envía ninguna de las dos por defecto.

Si un módulo no tiene dirección configurada, el Host App muestra *"todavía no está conectado"*; si la tiene pero no responde, muestra *"no está disponible"* con un botón para reintentar. Nunca una pantalla en blanco.

#### Ir de un módulo a otro: el mensaje `navegar`

Un módulo corre dentro de un iframe, en otro puerto, así que no puede cambiar la ruta del cascarón por sí mismo. Cuando necesita llevar al usuario a otro módulo, **se lo pide al Host App** con un mensaje:

```js
// Dentro del módulo, solo si está embebido
window.parent.postMessage({ tipo: 'navegar', ruta: '/carrito?agregar=64f1a2b3c9e77a001f3d8e21' }, '*')
```

El Host App:

1. Solo acepta el mensaje si viene de la dirección de uno de los tres módulos de `.env.development`. Cualquier otro origen se ignora.
2. Solo acepta rutas que empiecen por `/catalogo`, `/busqueda` o `/carrito`.
3. Navega a esa ruta, y el módulo que la atiende se carga con ella, incluida la parte después del `?`.

Así los módulos no se hablan entre sí (sección 8): solo le piden al cascarón que navegue. Es el mismo papel que cumple `navegar` en la etapa 2 (sección 5), pero por mensaje, porque en la etapa 1 no hay `inject`.

Cuando el módulo corre solo, sin el Host App, no hay a quién pedirle que navegue: el módulo decide qué hacer (por ejemplo, ocultar el botón).

**Lo que esta etapa no da**, y por eso existe la etapa 2:

- **La barra de búsqueda y el contador del carrito no van en el encabezado del cascarón.** Viven dentro de sus módulos. Ponerlos arriba, compartidos, es justamente lo que permite `./Encabezado` en la etapa 2.
- **Si el usuario navega dentro del módulo**, la dirección del cascarón no cambia. Entrar directo a `/catalogo/admin` sí funciona; lo que no se actualiza es la barra de direcciones cuando se navega adentro.

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

> **Esto aplica a la etapa 2.** `provide` / `inject` solo funciona cuando todos los módulos viven dentro de la misma aplicación de Vue. En la etapa 1 cada módulo es una aplicación aparte dentro de su iframe, así que **el Host App no les entrega nada**: cada módulo maneja su propia sesión. Como Keycloak no está integrado, hoy eso no le quita nada a nadie.

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

- **Autenticación real.** Keycloak no está integrado, igual que en los tres contratos de servicio. En la etapa 1 cada módulo maneja su propia sesión; el contrato de Carro ya prevé un token simulado para sus pruebas.
- **Estado global compartido entre módulos** más allá de `sesion`.
- **Despliegue del Host App** en un servidor: por ahora corre local.
- **Comunicación directa entre módulos.** Si Catálogo necesita avisarle algo al Carrito, se hace por navegación (el mensaje `navegar` de la sección 4, que va al Host App y no al otro módulo) o por el backend. Un módulo nunca le envía mensajes a otro.

## 9. Decisiones de la v1.2

### 9.1 El botón “Agregar al carro”

| Paso | Quién | Qué hace |
|---|---|---|
| 1 | Catálogo | En la vista de detalle pinta el botón, **solo si el producto está activo, tiene stock y el módulo está embebido** |
| 2 | Catálogo | Al pulsarlo, envía `navegar` con la ruta `/carrito?agregar={id}` (sección 4) |
| 3 | Host App | Valida el mensaje y navega a `/carrito?agregar={id}` |
| 4 | Carrito | Al cargar, si la dirección trae `agregar`, agrega **una unidad** de ese producto con su propio endpoint (`POST /api/carrito/items`) y muestra el carrito |
| 5 | Carrito | Quita `agregar` de la dirección (`history.replaceState`), para que recargar la página no lo agregue otra vez |

**Por qué así:** cada módulo sigue llamando solo a su propio backend, y Catálogo no necesita el token de Carrito, que vive en otro origen. Se descartaron dos opciones:

- **Que Catálogo llame directo a la API de Carrito:** rompe la propiedad de cada módulo sobre su servicio, y necesitaría un token que Catálogo no tiene.
- **Que el Host App monte ahí un componente de Carrito:** necesita Module Federation, que es la etapa 2. Cuando llegue, se puede revisar.

Si Carrito no puede agregar el producto (sin sesión, producto inactivo o sin stock), lo resuelve en su propia pantalla, con sus propios mensajes.

### 9.2 Qué se muestra en `/`

Sigue redirigiendo a `/catalogo`. Una portada propia queda fuera de alcance en esta entrega.

### 9.3 Lo que le toca a cada equipo

| Equipo | Qué ajusta |
|---|---|
| A — Búsqueda | Fijar su frontend en el `5174` y llamar a su backend por Kong (`VITE_API_URL=http://localhost:8000/api/busqueda`). Ocultar su encabezado cuando está embebido (requisito 3) |
| C — Carrito | Fijar su frontend en el `5175`, leer `agregar` al cargar (9.1) y ocultar su encabezado cuando está embebido (requisito 3) |
| B — Catálogo y Host App | El botón y el mensaje `navegar` en Catálogo; recibir y validar `navegar` en el Host App; las direcciones de los tres módulos en `.env.development` |

## 10. Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-09-21 | v1.0 — versión inicial. El Host App queda a cargo del Equipo B por acuerdo de los 3 equipos |
| 2026-10-04 | v1.1 — **La etapa 1 pasa de enlaces a iframes.** En la v1.0 el Host App solo enlazaba a cada módulo, y al pulsar uno se salía del cascarón. Con iframes el encabezado queda fijo y el módulo se carga adentro, sin que ningún equipo cambie su configuración. Se definen los cuatro requisitos que cumple cada módulo y qué muestra el Host App si uno falta o está caído. Se aclara que `provide`/`inject` (sección 5) solo funciona en la etapa 2: en la v1.0 se prometía para todo, y con enlaces o iframes no se puede. Se quita el requisito de `base` en Vite, que con iframes ya no hace falta. La etapa 2 no cambia |
| 2026-11-05 | v1.2 — **Puertos fijos** de los tres módulos y del Host App (requisito 1), y los módulos llaman a su backend por el Kong compartido. **Nuevo mensaje `navegar`** (sección 4) para que un módulo le pida al Host App ir a otro módulo. **Se decide el botón “Agregar al carro”** (sección 9.1): Catálogo navega a `/carrito?agregar={id}` y Carrito agrega al cargar. **`/` sigue redirigiendo a `/catalogo`.** La sección 9 pasa de “Lo que falta acordar” a “Decisiones de la v1.2”. Plazo para objetar: 8 de noviembre de 2026 |
