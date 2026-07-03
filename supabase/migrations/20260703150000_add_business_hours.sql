-- Add business hours storage to barbershops
ALTER TABLE public.barbershops
  ADD COLUMN business_hours JSONB;

COMMENT ON COLUMN public.barbershops.business_hours IS
  'Per-weekday opening hours, e.g. {"mon":{"closed":false,"open":"09:00","close":"19:00"}, ...}';
