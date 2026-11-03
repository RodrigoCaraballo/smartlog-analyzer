CREATE TABLE "analyses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "status" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  "filters" JSONB NOT NULL DEFAULT '{}',
  "model" VARCHAR(100),
  "summary" TEXT,
  "result" JSONB,
  "error_code" VARCHAR(100),
  CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analysis_logs" (
  "analysis_id" UUID NOT NULL,
  "log_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analysis_logs_pkey" PRIMARY KEY ("analysis_id", "log_id")
);

CREATE INDEX "analyses_status_created_at_idx" ON "analyses"("status", "created_at" DESC);
CREATE INDEX "analysis_logs_log_id_idx" ON "analysis_logs"("log_id");

ALTER TABLE "analysis_logs"
  ADD CONSTRAINT "analysis_logs_analysis_id_fkey"
  FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analysis_logs"
  ADD CONSTRAINT "analysis_logs_log_id_fkey"
  FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
