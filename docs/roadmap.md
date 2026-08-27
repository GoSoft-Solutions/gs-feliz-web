# FELIZ Platform — Roadmap

Desarrollo por fases. Cada fase entrega algo verificable antes de avanzar a la siguiente. No se implementa funcionalidad de una fase futura antes de que su fase inicie.

| Fase | Contenido | Resultado esperado | Estado |
|---|---|---|---|
| 0 | Discovery: arquitectura, stack, modelo de datos, módulos, riesgos | Aprobación del diseño | ✅ Completada |
| 1 | Monorepo, NestJS API, Prisma, Docker Compose, `/health`, env validation, logging, Swagger | `pnpm dev` levanta local, `GET /health` responde | ✅ Completada |
| 2 | Contacts, Contact Sources, Campaigns, Contact Events + migraciones + CRUD + tests | Se pueden crear/administrar contactos y campañas vía API | ✅ Completada |
| 3 | ManyChat integration: API Key Guard, DTO, idempotencia, asociación de fuente/campaña/evento, tests | Se simula ManyChat con curl/Postman y se crea un contacto real | ✅ Completada |
| 4 | Admin foundation: auth admin, dashboard, listado/detalle de contactos, gestión de campañas | Panel operativo mínimo | ⬜ Pendiente |
| 5 | Content foundation: modelo Content, FREE/PUBLIC, administración básica | ManyChat puede entregar contenido gestionado por FELIZ | ⬜ Pendiente |
| 6 | Newsletter MVP: email consent, audience, campaña simple, SQS, Worker, SES, unsubscribe | Se pueden enviar campañas básicas desde FELIZ | ⬜ Pendiente |
| 7 | Auth y portal de usuario: cuentas, login, portal básico, perfil | Usuarios pueden crear cuenta y entrar al portal | ⬜ Pendiente |
| 8 | Payments y memberships: Stripe, products, plans, subscriptions, webhooks, access control | Se puede vender una membresía y controlar acceso | ⬜ Pendiente |
| 9 | Courses: courses, modules, lessons, enrollment, progress, access rules | Un usuario puede inscribirse y avanzar en un curso | ⬜ Pendiente |
| 10 | Sessions: Google Calendar, availability, bookings, Google Meet, historial | Un usuario puede agendar una sesión 1:1 | ⬜ Pendiente |

## Decisiones ya confirmadas

- **Región AWS**: us-east-1 (Virginia).
- **Ubicación del código**: monorepo dentro de `dev/clients/gs-feliz-web` (mismo repo de la landing existente).
- **Ubicación de infraestructura**: `gosoft-infrastructure-live/clients/daniel/prod/us-east-1/` (repo de IaC separado).
- **Activación de cuenta de usuario**: no se fuerza al capturar el lead. Un `Contact` puede existir sin `UserAccount`; la cuenta se crea cuando la persona necesita acceder al portal.

## Estado real de Fase 2 y Fase 3 (verificado, no solo implementado)

- Migración de Prisma aplicada contra PostgreSQL real (`20260824032430_init`).
- Endpoints CRUD de Contacts y Campaigns probados contra la base de datos real (creación, listado paginado, detalle, actualización, conflicto por duplicado).
- Integración ManyChat (`POST /api/v1/integrations/manychat/contacts`) probada de extremo a extremo contra Postgres real: creación, idempotencia por `external_id` (múltiples llamadas repetidas nunca duplican el Contact), resolución por email cuando el `external_id` es nuevo, asociación de campaña por slug, API key inválida (401), payload inválido (400).
- 12 tests unitarios (`ContactsService`, `ManyChatService`) + 8 tests e2e (ManyChat + health), todos en verde, corridos contra una base de datos real vía Docker Compose.
- El cliente ya vinculó su cuenta de Instagram en ManyChat — el endpoint está listo para recibir tráfico real en cuanto se configure el HTTP Request en el flujo de ManyChat (ver `docs/integrations/manychat.md`).

## Decisiones pendientes (a resolver antes o durante la fase correspondiente)

- Estrategia final de CloudFront frente a la API (evaluar con datos reales de tráfico, Fase 3-4).
- RDS dedicado desde qué fase exacta (actualmente: local vía Docker Compose hasta que se despliegue infra real).
- Naming definitivo de subdominios (`app.feliz.mx`, `admin.feliz.mx`) — a confirmar antes de Fase 4/7.
- Mecanismo exacto de activación de cuenta cuando llegue la Fase 7 (login passwordless vs. password + reset).
