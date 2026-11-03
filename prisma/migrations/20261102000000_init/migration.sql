CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "service" VARCHAR(100) NOT NULL,
  "level" VARCHAR(10) NOT NULL,
  "message" TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ(6) NOT NULL,
  "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "trace_id" VARCHAR(255),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "logs_service_timestamp_idx" ON "logs"("service", "timestamp" DESC);
CREATE INDEX "logs_level_timestamp_idx" ON "logs"("level", "timestamp" DESC);
CREATE INDEX "logs_received_at_idx" ON "logs"("received_at" DESC);
CREATE INDEX "logs_trace_id_idx" ON "logs"("trace_id");
