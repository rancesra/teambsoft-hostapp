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

- [ ] Cascarón: encabezado, menú y enrutador
- [ ] Etapa 1 — composición por rutas (enlaza a los tres módulos)
- [ ] Etapa 2 — Module Federation
- [ ] Módulo de Catálogo integrado
- [ ] Módulo de Búsqueda integrado
- [ ] Módulo de Carrito integrado

## Cómo ejecutar

> El proyecto de Vue todavía no existe: lo crea **F1**. Cuando esté, estos son los comandos.

```bash
npm install
npm run dev
```

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
