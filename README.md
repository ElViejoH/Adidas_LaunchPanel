# Adidas Launch Panel

Adidas Launch Panel is a bilingual internal web application for planning product launches and moving them through a controlled approval workflow. Marketing creators can prepare launches and their associated assets, approvers can review and decide on submissions, and administrators can manage account roles.

The project is designed as a local, evaluation-ready prototype that balances a focused user experience with non-trivial backend rules, relational persistence, role-based authorization, and automated testing.

## Project Overview and Goals

Product launch information is often distributed across messages, spreadsheets, calendars, and disconnected approval conversations. This makes ownership unclear and decisions difficult to trace.

Adidas Launch Panel brings that process into one workspace with four primary goals:

1. Centralize launch information, dates, markets, assets, and ownership.
2. Provide a clear workflow from draft to review, approval, and publication.
3. Give creators, approvers, and administrators only the actions relevant to their roles.
4. Preserve an auditable history of every status decision.

## Documentation

- [Figma design and low-fidelity wireframes](https://www.figma.com/design/IyfRvjFwQeB0jIIUews6b5/Sin-t%C3%ADtulo?node-id=0-1&t=HWcsQJqKwZ2tpqZ3-1): login, desktop dashboard, and responsive mobile layout explorations.
- [Youtube video- presentation] (https://youtu.be/sExVU5YLPLY)

### Target users

- **Creators:** prepare launches, manage assets, and submit work for review.
- **Approvers:** review submitted launches and approve, reject, or request changes.
- **Administrators:** review registered accounts and assign creator, approver, or administrator roles.

## Key Features

- Create, read, update, and delete product launches.
- Search and filter launches by text, market, status, and date range.
- Connected overview, launch list, detail, form, and calendar views.
- Controlled launch workflow with role-aware actions.
- Status history with actor, timestamp, transition, and optional comment.
- Asset management through external HTTP or HTTPS links.
- Draft privacy: only the creator of a draft can access it.
- Creator editing and deletion of owned launches in `DRAFT` or `IN_REVIEW`.
- Administrative role management for registered accounts.
- Persistent Spanish and English interface selection.
- Responsive layouts and visual states for desktop and mobile.
- Isolated backend, component, permission, and end-to-end tests.

## Roles and Permissions

| Action | CREATOR | APPROVER | ADMIN |
| --- | --- | --- | --- |
| View launches and status history | All non-drafts and owned drafts | All except drafts | All except drafts |
| Create a launch | Yes | No | No |
| Edit a launch | Owned `DRAFT` or `IN_REVIEW` | No | No |
| Delete a launch | Owned `DRAFT` or `IN_REVIEW` | No | No |
| Submit for review | `DRAFT → IN_REVIEW` | No | No |
| Request changes | No | `IN_REVIEW → CHANGES_REQUESTED` | No |
| Reopen for correction | Owned `CHANGES_REQUESTED → DRAFT` | No | No |
| Reject a launch | No | `IN_REVIEW → REJECTED` | No |
| Approve a launch | No | `IN_REVIEW → APPROVED` | No |
| Publish a launch | No | `APPROVED → PUBLISHED` | No |
| List users and assign roles | No | No | Yes |

The interface hides unavailable actions, while the API independently enforces authorization and ownership rules.

## Launch Workflow

```text
DRAFT ──submit for review──> IN_REVIEW ──approve──> APPROVED ──publish──> PUBLISHED
                                 ├──request changes──> CHANGES_REQUESTED ──reopen──> DRAFT
                                 └──reject───────────> REJECTED
```

Invalid skips and backwards transitions are rejected. `REJECTED` and `PUBLISHED` are terminal states. Every accepted transition is executed transactionally and adds a `StatusHistory` record. A comment is required when an approver requests changes or rejects a launch.

## Design and UX Decisions

- The visual direction uses a restrained black, white, and neutral palette inspired by Adidas digital interfaces.
- Statuses use color as a supporting signal, while text labels and outlined badges preserve readability and avoid depending on color alone.
- Each role receives a tailored overview and only sees relevant calls to action.
- The language switcher remains available throughout the application and persists the selected language.
- Search, filters, and calendar views share the same API data source to keep results consistent.
- Focus, hover, empty, loading, confirmation, and error states make interactive behavior visible.
- The login and internal application views use different interface scales to make better use of the available screen space.

## Technologies Used

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 6, Tailwind CSS 4 |
| UI and utilities | Phosphor Icons, date-fns, Montserrat Variable, Roboto Condensed Variable |
| Backend | Node.js 20+, Express 4, CORS, dotenv |
| Data | SQLite, Prisma ORM |
| Security | JSON Web Tokens, bcrypt password hashing, role and ownership authorization |
| Testing | Node Test Runner, Supertest, Vitest, Testing Library, Playwright |
| Code quality | ESLint |

Third-party libraries are installed through npm and recorded with their exact versions in the corresponding lockfiles.

## Technical Architecture

The repository contains two independent applications:

```text
React client
    │
    │ REST API + JWT
    ▼
Express routes and middleware
    │
    ▼
Controllers → Services → Prisma ORM
                            │
                            ▼
                         SQLite
```

- **Frontend:** owns navigation, localized content, form state, filters, visual permissions, and API consumption.
- **Backend:** owns authentication, authorization, validation, workflow transitions, and HTTP responses.
- **Service layer:** centralizes reusable business rules and transactional status history.
- **Database:** stores users, launches, assets, and status changes through relational models.

### Repository structure

```text
adidas-launch-panel/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── prisma/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── test/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── e2e/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── screenshots/
│   ├── design-and-system-architecture.md
│   ├── demo-guide.md
│   ├── presentation-script.md
│   ├── visual-design-recreation-prompt.md
│   └── qa-visual.md
└── README.md
```

### Main frontend routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/login` | Authentication and demo-account selection | Public |
| `/` | Role-aware overview | Authenticated |
| `/launches` | Searchable and filterable launch list | Authenticated |
| `/launches/new` | Launch creation | CREATOR |
| `/launches/:id` | Launch details, assets, and history | According to launch visibility |
| `/launches/:id/edit` | Launch editing | Owner in `DRAFT` or `IN_REVIEW` |
| `/calendar` | Launch calendar | Authenticated |
| `/users` | Account role management | ADMIN |

## Data Model

| Model | Main fields | Relationships |
| --- | --- | --- |
| `User` | `id`, `name`, `email`, `password`, `role`, `createdAt` | Creates launches and records status changes |
| `Launch` | `id`, `name`, `description`, `market`, `launchDate`, `status`, `creatorId`, timestamps | Belongs to a creator and contains assets and history |
| `Asset` | `id`, `launchId`, `name`, `type`, `url`, `createdAt` | Belongs to a launch |
| `StatusHistory` | `id`, `launchId`, `previousStatus`, `newStatus`, `changedById`, `comment`, `createdAt` | Connects a launch transition to its actor |

Valid roles are `CREATOR`, `APPROVER`, and `ADMIN`. Valid launch statuses are `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, and `REJECTED`.

## REST API

The local API base URL is `http://localhost:4000/api`. Every endpoint except login requires:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Authenticate and return a token and user | Public |
| `GET` | `/api/auth/me` | Return the current user and effective role | Authenticated |
| `GET` | `/api/launches` | List and filter visible launches | Authenticated |
| `GET` | `/api/launches/:id` | Return launch details, assets, creator, and history | According to launch visibility |
| `POST` | `/api/launches` | Create a launch in `DRAFT` | CREATOR |
| `PUT` | `/api/launches/:id` | Edit an owned launch in `DRAFT` or `IN_REVIEW` | CREATOR |
| `DELETE` | `/api/launches/:id` | Delete an owned launch in `DRAFT` or `IN_REVIEW` | CREATOR |
| `PATCH` | `/api/launches/:id/status` | Execute a valid status transition | According to transition |
| `GET` | `/api/launches/:id/history` | Return chronological status history | Authenticated |
| `POST` | `/api/launches/:id/assets` | Add an asset link | According to launch permissions |
| `DELETE` | `/api/assets/:id` | Delete an associated asset | According to launch permissions |
| `GET` | `/api/users` | List and filter registered accounts | ADMIN |
| `PATCH` | `/api/users/:id/role` | Assign a role to another account | ADMIN |

`GET /api/launches` accepts query parameters for search text, market, status, and date range. The launch list, overview, and calendar use this endpoint as their shared data source.

## Local Requirements

- Node.js 20 LTS or later.
- npm 10 or later.
- A modern Chromium-based browser.
- VS Code is optional but recommended for working with the frontend and backend in separate terminals.

Open the `adidas-launch-panel` repository root in the editor, rather than opening only `backend` or `frontend`.

## Setup Instructions

### 1. Backend and database

In Windows PowerShell:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

In macOS or Linux:

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

The migration generates Prisma Client and creates `backend/prisma/dev.db`. The API becomes available at `http://localhost:4000`.

Backend environment variables:

| Variable | Suggested local value | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Express HTTP port |
| `DATABASE_URL` | `file:./dev.db` | SQLite file relative to `schema.prisma` |
| `JWT_SECRET` | A long private string | Token signature; replace outside local development |
| `JWT_EXPIRES_IN` | `8h` | Token lifetime |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

### 2. Frontend

Keep the backend running and open a second terminal.

In Windows PowerShell:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npx playwright install chromium
npm run dev
```

In macOS or Linux:

```bash
cd frontend
npm install
cp .env.example .env
npx playwright install chromium
npm run dev
```

The interface becomes available at `http://localhost:5173`.

Frontend environment variable:

| Variable | Suggested local value | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:4000/api` | Base URL used by the HTTP client |

If either port changes, update `CORS_ORIGIN` or `VITE_API_URL` as appropriate and restart both applications.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| CREATOR | `creator@adidas.com` | `password123` |
| APPROVER | `approver@adidas.com` | `password123` |
| ADMIN | `admin@adidas.com` | `password123` |

The database seed also creates sample launches in different markets and states for exercising filters, permissions, workflow actions, and the calendar. These credentials are intended exclusively for local demonstration.

## Available Scripts

From `backend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with automatic reload |
| `npm start` | Start the API without watch mode |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run db:migrate -- --name <name>` | Create and apply a development migration |
| `npm run db:seed` | Insert or update demo accounts and launches |
| `npm run db:studio` | Open Prisma Studio |
| `npm test` | Run API integration tests against isolated SQLite databases |

From `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production bundle |
| `npm run lint` | Run ESLint |
| `npm test` | Run component, utility, localization, and permission tests |
| `npm run test:e2e` | Run critical user flows in Chromium |
| `npm run test:e2e:ui` | Open Playwright's interactive test interface |
| `npm run test:all` | Run frontend unit and end-to-end tests |
| `npm run preview` | Serve the generated build locally |

## Testing and Quality Assurance

Run the complete verification sequence after installing dependencies:

```powershell
cd backend
npm test
cd ..\frontend
npm run lint
npm test
npm run build
npm run test:e2e
```

The automated coverage includes:

- Authentication and role-protected navigation.
- Launch creation and workflow transitions.
- Draft visibility and launch ownership rules.
- Editing and deletion during review.
- Filters and calendar navigation.
- Language persistence and translated content.
- Administrative role assignment.
- Desktop and mobile visual review.

Playwright starts an isolated API on port `4100` and Vite on port `4173`. Its database is recreated at `backend/test/.tmp/e2e.db`, so end-to-end tests never modify the local development database at `backend/prisma/dev.db`.

The current demonstration walkthrough is available in [`docs/demo-guide.md`](docs/demo-guide.md), and the visual review is documented in [`docs/qa-visual.md`](docs/qa-visual.md).

## Known Issues and Limitations

This version intentionally remains close to the requested challenge scope:

- The application runs locally only; it has no hosting, staging, container, or deployment configuration.
- SQLite is appropriate for the prototype but is not intended for concurrent production workloads.
- Demo credentials are seeded and must not be used in a real environment.
- Assets are external HTTP or HTTPS links; the application does not upload or store files.
- Each launch is limited to 10 assets.
- Launch names are limited to 120 characters, descriptions to 2,000 characters, and markets to 80 characters.
- Asset types are limited to image, video, document, copy, or other.
- Administration is limited to assigning roles to existing accounts; it does not create or delete users and does not provide granular permissions.
- The application does not send notifications or connect to external marketing systems.
- The JWT is stored by the browser for this local prototype; a production deployment would require a hardened session strategy.
- Automated visual testing is based on selected desktop and mobile viewports rather than a complete device matrix.

## Production Considerations

Before a real deployment, the application would require:

- Managed secrets, HTTPS, secure cookie-based sessions, and token rotation.
- Strong password policies, rate limiting, input hardening, and audit monitoring.
- A production database such as PostgreSQL and a managed migration process.
- File storage or a digital asset management integration.
- Observability, backups, recovery procedures, and deployment environments.
- Accessibility audits across additional browsers, devices, and assistive technologies.




