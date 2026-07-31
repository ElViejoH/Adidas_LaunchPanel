# Adidas Launch Panel

Aplicación web interna para organizar lanzamientos de producto desde su creación hasta su publicación. El proyecto combina un dashboard en React con una API REST en Express, persistencia relacional en SQLite mediante Prisma y autenticación JWT con permisos por rol.

## Alcance del primer entregable

- CRUD de lanzamientos con búsqueda y filtros por mercado, estado y fecha.
- Flujo controlado con aprobación, solicitud de cambios y rechazo auditable.
- Registro auditable de cada transición de estado.
- Gestión de assets asociados a un lanzamiento.
- Vistas conectadas de dashboard, lista, detalle, formulario y calendario.
- Tres roles de demostración: creador, aprobador y administrador.
- Interfaz completa en español e inglés con preferencia persistente.
- Base SQLite y datos semilla listos para desarrollo local.

## Plan técnico

El proyecto está separado en dos aplicaciones independientes para mantener claras las responsabilidades:

1. Crear la estructura base y los archivos de configuración.
2. Preparar Express, CORS, variables de entorno, JWT y middlewares.
3. Definir el esquema relacional con Prisma, migrar SQLite y cargar la semilla.
4. Exponer los endpoints REST y centralizar las reglas de transición en servicios.
5. Construir la base del dashboard en React, Vite y Tailwind CSS.
6. Conectar todas las vistas a la misma API mediante servicios y contexto.
7. Aplicar permisos en la API y reflejarlos en acciones visibles de la interfaz.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React, Vite, React Router, Tailwind CSS, date-fns |
| Backend | Node.js, Express, CORS, dotenv |
| Datos | SQLite, Prisma ORM |
| Seguridad | JWT, hash de contraseñas y autorización por roles |

## Arquitectura del repositorio

```text
adidas-launch-panel/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── prisma/
│   │   └── server.js
│   ├── test/
│   │   └── api.integration.test.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

### Backend, carpeta por carpeta

| Ruta | Responsabilidad |
| --- | --- |
| `backend/prisma/` | Fuente del modelo relacional, migraciones generadas por Prisma y datos semilla. La base local `dev.db` se crea aquí y no se versiona. |
| `backend/test/` | Pruebas de integración HTTP con una base SQLite temporal y aislada. |
| `backend/src/controllers/` | Recibe solicitudes HTTP, delega la lógica y construye las respuestas. |
| `backend/src/routes/` | Declara las rutas REST y encadena autenticación, autorización y controladores. |
| `backend/src/middleware/` | Valida JWT, roles y errores comunes antes de llegar a la lógica de negocio. |
| `backend/src/services/` | Contiene las reglas reutilizables, en especial el flujo de estados y la escritura del historial. |
| `backend/src/utils/` | Utilidades compartidas, errores de aplicación y helpers de seguridad. |
| `backend/src/prisma/` | Expone una única instancia de Prisma Client para toda la API. |
| `backend/src/server.js` | Configura Express, CORS, rutas, manejo de errores y arranque del servidor. |

### Frontend, carpeta por carpeta

| Ruta | Responsabilidad |
| --- | --- |
| `frontend/src/components/` | Piezas reutilizables: navegación, tarjetas, tabla, filtros, badges, timeline y modales. |
| `frontend/src/pages/` | Pantallas de login, dashboard, listado, detalle, formulario, calendario y administración de usuarios. |
| `frontend/src/layouts/` | Estructura compartida del dashboard con sidebar y navbar. |
| `frontend/src/services/` | Cliente HTTP y funciones para consumir autenticación, lanzamientos, assets y usuarios. |
| `frontend/src/context/` | Estado global de autenticación e idioma activo. |
| `frontend/src/hooks/` | Hooks para reutilizar acceso a contexto y lógica de datos. |
| `frontend/src/i18n/` | Catálogos ES/EN, traducción, pluralización y mensajes de error localizados. |
| `frontend/src/utils/` | Formateo de fechas, etiquetas y otras funciones puras. |
| `frontend/src/styles/` | Estilos globales y entrada de Tailwind CSS. |
| `frontend/src/App.jsx` | Enrutamiento principal, rutas privadas y composición de vistas. |
| `frontend/src/main.jsx` | Punto de montaje de React y proveedores globales. |

Las rutas principales de la interfaz son `/login`, `/`, `/launches`, `/launches/new`, `/launches/:id`, `/launches/:id/edit`, `/calendar` y `/users`. Todas excepto `/login` requieren una sesión válida; `/users` es exclusiva de `ADMIN` y las rutas de creación y edición aplican además los permisos de rol y estado.

## Modelo de datos

| Modelo | Campos principales | Relaciones |
| --- | --- | --- |
| `User` | `id`, `name`, `email`, `password`, `role`, `createdAt` | Crea lanzamientos y registra cambios de estado. |
| `Launch` | `id`, `name`, `description`, `market`, `launchDate`, `status`, `creatorId`, timestamps | Pertenece a un creador; contiene assets e historial. |
| `Asset` | `id`, `launchId`, `name`, `type`, `url`, `createdAt` | Pertenece a un lanzamiento. |
| `StatusHistory` | `id`, `launchId`, `previousStatus`, `newStatus`, `changedById`, `comment`, `createdAt` | Relaciona un lanzamiento con el usuario que realizó la transición. |

Los roles válidos son `CREATOR`, `APPROVER` y `ADMIN`. Los estados válidos son `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED` y `REJECTED`.

## Estados y permisos

```text
DRAFT ──enviar revisión──> IN_REVIEW ──aprobar──> APPROVED ──publicar──> PUBLISHED
                               ├──solicitar cambios──> CHANGES_REQUESTED ──reabrir──> DRAFT
                               └──rechazar──────────> REJECTED
