
-- Employees
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  role text DEFAULT 'barber',
  commission_percent numeric(5,2) NOT NULL DEFAULT 50,
  color text DEFAULT '#D4AF37',
  avatar_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select_employees" ON public.employees FOR SELECT TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE POLICY "owner_insert_employees" ON public.employees FOR INSERT TO authenticated
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE POLICY "owner_update_employees" ON public.employees FOR UPDATE TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE POLICY "owner_delete_employees" ON public.employees FOR DELETE TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_employees_barbershop ON public.employees(barbershop_id);

-- Expense categories (predefined enum-like text)
-- Expenses
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'outros',
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'dinheiro',
  recurring boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select_expenses" ON public.expenses FOR SELECT TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE POLICY "owner_insert_expenses" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE POLICY "owner_update_expenses" ON public.expenses FOR UPDATE TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE POLICY "owner_delete_expenses" ON public.expenses FOR DELETE TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_expenses_barbershop_date ON public.expenses(barbershop_id, expense_date DESC);

-- Payments: registered revenue tied to appointments or ad-hoc
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  description text,
  amount numeric(12,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'dinheiro',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select_payments" ON public.payments FOR SELECT TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE POLICY "owner_insert_payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE POLICY "owner_update_payments" ON public.payments FOR UPDATE TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE POLICY "owner_delete_payments" ON public.payments FOR DELETE TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid()));
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_payments_barbershop_date ON public.payments(barbershop_id, payment_date DESC);
CREATE INDEX idx_payments_employee ON public.payments(employee_id);
