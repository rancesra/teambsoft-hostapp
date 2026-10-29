# Lista de integración de un módulo en el Host App

Antes de pedir que tu módulo se conecte, comprueba esto. Las reglas completas están en la sección 4 del [contrato del Host App](../CONTRATO-HOSTAPP.md).

## Los cuatro requisitos

- [ ] **Tiene una dirección fija.** `npm run dev` deja tu módulo corriendo en un puerto (Catálogo usa el 5173, el Host App el 5050). Elige uno que no choque con los demás y que no cambie solo (en Vite: `server.strictPort: true`).
- [ ] **Conserva su prefijo.** Búsqueda responde en `/busqueda/*`; Carrito, en `/carrito/*`. El Host App le pasa la ruta tal cual.
- [ ] **No pinta su encabezado cuando está dentro del Host App.** Usa `const embebido = window.self !== window.top` y `v-if="!embebido"` en tu barra. Cuando corre solo, la sigue mostrando.
- [ ] **Se deja cargar en un iframe.** No envía `X-Frame-Options: DENY` ni `frame-ancestors 'none'`. Compruébalo así (con tu módulo corriendo):

  ```powershell
  curl.exe -I http://localhost:PUERTO