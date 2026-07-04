ALTER TABLE public.barbershops
ADD COLUMN IF NOT EXISTS business_hours JSONB;