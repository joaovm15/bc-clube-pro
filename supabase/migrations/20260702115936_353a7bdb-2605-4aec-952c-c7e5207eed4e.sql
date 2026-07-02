
-- ============ SERVICES ============
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  image_url TEXT,
  color TEXT DEFAULT '#D4AF37',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view services" ON public.services FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners insert services" ON public.services FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners update services" ON public.services FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners delete services" ON public.services FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birthday DATE,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view customers" ON public.customers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners insert customers" ON public.customers FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners update customers" ON public.customers FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners delete customers" ON public.customers FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE TRIGGER customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX customers_barbershop_idx ON public.customers(barbershop_id);

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  employee_id UUID,
  customer_name_snapshot TEXT,
  service_name_snapshot TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | done | canceled | no_show
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view appointments" ON public.appointments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners insert appointments" ON public.appointments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners update appointments" ON public.appointments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners delete appointments" ON public.appointments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid()));
CREATE TRIGGER appointments_updated BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX appointments_barbershop_start_idx ON public.appointments(barbershop_id, start_at);
