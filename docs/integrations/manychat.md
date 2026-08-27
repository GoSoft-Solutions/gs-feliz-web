# Integración ManyChat

**Estado actual: diseñado, implementación en Fase 3.** Este documento describe el contrato del endpoint tal como quedará implementado.

ManyChat es únicamente una **fuente de adquisición**, no el sistema de registro principal. FELIZ nunca acopla su modelo de datos a ManyChat: la entidad central sigue siendo `Contact`, vinculado a ManyChat solo a través de `ContactSource` (`provider = "MANYCHAT"`).

## Endpoint

```
POST /api/v1/integrations/manychat/contacts
```

### Autenticación

Header `X-API-Key`, comparado contra la variable de entorno `MANYCHAT_API_KEY`. Nunca se loguea el valor del header (ver redacción de logs en `docs/architecture.md#observabilidad`).

### Payload

```json
{
  "external_id": "123456789",
  "first_name": "Juan",
  "last_name": "Perez",
  "email": "juan@example.com",
  "phone": "+521234567890",
  "source": "instagram",
  "campaign": "guia-gratuita",
  "metadata": {}
}
```

Solo `external_id` es estrictamente obligatorio. `email` es fuertemente recomendado para poder usarse luego como newsletter/lead magnet, pero el modelo permite que sea nulo.

### Flujo (idempotente)

1. Validar `X-API-Key`.
2. Validar el payload (DTO con `class-validator`).
3. Normalizar `email` (lowercase + trim) antes de cualquier búsqueda.
4. Buscar `ContactSource` por `(provider, external_id)`.
5. Si no se encuentra por `external_id`, buscar `Contact` por email normalizado.
6. Crear un `Contact` nuevo (`status = LEAD`) o reutilizar el existente.
7. Crear o actualizar el `ContactSource` correspondiente.
8. Buscar `Campaign` por `slug` (el campo `campaign` del payload) y asociarla si existe.
9. Registrar un `ContactEvent` (`LEAD_CREATED` en la primera captura, `CONTACT_UPDATED` en capturas subsecuentes).
10. Responder.

Por ser idempotente: reenviar el mismo `external_id` nunca crea un segundo `Contact` — actualiza el existente.

### Respuesta

```json
{
  "success": true,
  "contact_id": "uuid",
  "status": "created"
}
```

o:

```json
{
  "success": true,
  "contact_id": "uuid",
  "status": "updated"
}
```

### Ejemplo con curl

```bash
curl -X POST http://localhost:3000/api/v1/integrations/manychat/contacts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MANYCHAT_API_KEY" \
  -d '{
    "external_id": "123456789",
    "first_name": "Juan",
    "email": "juan@example.com",
    "source": "instagram",
    "campaign": "guia-gratuita"
  }'
```

### Casos que deben probarse (Fase 3)

- Request válido → 200, `status: created`.
- Mismo `external_id` reenviado → 200, `status: updated`, no se duplica el Contact.
- Email ya existente en otro Contact, `external_id` nuevo → se asocia al Contact existente por email.
- `X-API-Key` inválida o ausente → 401, sin acceso a la base de datos.
- Payload inválido (falta `external_id`, email mal formado, etc.) → 400 con detalle de validación.
- `campaign` con slug inexistente → el Contact se crea igual, sin campaña asociada (no es un error).

### Por qué la respuesta es síncrona (sin SQS)

Crear/actualizar un Contact es una operación simple y rápida. ManyChat espera una respuesta 200 para continuar su propio flujo (entregar el contenido gratuito) — meterlo a una cola de SQS solo agregaría latencia y complejidad sin ningún beneficio real.
