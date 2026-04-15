-- Migration: 20260415143000_disable_rls.sql
-- Created: 2026-04-15
-- Description: Disable Row Level Security on all tables.
--              Authorization is handled entirely by the Express API server,
--              not at the database level. The Supabase publishable key is used
--              server-side only and never exposed to end users.

ALTER TABLE bills        DISABLE ROW LEVEL SECURITY;
ALTER TABLE split_items  DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
