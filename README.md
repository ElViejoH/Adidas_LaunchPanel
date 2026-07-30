# Adidas Launch Panel

Aplicación web interna para organizar lanzamientos de producto desde su creación hasta su publicación. El proyecto combina un dashboard en React con una API REST en Express, persistencia relacional en SQLite mediante Prisma y autenticación JWT con permisos por rol.

## Alcance del primer entregable

- CRUD de lanzamientos con búsqueda y filtros por mercado, estado y fecha.
- Flujo controlado `DRAFT → IN_REVIEW → APPROVED → PUBLISHED`.
- Registro auditable de cada transición de estado.
- Gestión de assets asociados a un lanzamiento.
- Vistas conectadas de dashboard, lista, detalle, formulario y calendario.
- Dos roles de demostración: creador y aprobador.
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
| `frontend/src/pages/` | Pantallas de login, dashboard, listado, detalle, formulario y calendario. |
| `frontend/src/layouts/` | Estructura compartida del dashboard con sidebar y navbar. |
| `frontend/src/services/` | Cliente HTTP y funciones para consumir autenticación, lanzamientos y assets. |
| `frontend/src/context/` | Estado global de autenticación: usuario, token, rol y ciclo de sesión. |
| `frontend/src/hooks/` | Hooks para reutilizar acceso a contexto y lógica de datos. |
| `frontend/src/utils/` | Formateo de fechas, etiquetas y otras funciones puras. |
| `frontend/src/styles/` | Estilos globales y entrada de Tailwind CSS. |
| `frontend/src/App.jsx` | Enrutamiento principal, rutas privadas y composición de vistas. |
| `frontend/src/main.jsx` | Punto de montaje de React y proveedores globales. |

Las rutas principales de la interfaz son `/login`, `/`, `/launches`, `/launches/new`, `/launches/:id`, `/launches/:id/edit` y `/calendar`. Todas excepto `/login` requieren una sesión válida; las rutas de creación y edición aplican además los permisos de rol y estado.

## Modelo de datos

| Modelo | Campos principales | Relaciones |
| --- | --- | --- |
| `User` | `id`, `name`, `email`, `password`, `role`, `createdAt` | Crea lanzamientos y registra cambios de estado. |
| `Launch` | `id`, `name`, `description`, `market`, `launchDate`, `status`, `creatorId`, timestamps | Pertenece a un creador; contiene assets e historial. |
| `Asset` | `id`, `launchId`, `name`, `type`, `url`, `createdAt` | Pertenece a un lanzamiento. |
| `StatusHistory` | `id`, `launchId`, `previousStatus`, `newStatus`, `changedById`, `comment`, `createdAt` | Relaciona un lanzamiento con el usuario que realizó la transición. |

Los roles válidos son `CREATOR` y `APPROVER`. Los estados válidos son `DRAFT`, `IN_REVIEW`, `APPROVED` y `PUBLISHED`.

## Estados y permisos

```text
CREATOR                    APPROVER
DRAFT ──enviar revisión──> IN_REVIEW ──aprobar──> APPROVED ──publicar──> PUBLISHED
```

| Acción | CREATOR | APPROVER |
| --- | --- | --- |
| Consultar lanzamientos, detalle e historial | Sí | Sí |
| Crear un lanzamiento | Sí | No |
| Editar un lanzamiento | Solo uno propio en `DRAFT` | No |
| Eliminar un lanzamiento | Solo uno propio en `DRAFT` | No |
| Enviar a revisión | `DRAFT → IN_REVIEW` | No |
| Aprobar | No | `IN_REVIEW → APPROVED` |
| Publicar | No | `APPROVED → PUBLISHED` |

No se permiten retrocesos ni saltos entre estados. Cada transición se ejecuta de forma transaccional y crea un registro en `StatusHistory` con el usuario responsable y un comentario opcional. La interfaz oculta las acciones no disponibles, pero la API vuelve a validar todos los permisos.

## API REST

La URL base local es `http://localhost:4000/api`. Salvo el login, todas las rutas requieren la cabecera:

```http
Authorization: Bearer <token>
```

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Inicia sesión y devuelve token y usuario. | Público |
| `GET` | `/api/launches` | Lista lanzamientos y aplica filtros. | Autenticado |
| `GET` | `/api/launches/:id` | Obtiene detalle, creador, assets e historial. | Autenticado |
| `POST` | `/api/launches` | Crea un lanzamiento en `DRAFT`. | CREATOR |
| `PUT` | `/api/launches/:id` | Edita un lanzamiento propio en `DRAFT`. | CREATOR |
| `DELETE` | `/api/launches/:id` | Elimina un lanzamiento propio en `DRAFT`. | CREATOR |
| `PATCH` | `/api/launches/:id/status` | Ejecuta la siguiente transición válida. | Según transición |
| `GET` | `/api/launches/:id/history` | Lista el historial cronológico de estados. | Autenticado |
| `POST` | `/api/launches/:id/assets` | Asocia un asset al lanzamiento. | Según permisos del lanzamiento |
| `DELETE` | `/api/assets/:id` | Elimina un asset asociado. | Según permisos del lanzamiento |

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
npm run dev
```

En macOS o Linux:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

La interfaz queda disponible en `http://localhost:5173`.

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
| `npm run preview` | Sirve localmente el build generado. |

Para verificar el entregable completo después de instalar dependencias:

```powershell
cd backend
npm test
cd ..\frontend
npm run lint
npm run build
```

## Notas de seguridad

El JWT simple, las credenciales semilla y SQLite están pensados para esta primera etapa local. Antes de desplegar se deben usar secretos administrados, HTTPS, una política de contraseñas, rate limiting, validación más estricta de entradas y una base de datos apropiada para el entorno.
