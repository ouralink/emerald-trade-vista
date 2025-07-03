-- Create the api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  key_type TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up RLS for the api_keys table
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies for api_keys
DROP POLICY IF EXISTS "Admins can manage API keys" ON public.api_keys;

CREATE POLICY "Admins can manage API keys" ON public.api_keys
  FOR ALL USING (public.get_current_user_role() = 'admin');
