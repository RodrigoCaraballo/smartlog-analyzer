CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(100) NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('ERROR', 'WARN', 'INFO', 'DEBUG')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 10000),
  timestamp TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trace_id VARCHAR(255),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_logs_service_timestamp ON logs (service, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level_timestamp ON logs (level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_received_at ON logs (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_trace_id ON logs (trace_id) WHERE trace_id IS NOT NULL;
