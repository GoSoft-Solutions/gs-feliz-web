# FELIZ Platform — Arquitectura

## Principio central

FELIZ es el sistema central de identidad, historial y acceso. Servicios externos (ManyChat, Stripe, Google Calendar/Meet, AWS SES) se usan únicamente para funciones especializadas — nunca reemplazan al core.

| Necesidad | Servicio externo | Rol de FELIZ |
|---|---|---|
| Conversación/automatización en redes | ManyChat | Recibe el webhook, es dueño del registro de Contact |
| Pagos y suscripciones | Stripe | Es dueño de Purchase/Subscription/Access |
| Disponibilidad y agenda | Google Calendar | Es dueño del Booking |
| Videollamadas | Google Meet | Guarda el link en el Booking |
| Entrega de correo | AWS SES | Es dueño de Campaign/Sequence/DeliveryHistory |

## Por qué modular monolith (no microservicios)

Un solo proceso desplegable (API) + un worker separado, mismo codebase, mismo monorepo. Los módulos de negocio (Contacts, Campaigns, Content, Newsletter, Payments, Memberships, Courses, Sessions, Integrations, Admin) son `NestModule`s independientes que solo se comunican entre sí a través de servicios exportados — nunca acceso directo a las tablas de otro módulo.

Esto da:
- **Simplicidad operativa**: un solo deploy, un solo lugar para ver logs, una sola base de datos.
- **Costo bajo**: sin orquestador de contenedores, sin múltiples servicios en paralelo.
- **Camino de crecimiento real**: si un módulo necesita escalar independientemente en el futuro, ya tiene límites claros — se extrae sin reescribir lógica de negocio, solo el transporte.

No se usan microservicios, Kubernetes, EKS ni Kafka porque ninguno resuelve un problema que FELIZ tenga hoy.

## Modelo central de identidad

`Contact` es la entidad central, independiente de cualquier proveedor. Una misma persona puede llegar desde ManyChat, la landing, un formulario, Instagram, TikTok, Google o referidos — todas esas fuentes apuntan al mismo `Contact` a través de `ContactSource`.

```
Contact
  ├── ContactSource[]   (de dónde llegó: provider + external_id + campaign)
  ├── ContactEvent[]    (historial: LEAD_CREATED, PURCHASE_COMPLETED, ...)
  ├── EmailConsent      (futuro — Fase 6)
  ├── Purchase[]        (futuro — Fase 8)
  ├── Membership        (futuro — Fase 8)
  ├── CourseEnrollment[] (futuro — Fase 9)
  ├── Session[]         (futuro — Fase 10)
  └── UserAccount?      (futuro — Fase 7, opcional)
```

Un `Contact` puede existir sin `UserAccount`. La cuenta de usuario se crea/activa cuando esa persona necesita acceder al portal (comprar, entrar a un curso, etc.) — no se fuerza su creación al capturar un lead.

## Diagrama del sistema (infraestructura)

```
                        Internet
                            │
                            ▼
                      Route 53 (DNS)
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
        feliz.mx (landing)         app.feliz.mx / admin.feliz.mx
        [Vercel — apps/landing]              │
                                             ▼
                                       CloudFront
                                             │
                        ┌────────────────────┼────────────────────┐
                        ▼                    ▼                    ▼
                 apps/portal (Next.js) apps/admin (Next.js)  /api/* → EB
                        │                    │                    │
                        └────────────────────┴──────────┬─────────┘
                                                         ▼
                                          Elastic Beanstalk (API — NestJS)
                                                         │
                        ┌────────────────────────────────┼───────────────────────┐
                        ▼                                ▼                       ▼
                  RDS PostgreSQL                        SQS                     S3
                        │                                │                 (contenido/archivos)
                        │                                ▼
                        │                     Elastic Beanstalk (Worker)
                        │                                │
                        │                                ▼
                        │                             AWS SES
                        ▼
                 Secrets Manager (credenciales DB, API keys)
```

Región: **us-east-1 (Virginia)**. Motivo: mismo lugar donde ACM emite certificados para CloudFront (requisito técnico de CloudFront), sin diferencia de costo o latencia relevante frente a otras regiones de EE.UU. desde México.

Infraestructura como código: Terraform + Terragrunt en el repo `gosoft-infrastructure-live`, bajo `clients/daniel/prod/us-east-1/`. La infraestructura vive en un repo separado del código de la aplicación (no dentro de este monorepo) porque ya existe esa convención en la organización.

