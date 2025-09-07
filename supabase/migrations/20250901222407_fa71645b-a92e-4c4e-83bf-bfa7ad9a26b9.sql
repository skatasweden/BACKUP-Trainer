-- Add pricing model columns to programs table
ALTER TABLE public.programs 
ADD COLUMN currency TEXT DEFAULT 'SEK',
ADD COLUMN billing_interval TEXT DEFAULT 'one_time',
ADD COLUMN billing_interval_count INTEGER DEFAULT 1;

-- Add check constraints for valid values
ALTER TABLE public.programs 
ADD CONSTRAINT programs_currency_check CHECK (currency IN ('SEK', 'USD', 'EUR')),
ADD CONSTRAINT programs_billing_interval_check CHECK (billing_interval IN ('one_time', 'monthly', 'weekly', 'daily')),
ADD CONSTRAINT programs_billing_interval_count_check CHECK (billing_interval_count > 0);

-- Add index for better query performance on currency and billing_interval
CREATE INDEX idx_programs_currency ON public.programs(currency);
CREATE INDEX idx_programs_billing_interval ON public.programs(billing_interval);