```

| Acción | CREATOR | APPROVER | ADMIN |
| --- | --- | --- | --- |
| Consultar lanzamientos, detalle e historial | Todos los no borradores y sus propios borradores | Todos excepto borradores | Todos excepto borradores |
| Crear un lanzamiento | Sí | No | No |
| Editar un lanzamiento | Solo uno propio en `DRAFT` o `IN_REVIEW` | No | No |
| Eliminar un lanzamiento | Solo uno propio en `DRAFT` o `IN_REVIEW` | No | No |
| Enviar a revisión | `DRAFT → IN_REVIEW` | No | No |
| Solicitar cambios | No | `IN_REVIEW → CHANGES_REQUESTED`, con comentario obligatorio | No |
| Reabrir para corregir | `CHANGES_REQUESTED → DRAFT`, solo el propietario | No | No |
| Rechazar | No | `IN_REVIEW → REJECTED`, con comentario obligatorio | No |
| Aprobar | No | `IN_REVIEW → APPROVED` | No |
| Publicar | No | `APPROVED → PUBLISHED` | No |
| Listar usuarios y asignar roles | No | No | Sí |

No se permiten saltos ni retrocesos fuera del grafo definido. `REJECTED` y `PUBLISHED` son terminales. Cada transición se ejecuta de forma transaccional y crea un registro en `StatusHistory` con el usuario responsable; el comentario es obligatorio para solicitar cambios o rechazar y opcional en los demás movimientos. La interfaz oculta las acciones no disponibles, pero la API vuelve a validar todos los permisos.

## API REST

La URL base local es `http://localhost:4000/api`. Salvo el login, todas las rutas requieren la cabecera:

```http
Authorization: Bearer <token>
```

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Inicia sesión y devuelve token y usuario. | Público |
| `GET` | `/api/auth/me` | Devuelve el usuario y rol efectivos de la sesión. | Autenticado |
| `GET` | `/api/launches` | Lista lanzamientos y aplica filtros; los borradores solo aparecen para su creador. | Autenticado |
| `GET` | `/api/launches/:id` | Obtiene detalle, creador, assets e historial; un borrador solo es accesible para su creador. | Autenticado |
| `POST` | `/api/launches` | Crea un lanzamiento en `DRAFT`. | CREATOR |
| `PUT` | `/api/launches/:id` | Edita un lanzamiento propio en `DRAFT` o `IN_REVIEW`. | CREATOR |
| `DELETE` | `/api/launches/:id` | Elimina un lanzamiento propio en `DRAFT` o `IN_REVIEW`. | CREATOR |
| `PATCH` | `/api/launches/:id/status` | Ejecuta una transición válida del grafo de estados. | Según transición |
| `GET` | `/api/launches/:id/history` | Lista el historial cronológico de estados. | Autenticado |
| `POST` | `/api/launches/:id/assets` | Asocia un asset al lanzamiento. | Según permisos del lanzamiento |
| `DELETE` | `/api/assets/:id` | Elimina un asset asociado. | Según permisos del lanzamiento |
| `GET` | `/api/users` | Lista usuarios y permite filtrar por nombre, correo o rol. | ADMIN |
| `PATCH` | `/api/users/:id/role` | Asigna un rol a otra cuenta. | ADMIN |

`GET /api/launches` acepta parámetros de consulta para texto, mercado, estado y rango de fechas. La aplicación web utiliza esta misma ruta como fuente para el listado, el dashboard y el calendario.

## Requisitos locales

- Node.js 20 LTS o posterior.
- npm 10 o posterior.
- VSCode es opcional, pero recomendado para trabajar con ambas aplicaciones en terminales separadas.

Abre en VSCode la carpeta `adidas-launch-panel`, no solamente `backend` o `frontend`.

## Instalación y ejecución

### 1. Backend y base de datos

En Windows PowerShell:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

En macOS o Linux:

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

La migración genera Prisma Client y crea `backend/prisma/dev.db`. La API queda disponible en `http://localhost:4000`.

