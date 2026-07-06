import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Clock, LogOut, Save, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop, type BusinessHours, type DayHours } from "@/hooks/use-barbershop";

export const Route = createFileRoute("/_authenticated/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — BC CLUBE" }] }),
  component: ConfiguracoesPage,
});

const DAYS: { key: keyof BusinessHours; label: string }[] = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const DEFAULT_DAY: DayHours = { closed: false, open: "09:00", close: "19:00" };
const DEFAULT_HOURS: BusinessHours = DAYS.reduce((acc, d) => {
  acc[d.key] = d.key === "sun" ? { ...DEFAULT_DAY, closed: true } : { ...DEFAULT_DAY };
  return acc;
}, {} as BusinessHours);

function ConfiguracoesPage() {
  const { data: shop } = useBarbershop();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!shop) return;
    setName(shop.name ?? "");
    setPhone(shop.phone ?? "");
    setAddress(shop.address ?? "");
    setHours({ ...DEFAULT_HOURS, ...(shop.business_hours ?? {}) });
  }, [shop]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!shop?.id) throw new Error("Barbearia não encontrada");
      const { error } = await supabase
        .from("barbershops")
        .update({
          name: name.trim() || "Minha Barbearia",
          phone: phone.trim() || null,
          address: address.trim() || null,
        })
        .eq("id", shop.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados da barbearia atualizados");
      qc.invalidateQueries({ queryKey: ["barbershop"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveHours = useMutation({
    mutationFn: async () => {
      if (!shop?.id) throw new Error("Barbearia não encontrada");
      const { error } = await supabase
        .from("barbershops")
        .update({ business_hours: hours })
        .eq("id", shop.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Horários de funcionamento salvos");
      qc.invalidateQueries({ queryKey: ["barbershop"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function updateDay(key: keyof BusinessHours, patch: Partial<DayHours>) {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Configurações</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl text-ivory">
          Configurações
        </h1>
        <p className="mt-2 text-silver/70 max-w-2xl">
          Dados da barbearia, horários de funcionamento e sua conta.
        </p>
      </div>

      {/* Dados da barbearia */}
      <section className="bc-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md border border-gold/25 bg-gold/5 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-gold" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-display text-xl text-ivory">Dados da barbearia</h2>
            <p className="text-xs text-silver/60">Essas informações aparecem para seus clientes.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="shop-name">Nome da barbearia</Label>
            <Input
              id="shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Barbearia do João"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-phone">Telefone / WhatsApp</Label>
            <Input
              id="shop-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(21) 99999-0000"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="shop-address">Endereço</Label>
            <Input
              id="shop-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro — cidade"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveProfile.isPending ? "Salvando..." : "Salvar dados"}
          </Button>
        </div>
      </section>

      {/* Horários de funcionamento */}
      <section className="bc-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md border border-gold/25 bg-gold/5 flex items-center justify-center">
            <Clock className="h-4 w-4 text-gold" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-display text-xl text-ivory">Horários de funcionamento</h2>
            <p className="text-xs text-silver/60">Defina os dias e horários em que sua barbearia atende.</p>
          </div>
        </div>

        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const day = hours[key];
            return (
              <div
                key={key}
                className="flex flex-wrap items-center gap-4 border-b border-border/40 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3 w-36 shrink-0">
                  <Switch
                    checked={!day.closed}
                    onCheckedChange={(checked) => updateDay(key, { closed: !checked })}
                  />
                  <span className="text-sm text-ivory">{label}</span>
                </div>
                {day.closed ? (
                  <span className="text-xs uppercase tracking-widest text-silver/50">Fechado</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={day.open}
                      onChange={(e) => updateDay(key, { open: e.target.value })}
                      className="w-28 bg-secondary/40 border-border/60"
                    />
                    <span className="text-silver/50 text-sm">até</span>
                    <Input
                      type="time"
                      value={day.close}
                      onChange={(e) => updateDay(key, { close: e.target.value })}
                      className="w-28 bg-secondary/40 border-border/60"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => saveHours.mutate()} disabled={saveHours.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveHours.isPending ? "Salvando..." : "Salvar horários"}
          </Button>
        </div>
      </section>

      {/* Conta */}
      <section className="bc-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md border border-gold/25 bg-gold/5 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-gold" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-display text-xl text-ivory">Conta</h2>
            <p className="text-xs text-silver/60">Acesso ao BC CLUBE.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-silver/60">E-mail de acesso</p>
            <p className="mt-1 text-sm text-ivory">{email || "—"}</p>
          </div>
          <Button variant="outline" className="text-destructive border-destructive/30" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </section>
    </div>
  );
}
