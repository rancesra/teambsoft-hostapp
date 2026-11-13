# Integración de la Tienda Virtual

Levanta **los tres backends juntos** —Catálogo (B), Búsqueda (A) y Carrito (C)— con sus bases de datos, **un solo RabbitMQ** y **un solo Kong**, tal como lo define el [contrato de Catálogo v2.4](https://github.com/rancesra/teambsoft-backend/blob/main/docs/CONTRATO-CATALOGO.md), sección 10. Lo opera el Equipo B.

Es para probar los tres equipos juntos y para la presentación. Cada equipo sigue teniendo su propio `docker-compose.yml` para desarrollar solo.

## Qué levanta

| Servicio | Equipo | Se construye desde | Base de datos |
|---|---|---|---|
| `catalogo` | B | [teambsoft-backend](https://github.com/rancesra/teambsoft-backend), rama `main` | `catalogo-mongo` (MongoDB 7.0) |
| `busqueda` | A | [Grupoa_Busqueda](https://github.com/Tavolistar/Grupoa_Busqueda), rama `main` | `busqueda-elasticsearch` y `busqueda-redis` |
| `carrito` | C | [PROYECTO-ING-SOFTWARE-II](https://github.com/camiloherrera-dev/PROYECTO-ING-SOFTWARE-II), rama `develop`, imagen `prod` | `carrito-postgres` y `carrito-redis` |
| `rabbitmq` | Compartido | Imagen `rabbitmq:4-management` | — |
| `kong` | Compartido | Imagen `kong:3.9`, con [kong.yml](kong.yml) | — |
| `keycloak` | Compartido | Imagen `keycloak:26.8.0`, con el realm de [keycloak/realm-tienda.json](keycloak/realm-tienda.json) | — (no guarda nada entre reinicios) |

Cada servicio tiene **su propia base de datos**: nadie lee la base de otro. Se hablan solo por Kong (REST) o por RabbitMQ (eventos).

**Hacia afuera solo se publican tres puertos:**

| Puerto | Qué es |
|---|---|
| `8000` | Kong: `/api/catalogo`, `/api/busqueda` y `/api/carrito` |
| `8180` | Keycloak: la pantalla de login y su consola (`/admin`), solo desde este computador |
| `15672` | Consola web de RabbitMQ, solo desde este computador |

Las bases de datos y los servicios no se ven desde afuera. Así, aunque Búsqueda y Carrito usen los dos el puerto 3000 por dentro, no chocan.

## Cómo levantarlo

Necesitas Docker Desktop encendido. La primera vez tarda varios minutos, porque construye los tres backends desde GitHub.

**1. Crea tu `.env`** a partir del ejemplo, en esta carpeta:

```bash
cp .env.example .env
```

```powershell
Copy-Item .env.example .env
```

**2. Llénalo** con las credenciales que te pasa el Equipo B por el canal privado: `RABBITMQ_USER`, `RABBITMQ_PASSWORD` y `JWT_SECRET`. El `.env` no se sube a GitHub.

**3. Levántalo.** El comando es el mismo en Mac y en Windows:

```bash
docker compose up -d --build --wait
```

`--wait` espera a que los servicios estén sanos. Cuando termina, todos deben decir `Healthy`.

**4. Comprueba** que Kong responde con un producto de prueba:

```bash
curl http://localhost:8000/api/catalogo/productos/674000000000000000000001
```

```powershell
Invoke-RestMethod http://localhost:8000/api/catalogo/productos/674000000000000000000001
```

Debe responder la *Camiseta básica algodón*, con `stock: 100` y `activo: true`.

## Los productos de prueba

Catálogo arranca con el perfil `integracion` y crea seis productos **con ids fijos, iguales en todas las máquinas** (contrato de Catálogo, sección 10.5). Los equipos pueden escribir sus pruebas contra ellos:

| Id | Producto | Stock | Activo | Para probar |
|---|---|---|---|---|
| `674000000000000000000001` | Camiseta básica algodón | 100 | sí | Una compra normal |
| `674000000000000000000002` | Jean clásico azul | 50 | sí | Varios productos y descuentos |
| `674000000000000000000003` | Lámpara de escritorio LED | 3 | sí | `409 STOCK_INSUFICIENTE` |
| `674000000000000000000004` | Juego de sábanas doble | 0 | sí | Activo sin stock |
| `674000000000000000000005` | Audífonos inalámbricos | 20 | sí | Otra categoría |
| `674000000000000000000006` | Teclado mecánico | 10 | **no** | Producto desactivado |

Si ya existen, no se vuelven a crear: lo que se compró en una prueba sigue comprado después de reiniciar. Para **volver a los datos iniciales** hay que borrar los volúmenes (ver abajo).

## Los frontends

No van en el compose. Cada equipo corre el suyo con `npm run dev`, en su puerto fijo, y llama a Kong en `http://localhost:8000`:

| Módulo | Puerto |
|---|---|
| Catálogo | `5173` |
| Búsqueda | `5174` |
| Carrito | `5175` |
| Host App | `5050` |

Kong solo acepta llamadas del navegador desde esos cuatro orígenes (CORS, en [kong.yml](kong.yml)). Si un frontend corre en otro puerto, el navegador bloquea sus llamadas.

**Catálogo** se arranca contra Kong: `KONG_URL=http://localhost:8000 npm run dev` (en PowerShell, `$env:KONG_URL="http://localhost:8000"; npm run dev`).

## El login (Keycloak)

El Host App tiene el botón **Iniciar sesión**, que lleva a la pantalla de Keycloak, y le pasa el token a cada módulo con el mensaje `sesion` (contrato del Host App v1.3, sección 5). Usuarios de prueba del realm `tienda`:

| Usuario | Contraseña | Roles | Para probar |
|---|---|---|---|
| `admin` | `admin123` | `admin`, `cliente` | La administración del catálogo |
| `cliente` | `cliente123` | `cliente` | Comprar; la administración le responde `403` |

Son **solo de desarrollo**: el realm se vuelve a importar en cada arranque. La consola de Keycloak está en http://localhost:8180/admin (usuario y clave `admin` / `admin`, o los que pongas en `KEYCLOAK_ADMIN` y `KEYCLOAK_ADMIN_PASSWORD`).

Para pedir un token sin navegador, por ejemplo para probar con curl o Postman, está el cliente `tienda-pruebas`:

```bash
curl -s -d grant_type=password -d client_id=tienda-pruebas -d username=admin -d password=admin123 http://localhost:8180/realms/tienda/protocol/openid-connect/token
```

```powershell
Invoke-RestMethod -Method Post http://localhost:8180/realms/tienda/protocol/openid-connect/token -Body @{grant_type="password"; client_id="tienda-pruebas"; username="admin"; password="admin123"}
```

El `access_token` de la respuesta va en la cabecera `Authorization: Bearer ...`.

**Carrito:** el token de desarrollo de su frontend (`VITE_DEV_TOKEN`) tiene que estar firmado con el mismo `JWT_SECRET` de este `.env`. Si no, Carrito responde `401`.

## Comandos útiles

| Para | Comando |
|---|---|
| Ver el estado | `docker compose ps` |
| Ver los logs de un servicio | `docker compose logs -f catalogo` |
| Reconstruir uno después de un cambio en su repo | `docker compose up -d --build catalogo` |
| Apagar todo, conservando los datos | `docker compose down` |
| Apagar todo y **borrar los datos** (vuelve a los productos iniciales) | `docker compose down -v` |

### Probar cambios que todavía no están en GitHub

En el `.env`, apunta el servicio a la carpeta de tu repositorio local:

```
CATALOGO_CONTEXTO=C:/Users/tu-usuario/Desktop/teambsoft-backend
```

Después reconstruye ese servicio con `docker compose up -d --build catalogo`.

### Si un puerto ya está ocupado

Si otro programa usa el `8000` o el `15672`, cámbialos en el `.env` con `KONG_PUERTO` y `RABBIT_CONSOLA_PUERTO`. Si cambias el de Kong, los frontends tienen que apuntar al nuevo.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| `Define RABBITMQ_USER en .env` | No creaste el `.env`, o le falta ese valor |
| Un servicio queda `unhealthy` | Revisa sus logs: `docker compose logs <servicio>` |
| Kong responde `502` o `503` en una ruta | Ese backend no está arriba; las otras rutas siguen funcionando |
| Carrito responde `401` | El token no está firmado con el `JWT_SECRET` de este `.env` |
| Búsqueda no encuentra los productos de prueba | Su consumidor tiene que escuchar `catalogo.eventos` con `producto.*` (contrato de Catálogo, sección 6.4) |
| El navegador dice *CORS* | El frontend no está en uno de los cuatro puertos de la tabla |
