
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS zoom_meeting_link text;

CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  email text,
  role text,
  company text,
  scenario_tested text,
  most_useful_button text,
  least_useful_button text,
  usefulness_rating int,
  accuracy_rating int,
  clarity_rating int,
  would_use_again text,
  would_pay text,
  confusing_parts text,
  missing_features text,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.beta_feedback TO authenticated;
GRANT ALL ON public.beta_feedback TO service_role;

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback self insert" ON public.beta_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback self select" ON public.beta_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
