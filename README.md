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
- **Qué entrega** el cascarón a los módulos (sesión y navegación)
- Las **variables de estilo** compartidas, para que las tres partes se vean igual
- La **regla de oro**: cada módulo tiene que funcionar solo, sin el Host App

Si tu módulo no cumple el contrato, no se va a poder integrar. Si el contrato te estorba, dilo en el grupo y se cambia — pero no lo ignores por tu cuenta.

## Estado

- [x] Cascarón: encabezado, menú y enrutador
- [x] Etapa 1 — composición con iframes
- [ ] Etapa 2 — Module Federation
- [x] Módulo de Catálogo integrado
- [x] Mensaje `navegar`: un módulo le pide al cascarón ir a otro módulo (Catálogo → Carrito)
- [ ] Módulo de Búsqueda integrado — dirección configurada (`5174`); falta que el Equipo A lo tenga corriendo
- [ ] Módulo de Carrito integrado — dirección configurada (`5175`); falta que el Equipo C lo tenga corriendo

## Cómo funciona

El encabezado queda fijo y **cada módulo se carga dentro de un iframe** debajo de él. Cada equipo construye y corre su módulo por su cuenta; el Host App solo necesita saber su dirección.

Esas direcciones están en [`.env.development`](.env.development):

```
VITE_MODULO_CATALOGO=http://localhost:5173
VITE_MODULO_BUSQUEDA=http://localhost:5174
VITE_MODULO_CARRO=http://localhost:5175
```

**Para conectar un módulo nuevo**, se pone su dirección ahí y se reinicia el Host App. No hay que tocar código.

Si un módulo no tiene dirección, el Host App muestra *"todavía no está conectado"*; si la tiene pero no responde, *"no está disponible"* con un botón para reintentar. Nunca una pantalla en blanco.

**Ir de un módulo a otro.** Un módulo no puede cambiar la dirección del cascarón desde su iframe, así que se lo pide con un mensaje: `window.parent.postMessage({ tipo: 'navegar', ruta: '/carrito?agregar=ID' }, '*')`. El Host App ([src/navegacion.js](src/navegacion.js)) solo lo obedece si viene de la dirección de uno de los tres módulos y si la ruta empieza por `/catalogo`, `/busqueda` o `/carrito`. Así funciona el botón "Agregar al carro" de Catálogo.

Lo que tiene que cumplir cada módulo para encajar está en la sección 4 del [contrato](CONTRATO-HOSTAPP.md).

## Cómo ejecutar

```bash
npm install
npm run dev
```

Se abre en **http://localhost:5050**. El puerto es fijo porque el 5173 lo usa el módulo de Catálogo y los dos corren a la vez.

Para ver algo adentro, el módulo de Catálogo tiene que estar corriendo en otra terminal (`npm run dev` en [teambsoft-frontend](https://github.com/rancesra/teambsoft-frontend)), y para que tenga datos, también el backend.

**Requisito:** Node.js en versión LTS. La instalación paso a paso está en la [guía de inicio del módulo de Catálogo](https://github.com/rancesra/teambsoft-frontend/blob/main/GUIA-INICIO.md), que sirve igual aquí.

## Cómo trabajar en este repositorio

Mismo flujo que el resto del proyecto: **nunca se trabaja en `main`**, cada tarea en su rama y se entrega con un pull request. Está explicado paso a paso en la [guía de git](https://github.com/rancesra/teambsoft-frontend/blob/main/GUIA-GIT.md).

Los equipos A y C tienen acceso de escritura aquí: registren su módulo en el enrutador con un pull request, no por mensaje de WhatsApp.

## Documentos relacionados

| Documento | Dónde |
|---|---|
| Contrato de Catálogo (v2.2) | [teambsoft-backend](https://github.com/rancesra/teambsoft-backend/blob/main/docs/CONTRATO-CATALOGO.md) |
| Propuesta visual del módulo de Catálogo | [teambsoft-frontend](https://github.com/rancesra/teambsoft-frontend/blob/main/docs/propuesta-visual-catalogo.html) |
| Mockup del módulo dentro del Host App | [teambsoft-frontend](https://github.com/rancesra/teambsoft-frontend/blob/main/docs/mockup-catalogo-hostapp.html) |
