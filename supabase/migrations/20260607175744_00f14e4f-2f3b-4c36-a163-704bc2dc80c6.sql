
-- Enums
CREATE TYPE public.call_status AS ENUM ('draft','ready','live','completed','follow_up_done');
CREATE TYPE public.transcript_source AS ENUM ('manual','zoom_transcript_future');
CREATE TYPE public.risk_level AS ENUM ('green','yellow','red');

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- calls
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  company_name TEXT,
  contact_name TEXT,
  contact_role TEXT,
  call_type TEXT,
  call_datetime TIMESTAMPTZ,
  meeting_objective TEXT,
  business_context TEXT,
  what_i_need_to_learn TEXT,
  planned_questions TEXT,
  known_concerns TEXT,
  risks_to_watch TEXT,
  desired_outcome TEXT,
  deal_stage TEXT,
  authority_status TEXT,
  budget_status TEXT,
  notes TEXT,
  transcript_session_text TEXT,
  status public.call_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX calls_user_idx ON public.calls(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated;
GRANT ALL ON public.calls TO service_role;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calls self select" ON public.calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calls self insert" ON public.calls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calls self update" ON public.calls FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calls self delete" ON public.calls FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER calls_updated_at BEFORE UPDATE ON public.calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- transcript_chunks
CREATE TABLE public.transcript_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  transcript_text TEXT NOT NULL,
  source public.transcript_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX transcript_chunks_call_idx ON public.transcript_chunks(call_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transcript_chunks TO authenticated;
GRANT ALL ON public.transcript_chunks TO service_role;
ALTER TABLE public.transcript_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chunks self select" ON public.transcript_chunks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chunks self insert" ON public.transcript_chunks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chunks self update" ON public.transcript_chunks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chunks self delete" ON public.transcript_chunks FOR DELETE USING (auth.uid() = user_id);

-- live_insights
CREATE TABLE public.live_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action_button TEXT NOT NULL,
  signal_type TEXT,
  risk_level public.risk_level NOT NULL DEFAULT 'green',
  what_im_hearing TEXT,
  likely_true_intent TEXT,
  emotional_signal TEXT,
  hidden_risk TEXT,
  recommended_question TEXT,
  question_to_avoid TEXT,
  recommended_next_move TEXT,
  sequence_number INTEGER NOT NULL,
  transcript_chunk_id UUID REFERENCES public.transcript_chunks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (call_id, sequence_number)
);
CREATE INDEX live_insights_call_idx ON public.live_insights(call_id, sequence_number DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_insights TO authenticated;
GRANT ALL ON public.live_insights TO service_role;
ALTER TABLE public.live_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insights self select" ON public.live_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insights self insert" ON public.live_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insights self update" ON public.live_insights FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insights self delete" ON public.live_insights FOR DELETE USING (auth.uid() = user_id);

-- Sequence trigger: per-call monotonic sequence_number
CREATE OR REPLACE FUNCTION public.assign_insight_sequence()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.sequence_number IS NULL OR NEW.sequence_number = 0 THEN
    SELECT COALESCE(MAX(sequence_number), 0) + 1
      INTO NEW.sequence_number
    FROM public.live_insights
    WHERE call_id = NEW.call_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER live_insights_assign_sequence
  BEFORE INSERT ON public.live_insights
  FOR EACH ROW EXECUTE FUNCTION public.assign_insight_sequence();

-- after_call_outputs (one per call)
CREATE TABLE public.after_call_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL UNIQUE REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  meeting_purpose TEXT,
  client_situation TEXT,
  stated_problem TEXT,
  diagnosed_root_issue TEXT,
  client_provided_information TEXT,
  key_risks_constraints TEXT,
  decisions_made TEXT,
  open_questions TEXT,
  potential_scope TEXT,
  exclusions TEXT,
  recommended_next_step TEXT,
  follow_up_email_draft TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.after_call_outputs TO authenticated;
GRANT ALL ON public.after_call_outputs TO service_role;
ALTER TABLE public.after_call_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outputs self select" ON public.after_call_outputs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "outputs self insert" ON public.after_call_outputs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "outputs self update" ON public.after_call_outputs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "outputs self delete" ON public.after_call_outputs FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER after_call_outputs_updated_at BEFORE UPDATE ON public.after_call_outputs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
