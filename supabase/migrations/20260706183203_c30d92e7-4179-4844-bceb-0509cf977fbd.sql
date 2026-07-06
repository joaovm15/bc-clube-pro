REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.barbershops FROM PUBLIC;
REVOKE ALL ON public.customers FROM PUBLIC;
REVOKE ALL ON public.services FROM PUBLIC;
REVOKE ALL ON public.employees FROM PUBLIC;
REVOKE ALL ON public.appointments FROM PUBLIC;
REVOKE ALL ON public.payments FROM PUBLIC;
REVOKE ALL ON public.expenses FROM PUBLIC;
REVOKE ALL ON public.products FROM PUBLIC;
REVOKE ALL ON public.stock_movements FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barbershops TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.barbershops TO service_role;
GRANT ALL ON public.customers TO service_role;
GRANT ALL ON public.services TO service_role;
GRANT ALL ON public.employees TO service_role;
GRANT ALL ON public.appointments TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.expenses TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.stock_movements TO service_role;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Owners view their barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Owners insert their barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Owners update their barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Owners delete their barbershops" ON public.barbershops;
CREATE POLICY "Owners view their barbershops" ON public.barbershops FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert their barbershops" ON public.barbershops FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update their barbershops" ON public.barbershops FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete their barbershops" ON public.barbershops FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners view customers" ON public.customers;
DROP POLICY IF EXISTS "Owners insert customers" ON public.customers;
DROP POLICY IF EXISTS "Owners update customers" ON public.customers;
DROP POLICY IF EXISTS "Owners delete customers" ON public.customers;
CREATE POLICY "Owners view customers" ON public.customers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = customers.barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = customers.barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners update customers" ON public.customers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = customers.barbershop_id AND b.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = customers.barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners delete customers" ON public.customers FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = customers.barbershop_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Owners view services" ON public.services;
DROP POLICY IF EXISTS "Owners insert services" ON public.services;
DROP POLICY IF EXISTS "Owners update services" ON public.services;
DROP POLICY IF EXISTS "Owners delete services" ON public.services;
CREATE POLICY "Owners view services" ON public.services FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = services.barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = services.barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners update services" ON public.services FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = services.barbershop_id AND b.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = services.barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners delete services" ON public.services FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = services.barbershop_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Owners view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owners insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owners update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owners delete appointments" ON public.appointments;
CREATE POLICY "Owners view appointments" ON public.appointments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = appointments.barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners insert appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = appointments.barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners update appointments" ON public.appointments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = appointments.barbershop_id AND b.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = appointments.barbershop_id AND b.owner_id = auth.uid()));
CREATE POLICY "Owners delete appointments" ON public.appointments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = appointments.barbershop_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Owners manage their products" ON public.products;
DROP POLICY IF EXISTS "Owners manage their stock movements" ON public.stock_movements;
CREATE POLICY "Owners manage their products" ON public.products FOR ALL TO authenticated USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid())) WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE POLICY "Owners manage their stock movements" ON public.stock_movements FOR ALL TO authenticated USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid())) WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));