-- Create analytics_events table and recommended RLS/indexes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  event_name text NOT NULL,
  properties jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created ON public.analytics_events USING btree (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created ON public.analytics_events USING btree (event_name, created_at);

-- Recommended RLS: allow authenticated inserts where user_id is null or matches auth.uid()
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_analytics_for_authenticated ON public.analytics_events
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Optional GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties_gin ON public.analytics_events USING gin (properties);
