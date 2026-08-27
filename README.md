# FELIZ Platform

Monorepo de la plataforma FELIZ: landing pública, API central, portal de usuario, panel admin y worker de procesos en segundo plano. Arquitectura de **modular monolith** — un solo backend desplegable, organizado en módulos con límites claros, sin microservicios.

## 1. Descripción del proyecto

FELIZ centraliza la relación con cada persona del ecosistema de la marca: leads, usuarios, newsletter, campañas, contenido, membresías, cursos, compras y sesiones. Servicios externos (ManyChat, Stripe, Google Calendar/Meet, AWS SES) se usan solo para funciones especializadas; FELIZ es siempre la fuente de verdad.

Ver [docs/architecture.md](docs/architecture.md) para el diseño completo y [docs/roadmap.md](docs/roadmap.md) para el plan de fases.

## 2. Arquitectura

```
gs-feliz-web/                (monorepo)
├── apps/
│   ├── landing/    → Landing pública estática (existente, sin cambios de lógica; desplegada en Vercel)
│   ├── api/        → NestJS — API REST versionada /api/v1
│   ├── portal/     → Next.js — portal de usuario (placeholder hasta Fase 7)
│   ├── admin/      → Next.js — panel admin (placeholder hasta Fase 4)
│   └── worker/     → Node — procesos en segundo plano / consumer SQS (placeholder hasta Fase 6)
│
├── packages/
│   ├── database/       → Prisma schema + client
│   ├── shared-types/   → Enums/tipos compartidos entre apps
│   └── config/         → Validación de variables de entorno (zod)
│
└── docs/
    ├── architecture.md
    ├── roadmap.md
    └── integrations/manychat.md
```

## 3. Diagrama de módulos (API)

```
apps/api/src/
├── modules/
│   ├── health/          ← activo
│   ├── core/             (contacts, sources, campaigns, events) — Fase 2
│   ├── integrations/     (manychat) — Fase 3
│   ├── admin/            — Fase 4
│   ├── content/          — Fase 5
│   ├── newsletter/       — Fase 6
│   ├── payments/         — Fase 8
│   ├── memberships/      — Fase 8
│   ├── courses/          — Fase 9
│   └── sessions/         — Fase 10
├── common/    (guards, filters, middleware, interceptors)
└── config/    (validación de env vars vía @feliz/config)
```

Cada módulo se comunica con otros solo a través de servicios exportados — nunca acceso directo a tablas de otro módulo. Esto preserva límites claros y permite extraer un módulo a servicio independiente en el futuro sin reescribir lógica de negocio.

## 4. Requisitos

- Node.js 22+ (ver `.nvmrc`)
- pnpm 9+ (`corepack enable` o `npm install -g pnpm`)
- Docker (para PostgreSQL local vía Docker Compose)

## 5. Instalación

```powershell
pnpm install
Copy-Item .env.example .env
```

Edita `.env` con tus valores locales (por defecto ya apunta al Postgres de `docker-compose.yml`).

## 6. Variables de entorno

Ver [.env.example](.env.example). La validación vive en `packages/config` (zod) y corre al boot de `apps/api` — si falta una variable requerida, la app falla inmediatamente con un mensaje descriptivo en vez de fallar de forma confusa en tiempo de ejecución.

Variables requeridas hoy: `DATABASE_URL`, `PORT`, `NODE_ENV`, `LOG_LEVEL`, `CORS_ORIGINS`. `MANYCHAT_API_KEY` es requerida a partir de la Fase 3. El resto son variables futuras documentadas pero opcionales hasta que su fase correspondiente inicie.

## 7. Ejecución local

```powershell
# 1. Levantar PostgreSQL
docker compose up -d

# 2. Generar el cliente de Prisma y aplicar migraciones
pnpm db:generate
pnpm db:migrate

# 3. Levantar la API (con hot reload)
pnpm --filter @feliz/api dev
```

`GET http://localhost:3000/health` debe responder `{ "status": "ok", ... }`.

Para levantar todas las apps del monorepo en paralelo (según vayan teniendo contenido real):

```powershell
pnpm dev
```

## 8. Base de datos

PostgreSQL 16, con Prisma como ORM. El schema vive en `packages/database/prisma/schema.prisma`. Fase 1/2 solo define el módulo CORE (`Contact`, `ContactSource`, `Campaign`, `ContactEvent`); el resto de modelos (Content, Newsletter, Payments, Memberships, Courses, Sessions, Users) se agregan en su fase correspondiente — ver [docs/roadmap.md](docs/roadmap.md).

## 9. Migraciones

```powershell
# Crear y aplicar una nueva migración en desarrollo
pnpm db:migrate

# Aplicar migraciones existentes (CI/producción)
pnpm --filter @feliz/database migrate:deploy

# Explorar los datos con Prisma Studio
pnpm db:studio
```

## 10. Tests

```powershell
# Unit + e2e de la API
pnpm --filter @feliz/api test
pnpm --filter @feliz/api test:e2e
```

## 11. Swagger

Con la API corriendo: `http://localhost:3000/docs`.

## 12. Ejemplo de integración ManyChat

Ver [docs/integrations/manychat.md](docs/integrations/manychat.md) para el contrato completo del endpoint `POST /api/v1/integrations/manychat/contacts`, autenticación por `X-API-Key`, y ejemplos de `curl`.

## 12.1 Endpoints activos hoy (Fase 2 + Fase 3)

```
GET    /health
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:id
PATCH  /api/v1/contacts/:id
GET    /api/v1/contacts/:id/events
GET    /api/v1/campaigns
POST   /api/v1/campaigns
GET    /api/v1/campaigns/:id
PATCH  /api/v1/campaigns/:id
POST   /api/v1/integrations/manychat/contacts   (requiere header X-API-Key)
```

## 13. Flujo de desarrollo

1. Cada fase del roadmap se implementa de forma incremental — no se construyen módulos futuros antes de que su fase inicie.
2. Todo cambio de modelo de datos pasa por una migración de Prisma versionada.
3. Los módulos de negocio no acceden a las tablas de otros módulos directamente, solo a través de servicios exportados.
4. Las integraciones externas (ManyChat, Stripe, etc.) son idempotentes.
5. No se hardcodean secrets, precios ni nombres de campañas.

## 14. Roadmap

Ver [docs/roadmap.md](docs/roadmap.md).

## Nota sobre `apps/landing`

`apps/landing` es la landing pública existente (HTML/CSS/JS estático), movida aquí desde la raíz del repo para vivir ordenada junto al resto del monorepo. **No se modificó ningún archivo de contenido o lógica** durante la reorganización, solo su ubicación.

Si el proyecto está desplegado en Vercel, el **Root Directory** del proyecto en el dashboard de Vercel debe apuntar a `apps/landing` para que el deploy siga funcionando tras esta reorganización.
