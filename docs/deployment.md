# Despliegue de staging

## Artefacto desplegable

`Dockerfile` produce una sola imagen para toda la aplicación:

1. Instala y compila el frontend con `VITE_API_URL=/api`.
2. Instala el backend y genera Prisma Client.
3. Sirve los archivos compilados desde Express, conservando el fallback de React Router.
4. Aplica las migraciones pendientes antes de abrir el puerto HTTP.
5. Opcionalmente carga la semilla cuando `SEED_DATABASE=true`.

La misma imagen se usa localmente y en el registro de contenedores. Esto evita mantener configuraciones distintas para frontend y API.

## Contrato del entorno

El host debe proporcionar:

- Un servicio Linux capaz de ejecutar una imagen OCI/Docker.
- Puerto HTTP `4000`.
- Volumen persistente montado en `/data` mientras se utilice SQLite.
- HTTPS terminado por el proveedor.
- Reinicio automático cuando falle el proceso o el health check.

Variables requeridas:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Para staging SQLite: `file:/data/staging.db`. |
| `JWT_SECRET` | Secreto aleatorio administrado por el proveedor; mínimo 32 caracteres. |
| `CORS_ORIGIN` | URL HTTPS exacta de staging. |

Variables recomendadas:

| Variable | Valor inicial |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `JWT_EXPIRES_IN` | `8h` |
| `SERVE_FRONTEND` | `true` |
| `FRONTEND_DIST_PATH` | `/app/frontend/dist` |
| `SEED_DATABASE` | `true` solo para un staging demostrativo; `false` si no se deben restablecer los ejemplos al reiniciar. |

El proveedor debe consultar `GET /api/health`. Un `200` confirma que el proceso responde y que Prisma puede acceder a la base.

## Automatización en GitHub

El workflow `.github/workflows/ci.yml` ejecuta:

- Instalaciones reproducibles con `npm ci`.
- Pruebas de integración del backend.
- Pruebas de componentes, lint y build del frontend.
- Flujo E2E completo en Chromium.
- Construcción y publicación de la imagen únicamente después de superar todas las verificaciones.

Las imágenes publicadas usan dos etiquetas:

- `staging`: último commit válido de `main`.
- `sha-<commit>`: versión inmutable para trazabilidad y rollback.

GitHub usa su token temporal para publicar en GHCR; no requiere una contraseña adicional. El paquete debe ser visible para el proveedor o este debe autenticarse en GHCR.

## Conectar un staging remoto

### Render Blueprint

`render.yaml` declara el staging recomendado:

- Servicio Docker `starter` en Virginia.
- Disco persistente de 1 GB montado en `/data`.
- Secreto JWT generado por Render.
- Health check en `/api/health`.
- Seed ejecutado una sola vez después del primer despliegue.
- Despliegues posteriores únicamente cuando los checks de GitHub hayan pasado.

Para crear el servicio, abre el enlace de Blueprint, autoriza a Render para leer el repositorio privado y confirma el servicio y el disco mostrados:

`https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FElViejoH%2FAdidas_LaunchPanel`

Render construye el mismo `Dockerfile` que CI. No es necesario agregar manualmente `JWT_SECRET` ni ejecutar la semilla.

### Proveedor alternativo

1. Crea un servicio desde `ghcr.io/elviejoh/adidas-launch-panel:staging`.
2. Configura el puerto, volumen, health check y variables del contrato anterior.
3. Si el proveedor ofrece un deploy hook, guárdalo en GitHub como el secreto de repositorio `STAGING_DEPLOY_HOOK_URL`.
4. Ejecuta nuevamente el workflow o haz un push a `main`.

Sin ese secreto, CI/CD sigue publicando la imagen validada y omite únicamente la activación del host.

## Rollback

Para volver a una versión anterior, selecciona su etiqueta inmutable `sha-<commit>` en el proveedor y vuelve a desplegar. El volumen `/data` no debe eliminarse durante un rollback. Antes de desplegar una versión que incluya migraciones destructivas, crea una copia del volumen o de la base administrada.
