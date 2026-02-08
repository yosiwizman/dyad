-- CTO OS v1.2.4: Remove redundant uniqueness indexes
--
-- The following tables already have UNIQUE constraints with backing indexes:
--   - request_nonces: UNIQUE(runtime_id, request_id) -> request_nonces_runtime_id_request_id_key
--   - tool_registry: UNIQUE(name) -> tool_registry_name_key
--
-- The uidx_* indexes were redundant duplicates created after the constraints.
-- This migration removes them to eliminate duplicate index maintenance overhead.

BEGIN;

-- Fail fast if locks cannot be acquired (avoid blocking other transactions)
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Drop redundant unique index on request_nonces (constraint already enforces uniqueness)
DROP INDEX IF EXISTS public.uidx_request_nonces_runtime_request;

-- Drop redundant unique index on tool_registry (constraint already enforces uniqueness)
DROP INDEX IF EXISTS public.uidx_tool_registry_name;

COMMIT;

-- Verification queries (run manually to confirm):
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('request_nonces', 'tool_registry');
-- SELECT conname, contype FROM pg_constraint WHERE conrelid IN ('public.request_nonces'::regclass, 'public.tool_registry'::regclass);
