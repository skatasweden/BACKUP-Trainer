-- Create payments_log table for webhook idempotency and payment tracking
CREATE TABLE IF NOT EXISTS public.payments_log (
  event_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID,
  type TEXT NOT NULL,
  amount_total INTEGER,
  currency TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payments_log
ALTER TABLE public.payments_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment logs
CREATE POLICY "Users can view own payment logs" ON public.payments_log
  FOR SELECT USING (auth.uid() = user_id);

-- Allow edge functions to insert payment logs (using service role)
CREATE POLICY "Service role can insert payment logs" ON public.payments_log
  FOR INSERT WITH CHECK (true);

-- Ensure program_access table has the right structure for secure payments
ALTER TABLE public.program_access 
  ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'purchased',
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'stripe';

-- Create index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_payments_log_event_id ON public.payments_log(event_id);
CREATE INDEX IF NOT EXISTS idx_program_access_stripe_session ON public.program_access(stripe_session_id);

-- Add constraint to prevent duplicate payments for same session
ALTER TABLE public.program_access 
  ADD CONSTRAINT unique_stripe_session_user 
  UNIQUE (user_id, stripe_session_id);