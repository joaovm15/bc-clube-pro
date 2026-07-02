import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User as UserIcon,
  Scissors,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { addDays, format, startOfDay, endOfDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/hooks/use-barbershop";

export const Route = createFileRoute("/_authenticated/app/agenda")({
  head: () => ({ meta: [{ title: "Agenda — BC CLUBE" }] }),
  component: AgendaPage,
});

type Appointment = {
  id: string;
  barbershop_id: string;
  customer_id: string | null;
  service_id: string | null;
  customer_name_snapshot: string | null;
  service_name_snapshot: string | null;
  start_at: string;
  end_at: string;
  status: string;
  price: number;
  notes: string | null;
};

type Customer = { id: string; name: string };
type Service = { id: string; name: string; price: number; duration_minutes: number; color: string | null };

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendado",
  done: "Concluído",
  canceled: "Cancelado",
  no_show: "Não compareceu",
};

const CURRENCY = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function AgendaPage() {
  const { data: shop } = useBarbershop();
  const qc = useQueryClient();
  const [day, setDay] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);

  const dayKey = format(day, "yyyy-MM-dd");

  const { data: appts = [], isLoading } = useQuery({
    queryKey: ["appointments", shop?.id, dayKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("barbershop_id", shop!.id)
        .gte("start_at", startOfDay(day).toISOString())
        .lte("start_at", endOfDay(day).toISOString())
        .order("start_at", { ascending: true });
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!shop?.id,
  });

  const totals = useMemo(() => {
    const scheduled = appts.filter((a) => a.status === "scheduled").length;
    const done = appts.filter((a) => a.status === "done");
    const revenue = done.reduce((sum, a) => sum + Number(a.price), 0);
    return { count: appts.length, scheduled, done: done.length, revenue };
  }, [appts]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Agenda</p>
          <h1 className="font-display text-3xl text-ivory">
            {isToday(day) ? "Hoje" : format(day, "EEEE", { locale: ptBR })}
          </h1>
          <p className="text-sm text-silver/70 capitalize">
            {format(day, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bc-card px-1 py-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-silver hover:text-gold" onClick={() => setDay(addDays(day, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-silver hover:text-gold" onClick={() => setDay(new Date())}>
              Hoje
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-silver hover:text-gold" onClick={() => setDay(addDays(day, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo agendamento
              </Button>
            </DialogTrigger>
            <AppointmentDialog
              day={day}
              barbershopId={shop?.id}
              onClose={() => setOpen(false)}
            />
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Agendamentos" value={String(totals.count)} icon={<CalendarDays className="h-4 w-4" />} />
        <StatCard label="Pendentes" value={String(totals.scheduled)} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Concluídos" value={String(totals.done)} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Faturamento" value={CURRENCY.format(totals.revenue)} icon={<span className="text-gold text-sm font-semibold">R$</span>} accent />
      </div>

      {isLoading ? (
        <p className="text-sm text-silver/60">Carregando...</p>
      ) : appts.length === 0 ? (
        <div className="bc-card p-12 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-gold/70" />
          <h3 className="mt-4 font-display text-xl text-ivory">Nenhum agendamento para este dia</h3>
          <p className="mt-2 text-sm text-silver/70">Toque em "Novo agendamento" para começar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {appts.map((a) => (
            <AppointmentRow
              key={a.id}
              appt={a}
              onChange={() => qc.invalidateQueries({ queryKey: ["appointments"] })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="bc-card p-4">
      <div className="flex items-center justify-between text-silver/60">
        <span className="text-[11px] uppercase tracking-widest">{label}</span>
        <span className={accent ? "text-gold" : "text-silver/50"}>{icon}</span>
      </div>
      <p className={`mt-2 font-display text-2xl ${accent ? "bc-gold-text" : "text-ivory"}`}>{value}</p>
    </div>
  );
}

function AppointmentRow({ appt, onChange }: { appt: Appointment; onChange: () => void }) {
  const start = new Date(appt.start_at);
  const end = new Date(appt.end_at);

  const update = useMutation({
    mutationFn: async (patch: Partial<Appointment>) => {
      const { error } = await supabase.from("appointments").update(patch).eq("id", appt.id);
      if (error) throw error;
    },
    onSuccess: () => {
      onChange();
      toast.success("Agendamento atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("appointments").delete().eq("id", appt.id);
      if (error) throw error;
    },
    onSuccess: () => {
      onChange();
      toast.success("Agendamento removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusColor =
    appt.status === "done"
      ? "text-emerald-400 border-emerald-400/30"
      : appt.status === "canceled" || appt.status === "no_show"
        ? "text-red-400 border-red-400/30"
        : "text-gold border-gold/30";

  return (
    <div className="bc-card p-4 flex flex-wrap items-center gap-4">
      <div className="text-center min-w-[70px]">
        <p className="font-display text-2xl bc-gold-text leading-none">{format(start, "HH:mm")}</p>
        <p className="text-[10px] uppercase tracking-widest text-silver/50 mt-1">
          {format(end, "HH:mm")}
        </p>
      </div>
      <div className="h-12 w-px bg-border/50" />
      <div className="flex-1 min-w-[180px]">
        <p className="font-medium text-ivory flex items-center gap-2">
          <UserIcon className="h-3.5 w-3.5 text-gold/60" />
          {appt.customer_name_snapshot || "Cliente"}
        </p>
        <p className="text-xs text-silver/70 mt-0.5 flex items-center gap-2">
          <Scissors className="h-3 w-3 text-gold/50" />
          {appt.service_name_snapshot || "Serviço"} · {CURRENCY.format(Number(appt.price))}
        </p>
      </div>
      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${statusColor}`}>
        {STATUS_LABEL[appt.status] ?? appt.status}
      </span>
      <div className="flex gap-1">
        {appt.status !== "done" && (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-silver hover:text-emerald-400"
            onClick={() => update.mutate({ status: "done" })}
            title="Marcar como concluído">
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
        {appt.status !== "canceled" && (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-silver hover:text-red-400"
            onClick={() => update.mutate({ status: "canceled" })}
            title="Cancelar">
            <XCircle className="h-4 w-4" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8 text-silver hover:text-destructive"
          onClick={() => remove.mutate()}
          title="Remover">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AppointmentDialog({
  day,
  barbershopId,
  onClose,
}: {
  day: Date;
  barbershopId?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [time, setTime] = useState<string>(format(new Date().setMinutes(0), "HH:mm"));
  const [notes, setNotes] = useState("");

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-lite", barbershopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("barbershop_id", barbershopId!)
        .order("name");
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!barbershopId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services-lite", barbershopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration_minutes, color")
        .eq("barbershop_id", barbershopId!)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!barbershopId,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!barbershopId) throw new Error("Barbearia não carregada");
      if (!customerId) throw new Error("Selecione um cliente");
      if (!serviceId) throw new Error("Selecione um serviço");
      if (!time) throw new Error("Informe o horário");

      const customer = customers.find((c) => c.id === customerId);
      const service = services.find((s) => s.id === serviceId);
      if (!service || !customer) throw new Error("Dados inválidos");

      const [h, m] = time.split(":").map(Number);
      const start = new Date(day);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + service.duration_minutes * 60 * 1000);

      const { error } = await supabase.from("appointments").insert({
        barbershop_id: barbershopId,
        customer_id: customer.id,
        service_id: service.id,
        customer_name_snapshot: customer.name,
        service_name_snapshot: service.name,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        price: service.price,
        notes: notes || null,
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento criado");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const noCustomers = customers.length === 0;
  const noServices = services.length === 0;

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">Novo agendamento</DialogTitle>
      </DialogHeader>
      {(noCustomers || noServices) && (
        <div className="rounded-md border border-gold/30 bg-gold/5 p-3 text-sm text-silver">
          Antes de agendar, cadastre pelo menos {noCustomers && "um cliente"}
          {noCustomers && noServices && " e "}
          {noServices && "um serviço"}.
        </div>
      )}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Serviço</Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger><SelectValue placeholder="Selecionar serviço" /></SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} · {CURRENCY.format(s.price)} · {s.duration_minutes}min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input value={format(day, "dd/MM/yyyy")} readOnly className="bg-secondary/40" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-time">Horário</Label>
            <Input id="a-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-notes">Observações</Label>
          <Textarea id="a-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Agendar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