Variables de `backend/.env`:

| Variable | Valor local sugerido | Uso |
| --- | --- | --- |
| `PORT` | `4000` | Puerto HTTP de Express. |
| `DATABASE_URL` | `file:./dev.db` | Archivo SQLite, relativo a `schema.prisma`. |
| `JWT_SECRET` | Una cadena larga y privada | Firma de los tokens. Cambiar fuera de desarrollo. |
| `JWT_EXPIRES_IN` | `8h` | Vigencia del token. |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen autorizado del frontend. |

### 2. Frontend

Mantén el backend activo y abre una segunda terminal.

En Windows PowerShell:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npx playwright install chromium
npm run dev
```

En macOS o Linux:

```bash
cd frontend
npm install
cp .env.example .env
npx playwright install chromium
npm run dev
```

La interfaz queda disponible en `http://localhost:5173`.

El selector `ES / EN` permanece disponible en la esquina superior derecha del login y del panel. La preferencia se conserva al recargar y al cerrar sesión.

Para presentar el proyecto, consulta la [guía breve de demostración](docs/demo-guide.md). Incluye el recorrido recomendado, las cuentas por rol y capturas de las vistas principales. El resultado de la revisión de escritorio y móvil está en [QA visual final](docs/qa-visual.md).

Variable de `frontend/.env`:

| Variable | Valor local sugerido | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:4000/api` | URL base utilizada por el cliente HTTP. |

Si se cambia el puerto de cualquiera de las aplicaciones, actualiza también `CORS_ORIGIN` o `VITE_API_URL`, según corresponda, y reinicia ambos procesos.

## Usuarios de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| CREATOR | `creator@adidas.com` | `password123` |
| APPROVER | `approver@adidas.com` | `password123` |
| ADMIN | `admin@adidas.com` | `password123` |

La semilla también crea lanzamientos de ejemplo en diferentes mercados y estados para probar filtros, permisos y calendario. Estas credenciales son exclusivamente para desarrollo local.

## Scripts útiles

Desde `backend/`:

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia la API con recarga automática. |
| `npm start` | Inicia la API sin modo watch. |
| `npm run prisma:generate` | Regenera Prisma Client después de cambiar el esquema. |
| `npm run db:migrate -- --name <nombre>` | Crea y aplica una migración de desarrollo. |
| `npm run db:seed` | Inserta o actualiza los usuarios y lanzamientos de ejemplo. |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar SQLite. |
| `npm test` | Ejecuta las pruebas de integración contra una base SQLite aislada. |

Desde `frontend/`:

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia Vite en modo desarrollo. |
| `npm run build` | Genera la versión de producción. |
| `npm run lint` | Ejecuta las reglas estáticas de ESLint. |
| `npm test` | Ejecuta las pruebas rápidas de componentes y permisos con Vitest. |
| `npm run test:e2e` | Ejecuta el flujo crítico completo en Chromium con Playwright y una base aislada. |
| `npm run test:e2e:ui` | Abre la interfaz interactiva de Playwright para depuración local. |
| `npm run test:all` | Ejecuta en secuencia las pruebas rápidas y las pruebas E2E. |
| `npm run preview` | Sirve localmente el build generado. |

Para verificar el entregable completo después de instalar dependencias:

```powershell
cd backend
npm test
cd ..\frontend
npm run lint
npm test
npm run build
npm run test:e2e
```

Las pruebas E2E levantan automáticamente la API en el puerto `4100` y Vite en el
puerto `4173`. Utilizan `backend/test/.tmp/e2e.db`, que se recrea para cada corrida,
por lo que nunca modifican la base local `backend/prisma/dev.db`.

## Notas de seguridad

El JWT simple, las credenciales semilla y SQLite están pensados para esta primera etapa local. Antes de desplegar se deben usar secretos administrados, HTTPS, una política de contraseñas, rate limiting, validación más estricta de entradas y una base de datos apropiada para el entorno.

## Alcance local y límites

Esta versión se ejecuta únicamente en desarrollo local, con el frontend y la API en procesos separados. No incluye configuración de hosting, contenedores ni ambientes de staging.

Para mantener el alcance cerca del reto planteado:

- Solo existen los roles `CREATOR`, `APPROVER` y `ADMIN`.
- Los assets se asocian mediante enlaces HTTP/HTTPS; no se almacenan archivos.
- Cada lanzamiento admite hasta 10 assets.
- Los nombres admiten 120 caracteres, la descripción 2.000 y el mercado 80.
- Los tipos de asset se limitan a imagen, video, documento, copy u otro.
- La administración se limita a asignar roles a cuentas existentes; no incluye creación, eliminación ni permisos granulares.
- No se incluyen notificaciones ni integraciones externas.

GitHub Actions se conserva únicamente como verificación de pruebas, lint y build; no publica ni despliega la aplicación.
