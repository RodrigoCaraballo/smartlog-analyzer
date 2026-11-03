# SmartLog Analyzer

API para ingerir logs de microservicios y ejecutar análisis asíncronos de anomalías e incidentes. El proyecto usa NestJS, PostgreSQL, Redis y BullMQ con una arquitectura hexagonal.

## Estructura

```text
smartlog-analyzer/
├── README.md
├── ARCHITECTURE.md
├── src/
├── test/                 # Tests unitarios y e2e
├── prisma/               # Schema, migraciones y seed
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

Las migraciones y el seed están en `prisma/`, no en una carpeta `db/`.

## Requisitos

- Docker Desktop con Docker Compose.
- Node.js 22 o superior para ejecutar comandos localmente.
- npm.

No es necesario instalar PostgreSQL ni Redis localmente para levantar el entorno Docker.

## Cómo levantar el proyecto

El siguiente comando construye la imagen, inicia PostgreSQL, Redis y la API, aplica las migraciones y carga datos de ejemplo automáticamente:

```bash
docker compose up --build
```

No es necesario ejecutar `npm install`, `prisma migrate` ni un seed manualmente. Docker Compose espera a que PostgreSQL y Redis estén saludables antes de iniciar la API.

Servicios disponibles:

- API: <http://localhost:3000>
- Swagger: <http://localhost:3000/docs>
- Health: <http://localhost:3000/api/health>
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Para detener el entorno:

```bash
docker compose down
```

Para borrar los volúmenes y volver a ejecutar migraciones y seed desde cero:

```bash
docker compose down -v
docker compose up --build
```

El seed contiene 39 logs de `payments`, `catalog`, `auth` y `orders`, con errores, timeouts, advertencias, mensajes repetidos y datos normales para probar los detectores.

### Variables de entorno

Docker Compose funciona con los valores por defecto. Si se necesita personalizar el entorno, se puede copiar `.env.example` a `.env`.

| Variable | Uso | Valor por defecto |
|---|---|---|
| `APP_PORT` | Puerto publicado de la API | `3000` |
| `POSTGRES_DB` | Nombre de la base | `smartlog` |
| `POSTGRES_USER` | Usuario local de PostgreSQL | `smartlog` |
| `POSTGRES_PASSWORD` | Contraseña local de desarrollo | `smartlog_dev` |
| `POSTGRES_PORT` | Puerto publicado de PostgreSQL | `5432` |
| `OPENAI_API_KEY` | Clave del proveedor LLM | vacío |
| `OPENAI_MODEL` | Modelo LLM | `gpt-4o-mini` |
| `OPENAI_TIMEOUT_MS` | Timeout del LLM | `20000` |
| `REDIS_HOST` | Host de Redis | `localhost` local / `redis` Docker |
| `REDIS_PORT` | Puerto de Redis | `6379` |
| `ANALYSIS_QUEUE_NAME` | Cola BullMQ | `log-analysis` |

No se incluyen API keys ni contraseñas reales en el repositorio. Los valores de PostgreSQL son únicamente credenciales locales de desarrollo.

## Nota sobre la entrega en PIA

La carpeta `prisma/migrations/` contiene archivos `.sql` que son **código fuente de migraciones de Prisma**, no bases de datos (`.db`, `.sqlite` o similares). Estas migraciones son necesarias para que `docker compose up --build` cree el esquema automáticamente.

Si el validador de PIA rechaza los archivos `.sql` como si fueran archivos de base de datos, se puede generar un ZIP específico para la plataforma excluyendo `prisma/migrations/`. En ese caso:

- el repositorio completo de GitHub conserva las migraciones y la ejecución autónoma con Docker Compose;
- el ZIP de PIA conserva el código fuente, `prisma/schema.prisma`, el seed, Dockerfile, Compose y la documentación;
- la exclusión se realiza únicamente por la limitación del validador, no porque las migraciones sean datos sensibles o una base de datos exportada.

Para revisar el historial de commits, se debe compartir también el enlace al repositorio de GitHub, ya que el ZIP descargado para PIA no debe incluir `.git`.

## Uso de la API

### Crear un log

```bash
curl.exe -X POST http://localhost:3000/api/logs ^
  -H "Content-Type: application/json" ^
  -d "{\"service\":\"payments\",\"level\":\"ERROR\",\"message\":\"Connection timeout\",\"timestamp\":\"2026-11-02T14:00:00.000Z\",\"metadata\":{\"endpoint\":\"/payments\"}}"
