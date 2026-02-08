# CTO OS – MEMORY

This document tracks completed CTO OS governance actions and decisions.

---

## v1.2.4 – Uniqueness Dedupe

**Status:** COMPLETE  
**Date:** 2026-02-08

**Summary:**  
Completed uniqueness hygiene on Supabase. Identified and removed redundant `uidx_*` indexes that duplicated existing UNIQUE constraint backing indexes.

**Tables affected:**

- `request_nonces` – kept `request_nonces_runtime_id_request_id_key`, dropped `uidx_request_nonces_runtime_request`
- `tool_registry` – kept `tool_registry_name_key`, dropped `uidx_tool_registry_name`

**Artifacts:**

- Migration: `supabase/migrations/20260208000001_cto_os_v124_uniqueness_constraints.sql`
- Evidence: `docs/db/cto-os-v1.2.4-uniqueness-evidence.md`

**Impact:** No functional behavior change; reduces redundant index maintenance overhead.
