CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
      NULLIF(NEW.raw_user_meta_data->>'picture', '')
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT
  u.id,
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    NULLIF(u.raw_user_meta_data->>'name', ''),
    split_part(u.email, '@', 1)
  ),
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(u.raw_user_meta_data->>'picture', '')
  )
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.barbershops FROM anon;
REVOKE ALL ON public.customers FROM anon;
REVOKE ALL ON public.services FROM anon;
REVOKE ALL ON public.employees FROM anon;
REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.payments FROM anon;
REVOKE ALL ON public.expenses FROM anon;
REVOKE ALL ON public.products FROM anon;
REVOKE ALL ON public.stock_movements FROM anon;

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