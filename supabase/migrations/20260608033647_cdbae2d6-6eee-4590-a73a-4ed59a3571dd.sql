ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS zoom_auth_status text NOT NULL DEFAULT 'not_connected',
  ADD COLUMN IF NOT EXISTS zoom_auth_connected_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS zoom_auth_email text NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_zoom_auth_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_zoom_auth_status_check
  CHECK (zoom_auth_status IN ('not_connected','pending','connected','error'));