```

### Listar logs

```http
GET /api/logs?page=1&limit=20&service=payments&level=ERROR
```

La respuesta contiene `items`, `page`, `limit`, `total` y `totalPages`. El límite máximo es 100.

### Programar un análisis

```bash
curl.exe -X POST http://localhost:3000/api/logs/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"logIds\":[\"11111111-1111-4111-8111-111111111111\"]}"
```

La respuesta es `202 Accepted` con el identificador y estado `PENDING`. BullMQ procesa el análisis en segundo plano.

```http
GET /api/analysis/{analysisId}
GET /api/analysis/{analysisId}/report
GET /api/health
```

Los estados de análisis son `PENDING`, `RUNNING`, `COMPLETED` y `FAILED`. El health check verifica PostgreSQL y Redis.

## Logging estructurado

La API escribe logs en una línea JSON por evento. Cada request genera eventos `http.request.started`, `http.request.completed` o `http.request.failed`. Incluyen un `requestId` (también devuelto en el header `x-request-id`), método, ruta, código HTTP, duración y, cuando existe, `analysisId`.

El worker genera además `analysis.job.started`, `analysis.job.completed` y `analysis.job.failed`, incluyendo `jobId`, `analysisId`, intento y duración. Esto permite seguir un análisis desde `POST /api/logs/analyze` hasta su procesamiento en BullMQ.

Ejemplo:

```json
{
  "timestamp": "2026-11-03T14:30:00.000Z",
  "level": "info",
  "message": "http.request.started",
  "requestId": "req-uuid",
  "method": "GET",
  "path": "/api/health",
  "queryKeys": []
}
```

No se registran bodies de requests, API keys, prompts ni mensajes completos de logs. Los errores HTTP se registran como `http.request.failed` con información técnica segura.

## Tests

Instalar dependencias y generar el cliente Prisma:

```bash
npm install
npx prisma generate
```

Ejecutar tests unitarios:

```bash
npm test -- --runInBand
```

Ejecutar tests e2e:

```bash
npm run test:e2e
```

Los e2e usan mocks de persistencia y desactivan el worker/Redis real mediante condiciones de test. No requieren PostgreSQL ni Redis locales.

Ejecutar cobertura, build y lint:

```bash
npm run test:cov
npm run build
npm run lint
```

## Integración continua

El workflow `.github/workflows/ci.yml` se ejecuta en cada push y en cada pull request. Está dividido en dos etapas:

1. **Quality:** instala con `npm ci`, genera Prisma, ejecuta lint, tests unitarios, e2e y build.
2. **Docker integration:** valida Compose, levanta PostgreSQL, Redis y la API, verifica `/api/health`, confirma que el seed cargó logs y ejecuta un análisis asíncrono usando Redis y el worker reales.

El pipeline no necesita `OPENAI_API_KEY` porque el entorno de desarrollo usa `FakeIncidentSummarizer`. Los servicios se detienen y sus volúmenes se eliminan al finalizar la integración, incluso si falla.

El job de calidad define una `DATABASE_URL` local de prueba para que Prisma pueda cargar su configuración durante `prisma generate`; no realiza conexiones a PostgreSQL en esa etapa.

## Uso de IA durante el desarrollo

Se utilizó IA como asistente de desarrollo para:

- revisar y convertir la arquitectura síncrona en un flujo asíncrono con BullMQ y Redis;
- proponer contratos de puertos, casos de uso y adaptadores compatibles con arquitectura hexagonal;
- generar escenarios de tests unitarios y e2e;
- revisar respuestas HTTP, manejo de errores y condiciones de disponibilidad;
- mejorar la documentación de ejecución y uso.

Las decisiones finales, el código, las validaciones, la revisión de dependencias y la ejecución de los tests fueron verificadas sobre este repositorio. La IA no recibió API keys ni secretos reales.

## Qué quedó fuera y cómo resolverlo

- **Autenticación y autorización:** agregar JWT/OIDC, guards por endpoint y control de permisos.
- **Outbox transaccional:** persistir eventos de publicación junto con `analyses` para evitar análisis `PENDING` sin job.
- **Observabilidad avanzada:** incorporar métricas, tracing distribuido, logs estructurados y alertas.
- **Proveedor LLM real en producción:** completar el adaptador OpenAI con timeout, redacción de datos sensibles, validación estricta y errores tipados. El desarrollo actual usa `FakeIncidentSummarizer`.
- **Escalado del worker:** separar API y workers en servicios independientes y configurar concurrencia limitada.
- **Retención y paginación de análisis:** agregar políticas de limpieza, filtros y paginación para historiales grandes.

## Documentación adicional

- `ARCHITECTURE.md`: decisiones, diagramas, contratos y estrategia de tests.
- Swagger: <http://localhost:3000/docs> cuando la aplicación está levantada.
