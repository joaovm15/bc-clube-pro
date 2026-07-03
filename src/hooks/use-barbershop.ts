import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DayHours = { closed: boolean; open: string; close: string };
export type BusinessHours = Record<
  "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
  DayHours
>;

export type Barbershop = {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  business_hours: BusinessHours | null;
};

async function ensureBarbershop(): Promise<Barbershop> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Não autenticado");

  const existing = await supabase
    .from("barbershops")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as Barbershop;

  const defaultName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Minha Barbearia";

  const created = await supabase
    .from("barbershops")
    .insert({ owner_id: user.id, name: `Barbearia ${defaultName}` })
    .select("*")
    .single();
  if (created.error) throw created.error;
  return created.data as Barbershop;
}

export function useBarbershop() {
  return useQuery({
    queryKey: ["barbershop"],
    queryFn: ensureBarbershop,
    staleTime: 1000 * 60 * 5,
  });
}