### Costo: bajo por diseño, no gratis a cualquier precio

La cuenta de AWS es nueva (modelo de créditos de onboarding, no el free tier clásico de 12 meses), así que la infraestructura se dimensionó para ser genuinamente barata, priorizando en este orden:

1. DynamoDB en modo provisioned de baja capacidad para el lock de Terraform → cae en el "Always Free" permanente de DynamoDB, sin fecha de vencimiento.
2. Secrets Manager para los secretos de la app (contraseña de RDS, API key de ManyChat) — se mantiene sobre SSM Parameter Store a propósito, por la rotación automática nativa y la gestión centralizada de secretos futuros (Stripe, Google OAuth), aceptando el costo de ~$0.80/mes que eso implica.
3. Tipos de instancia mínimos razonables: EC2 `t2.micro`, RDS `db.t3.micro` + `gp2`.
4. Sin componentes que cuesten dinero sin una necesidad real hoy: sin NAT Gateway, sin Application Load Balancer, sin RDS Multi-AZ, sin streaming de logs a CloudWatch.
5. Alarma de gasto (AWS Budgets, gratis) con notificación por correo a `aws-alerts@gosoftsolutions.com` antes de que el gasto real o proyectado supere un límite mensual configurado.

Estimado total: ~$23-24/mes. Ver `clients/daniel/prod/us-east-1/README.md` en `gosoft-infrastructure-live` para el detalle completo.

## Diagrama del flujo centralizado

```
Instagram/redes → comentario → ManyChat (conversación + captura de datos)
                                        │
                                        │ HTTP POST + X-API-Key
                                        ▼
                     POST /api/v1/integrations/manychat/contacts
                                        │
                     ┌──────────────────┴──────────────────┐
                     ▼                                      ▼
              Buscar por provider+external_id        Buscar por email normalizado
                     │                                      │
                     └──────────────┬───────────────────────┘
                                    ▼
                     Crear o reutilizar Contact (status LEAD)
                                    │
                     ┌──────────────┼──────────────┐
                     ▼              ▼              ▼
              ContactSource    Campaign (si existe) ContactEvent (LEAD_CREATED)
                     │              │              │
                     └──────────────┴──────────────┘
                                    ▼
                     Respuesta 200 { success, contact_id, status }
                                    ▼
                     ManyChat entrega contenido gratuito
                                    ▼
                     (futuro) Nutrición → Oferta → Membresía/Curso → Usuario → Portal
```

Este endpoint responde de forma síncrona y rápida — no usa SQS, porque crear un contacto simple no necesita procesamiento en segundo plano (ver regla de desarrollo #15 en el brief original: usar async solo cuando realmente aporte).

## Observabilidad

- Cada request recibe un `X-Request-Id` (generado o propagado desde el header entrante) que aparece en todos los logs de esa request.
- Logging estructurado vía `pino` (nestjs-pino), con redacción automática de headers sensibles (`Authorization`, `X-API-Key`, `Cookie`).
- El filtro global de excepciones nunca expone stack traces al cliente; siempre logea el detalle del lado del servidor.
- `GET /health` es el endpoint de liveness/readiness, sin autenticación ni prefijo de versión.

## Seguridad (fase actual)

- Variables de entorno validadas al boot (zod) — la app no arranca con configuración inválida o incompleta.
- CORS restrictivo vía `CORS_ORIGINS`.
- Rate limiting global (100 req/min por defecto) vía `@nestjs/throttler`.
- Validación estricta de entrada (`class-validator` + `ValidationPipe` con `whitelist`/`forbidNonWhitelisted`).
- Estructura preparada para JWT/roles/admin, sin implementar hasta que la Fase 7 lo requiera.

## Qué no se implementa todavía (y por qué)

| Componente | Por qué se posterga |
|---|---|
| Auth JWT + roles | No hay usuarios todavía (Fase 7) |
| Content/Newsletter/Payments/Memberships/Courses/Sessions (lógica) | Cada uno tiene su fase; se implementan cuando el negocio los necesita, no antes |
| EventBridge Scheduler | No hay caso de uso real que lo justifique sobre DB-scheduled jobs + Worker + SQS |
| CloudFront delante de la API | Se evalúa con datos reales de tráfico; por ahora la API cuelga de EB directo con TLS (ACM) |
