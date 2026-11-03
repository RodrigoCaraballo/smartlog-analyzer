INSERT INTO logs (service, level, message, timestamp, trace_id, metadata)
VALUES
  ('payments', 'ERROR', 'Connection timeout', NOW() - INTERVAL '2 minutes', 'trace-001', '{"endpoint":"/payments"}'),
  ('payments', 'WARN', 'Retrying payment provider request', NOW() - INTERVAL '1 minute', 'trace-001', '{"attempt":2}'),
  ('catalog', 'INFO', 'Product cache refreshed', NOW() - INTERVAL '30 seconds', NULL, '{"items":120}');
