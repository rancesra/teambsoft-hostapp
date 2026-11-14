# 🏛️ Host App — Cliente Web de la Tienda Virtual

![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=nodedotjs&logoColor=white)

Ingeniería de Software II · Universidad Industrial de Santander (UIS)

Esta es la aplicación que el usuario abre en el navegador: **una sola página** donde se montan los tres módulos de la tienda. Es un cascarón —encabezado, menú, enrutador— sin pantallas de negocio propias.

La comparación que sirve: **Kong es al backend lo que el Host App es al frontend.** Kong es la única puerta a los microservicios; el Host App es la única puerta a los módulos de interfaz.

## Quién construye qué

| Parte | Equipo | Repositorio |
|---|---|---|
| **Host App** (este cascarón) | B | este repositorio |
| Módulo de Catálogo | B | [teambsoft-frontend](https://github.com/rancesra/teambsoft-frontend) |
| Módulo de Búsqueda | A | (del Equipo A) |
| Módulo de Carrito | C | (del Equipo C) |

El Host App quedó a cargo del Equipo B por acuerdo de los tres equipos.

## 📄 Antes de programar: el contrato

**[CONTRATO-HOSTAPP.md](CONTRATO-HOSTAPP.md)** — es el documento que tienen que leer los tres equipos. Define:

- El **espacio de rutas** de cada módulo (`/catalogo/*`, `/busqueda/*`, `/carrito/*`)
- **Qué debe exponer** cada módulo para que el cascarón lo monte
- **Qué entrega** el cascarón a los módulos (la sesión del login y la navegación)
- Las **variables de estilo** compartidas, para que las tres partes se vean igual
- La **regla de oro**: cada módulo tiene que funcionar solo, sin el Host App

Si tu módulo no cumple el contrato, no se va a poder integrar. Si el contrato te estorba, dilo en el grupo y se cambia — pero no lo ignores por tu cuenta.

## Estado

- [x] Cascarón: encabezado, menú y enrutador
- [x] Etapa 1 — composición con iframes
- [ ] Etapa 2 — Module Federation
- [x] Módulo de Catálogo integrado
- [x] Mensaje `navegar`: un módulo le pide al cascarón ir a otro módulo (Catálogo → Carrito)
- [x] Login con Keycloak, y la sesión llega a cada módulo con el mensaje `sesion` (contrato v1.3)
- [x] «Órdenes» en el menú: abre el historial de pedidos de Carrito (`/carrito/pedidos`)
- Pruebas automatizadas: **17** (`npm test`)
- [ ] Módulo de Búsqueda integrado — dirección configurada (`5174`); falta que el Equipo A lo tenga corriendo
- [ ] Módulo de Carrito integrado — dirección configurada (`5175`); falta que el Equipo C lo tenga corriendo

## Cómo funciona

El encabezado queda fijo y **cada módulo se carga dentro de un iframe** debajo de él. Cada equipo construye y corre su módulo por su cuenta; el Host App solo necesita saber su dirección.

Esas direcciones están en [`.env.development`](.env.development):

```
VITE_MODULO_CATALOGO=http://localhost:5173
VITE_MODULO_BUSQUEDA=http://localhost:5174
VITE_MODULO_CARRO=http://localhost:5175
VITE_KEYCLOAK_URL=http://localhost:8180/realms/tienda
VITE_KEYCLOAK_CLIENTE=tienda-web
```

**Para conectar un módulo nuevo**, se pone su dirección ahí y se reinicia el Host App. No hay que tocar código.

Si un módulo no tiene dirección, el Host App muestra *"todavía no está conectado"*; si la tiene pero no responde, *"no está disponible"* con un botón para reintentar. Nunca una pantalla en blanco.

**Ir de un módulo a otro.** Un módulo no puede cambiar la dirección del cascarón desde su iframe, así que se lo pide con un mensaje: `window.parent.postMessage({ tipo: 'navegar', ruta: '/carrito?agregar=ID' }, '*')`. El Host App ([src/navegacion.js](src/navegacion.js)) solo lo obedece si viene de la dirección de uno de los tres módulos y si la ruta empieza por `/catalogo`, `/busqueda` o `/carrito`. Así funciona el botón "Agregar al carro" de Catálogo.

**El login.** El botón **Iniciar sesión** del encabezado lleva a la pantalla de Keycloak, que es quien pide usuario y contraseña ([src/sesion.js](src/sesion.js)). Al volver, el Host App le pasa el token a cada módulo con el mensaje `sesion`, solo a la dirección exacta de ese módulo ([src/sesionCompartida.js](src/sesionCompartida.js)). Un módulo puede pedir la sesión con `pedir-sesion` y pedir el login con `iniciar-sesion`. El token dura 5 minutos y se renueva solo. Si se quita `VITE_KEYCLOAK_URL`, el Host App funciona igual, sin botón.

Para probarlo, Keycloak tiene que estar corriendo: `docker compose up -d keycloak` en el [backend](https://github.com/rancesra/teambsoft-backend), o el `docker-compose` de integración. Usuarios de prueba: `admin` / `admin123` (administra el catálogo) y `cliente` / `cliente123`.

Lo que tiene que cumplir cada módulo para encajar está en las secciones 4 y 5 del [contrato](CONTRATO-HOSTAPP.md).

## Cómo ejecutar

```bash
npm install
npm run dev
npm test        # las pruebas: login (PKCE), mensajes de sesión y navegar
```

Se abre en **http://localhost:5050**. El puerto es fijo porque el 5173 lo usa el módulo de Catálogo y los dos corren a la vez.

Para ver algo adentro, el módulo de Catálogo tiene que estar corriendo en otra terminal (`npm run dev` en [teambsoft-frontend](https://github.com/rancesra/teambsoft-frontend)), y para que tenga datos, también el backend.

**Requisito:** Node.js en versión LTS. La instalación paso a paso está en la [guía de inicio del módulo de Catálogo](https://github.com/rancesra/teambsoft-frontend/blob/main/GUIA-INICIO.md), que sirve igual aquí.

### Los tres backends juntos

La carpeta [`integracion/`](integracion/README.md) levanta con un solo comando los backends de Catálogo, Búsqueda y Carrito, con un solo RabbitMQ y un solo Kong en `http://localhost:8000`. Es lo que se usa para probar los tres equipos juntos y para la presentación.

## Cómo trabajar en este repositorio

Mismo flujo que el resto del proyecto: **nunca se trabaja en `main`**, cada tarea en su rama y se entrega con un pull request. Está explicado paso a paso en la [guía de git](https://github.com/rancesra/teambsoft-frontend/blob/main/GUIA-GIT.md).

Los equipos A y C tienen acceso de escritura aquí: registren su módulo en el enrutador con un pull request, no por mensaje de WhatsApp.

## Documentos relacionados

| Documento | Dónde |
|---|---|
| Contrato de Catálogo (v2.5) | [teambsoft-backend](https://github.com/rancesra/teambsoft-backend/blob/main/docs/CONTRATO-CATALOGO.md) |
| Propuesta visual del módulo de Catálogo | [teambsoft-frontend](https://github.com/rancesra/teambsoft-frontend/blob/main/docs/propuesta-visual-catalogo.html) |
| Mockup del módulo dentro del Host App | [teambsoft-frontend](https://github.com/rancesra/teambsoft-frontend/blob/main/docs/mockup-catalogo-hostapp.html) |
