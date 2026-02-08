# CTO OS v1.2.4 – Uniqueness Index Deduplication Evidence

**Date:** 2026-02-08  
**Scope:** `request_nonces`, `tool_registry` tables  
**Outcome:** Removed redundant `uidx_*` indexes; single unique mechanism per target retained

---

## Decision Summary

**Finding:** Both `request_nonces` and `tool_registry` already had UNIQUE constraints with automatically-created backing indexes. The `uidx_*` indexes added later were redundant duplicates.

**Action:** Keep the original UNIQUE constraints (which provide the uniqueness guarantee + backing index); drop the redundant `uidx_*` indexes to eliminate duplicate index maintenance overhead.

---

## BEFORE State

### A1. Constraints (4 rows)

```
         conname                          | contype | table_name
------------------------------------------+---------+----------------
 request_nonces_runtime_id_request_id_key | u       | request_nonces
 request_nonces_pkey                      | p       | request_nonces
 tool_registry_name_key                   | u       | tool_registry
 tool_registry_pkey                       | p       | tool_registry
```

### A2. Indexes (8 rows)

```
 tablename       | indexname                                 | indexdef
-----------------+-------------------------------------------+-----------------------------------------------------------
 request_nonces  | request_nonces_pkey                       | CREATE UNIQUE INDEX request_nonces_pkey ON public.request_nonces USING btree (id)
 request_nonces  | request_nonces_runtime_id_request_id_key  | CREATE UNIQUE INDEX request_nonces_runtime_id_request_id_key ON public.request_nonces USING btree (runtime_id, request_id)
 request_nonces  | idx_request_nonces_runtime_id             | CREATE INDEX idx_request_nonces_runtime_id ON public.request_nonces USING btree (runtime_id)
 request_nonces  | uidx_request_nonces_runtime_request       | CREATE UNIQUE INDEX uidx_request_nonces_runtime_request ON public.request_nonces USING btree (runtime_id, request_id)
 tool_registry   | tool_registry_pkey                        | CREATE UNIQUE INDEX tool_registry_pkey ON public.tool_registry USING btree (id)
 tool_registry   | tool_registry_name_key                    | CREATE UNIQUE INDEX tool_registry_name_key ON public.tool_registry USING btree (name)
 tool_registry   | idx_tool_registry_category                | CREATE INDEX idx_tool_registry_category ON public.tool_registry USING btree (category)
 tool_registry   | uidx_tool_registry_name                   | CREATE UNIQUE INDEX uidx_tool_registry_name ON public.tool_registry USING btree (name)
```

### A3a. Duplicate Detection – request_nonces (2 rows)

```
 indexname                                 | columns
-------------------------------------------+-------------------------
 request_nonces_runtime_id_request_id_key  | runtime_id, request_id
 uidx_request_nonces_runtime_request       | runtime_id, request_id
```

### A3b. Duplicate Detection – tool_registry (2 rows)

```
 indexname               | columns
-------------------------+---------
 tool_registry_name_key  | name
 uidx_tool_registry_name | name
```

---

## DDL Executed

```sql
DROP INDEX IF EXISTS public.uidx_request_nonces_runtime_request;
DROP INDEX IF EXISTS public.uidx_tool_registry_name;
```

---

## AFTER State

### C1. Constraints (4 rows – unchanged)

```
         conname                          | contype | table_name
------------------------------------------+---------+----------------
 request_nonces_runtime_id_request_id_key | u       | request_nonces
 request_nonces_pkey                      | p       | request_nonces
 tool_registry_name_key                   | u       | tool_registry
 tool_registry_pkey                       | p       | tool_registry
```

### C2. Indexes (6 rows – redundant uidx\_\* removed)

```
 tablename       | indexname                                 | indexdef
-----------------+-------------------------------------------+-----------------------------------------------------------
 request_nonces  | request_nonces_pkey                       | CREATE UNIQUE INDEX request_nonces_pkey ON public.request_nonces USING btree (id)
 request_nonces  | request_nonces_runtime_id_request_id_key  | CREATE UNIQUE INDEX request_nonces_runtime_id_request_id_key ON public.request_nonces USING btree (runtime_id, request_id)
 request_nonces  | idx_request_nonces_runtime_id             | CREATE INDEX idx_request_nonces_runtime_id ON public.request_nonces USING btree (runtime_id)
 tool_registry   | tool_registry_pkey                        | CREATE UNIQUE INDEX tool_registry_pkey ON public.tool_registry USING btree (id)
 tool_registry   | tool_registry_name_key                    | CREATE UNIQUE INDEX tool_registry_name_key ON public.tool_registry USING btree (name)
 tool_registry   | idx_tool_registry_category                | CREATE INDEX idx_tool_registry_category ON public.tool_registry USING btree (category)
```

### C5. Unique Index Counts Per Table

```
 table_name      | unique_index_count
-----------------+--------------------
 request_nonces  | 1
 tool_registry   | 1
```

(Excluding primary keys; counts only non-PK unique indexes)

---

## Migration Reference

**File:** `supabase/migrations/20260208000001_cto_os_v124_uniqueness_constraints.sql`

---

## Verification Queries

```sql
-- Check constraints
SELECT conname, contype, relname AS table_name
FROM pg_constraint c
JOIN pg_class r ON c.conrelid = r.oid
WHERE r.relname IN ('request_nonces', 'tool_registry')
ORDER BY relname, contype;

-- Check indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('request_nonces', 'tool_registry')
ORDER BY tablename, indexname;

-- Count unique indexes per table (excluding PKs)
SELECT tablename, COUNT(*) AS unique_index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('request_nonces', 'tool_registry')
  AND indexdef LIKE '%UNIQUE%'
  AND indexname NOT LIKE '%_pkey'
GROUP BY tablename;
```
