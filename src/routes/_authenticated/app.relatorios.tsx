import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, TrendingDown, Users } from "lucide-react";
import { subDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/hooks/use-barbershop";

export const Route = createFileRoute("/_authenticated/app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — BC CLUBE" }] }),
  component: RelatoriosPage,
});

const CURRENCY = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function RelatoriosPage() {
  const { data: shop } = useBarbershop();
  const from = startOfDay(subDays(new Date(), 29)).toISOString().slice(0, 10);

  const { data: payments = [] } = useQuery({
    queryKey: ["payments-report", shop?.id, from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount,commission_amount,payment_date,employee_id")
        .eq("barbershop_id", shop!.id)
        .gte("payment_date", from);
      if (error) throw error;
      return data as { amount: number; commission_amount: number; payment_date: string; employee_id: string | null }[];
    },
    enabled: !!shop?.id,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses-report", shop?.id, from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount,expense_date,category")
        .eq("barbershop_id", shop!.id)
        .gte("expense_date", from);
      if (error) throw error;
      return data as { amount: number; expense_date: string; category: string }[];
    },
    enabled: !!shop?.id,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appts-report", shop?.id, from],
    queryFn: async () => {
      const fromIso = new Date(from + "T00:00:00").toISOString();
      const { data, error } = await supabase
        .from("appointments")
        .select("service_name_snapshot,start_at,status,price,employee_id")
        .eq("barbershop_id", shop!.id)
        .gte("start_at", fromIso);
      if (error) throw error;
      return data as { service_name_snapshot: string | null; start_at: string; status: string; price: number; employee_id: string | null }[];
    },
    enabled: !!shop?.id,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id,name,color")
        .eq("barbershop_id", shop!.id);
      if (error) throw error;
      return data as { id: string; name: string; color: string | null }[];
    },
    enabled: !!shop?.id,
  });

  const daily = useMemo(() => {
    const map = new Map<string, { date: string; receita: number; despesa: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = subDays(new Date(), i).toISOString().slice(0, 10);
      map.set(d, { date: d, receita: 0, despesa: 0 });
    }
    for (const p of payments) {
      const row = map.get(p.payment_date);
      if (row) row.receita += Number(p.amount);
    }
    for (const e of expenses) {
      const row = map.get(e.expense_date);
      if (row) row.despesa += Number(e.amount);
    }
    return Array.from(map.values()).map((r) => ({
      ...r,
      label: format(new Date(r.date + "T12:00:00"), "dd/MM"),
    }));
  }, [payments, expenses]);

  const totals = useMemo(() => {
    const receita = payments.reduce((s, p) => s + Number(p.amount), 0);
    const despesa = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const comissao = payments.reduce((s, p) => s + Number(p.commission_amount), 0);
    return { receita, despesa, lucro: receita - despesa, comissao };
  }, [payments, expenses]);

  const topServices = useMemo(() => {
    const map = new Map<string, { name: string; count: number; total: number }>();
    for (const a of appointments) {
      if (a.status !== "done") continue;
      const key = a.service_name_snapshot ?? "Outro";
      const row = map.get(key) ?? { name: key, count: 0, total: 0 };
      row.count += 1;
      row.total += Number(a.price);
      map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [appointments]);

  const rankingEmployees = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of appointments) {
      if (a.status !== "done" || !a.employee_id) continue;
      map.set(a.employee_id, (map.get(a.employee_id) ?? 0) + Number(a.price));
    }
    return employees
      .map((e) => ({ name: e.name, color: e.color || "#D4AF37", total: map.get(e.id) ?? 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [appointments, employees]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries()).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
  }, [expenses]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold">Últimos 30 dias</p>
        <h1 className="font-display text-3xl text-ivory">Relatórios</h1>
        <p className="text-sm text-silver/70">Faturamento, lucro e desempenho da equipe.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Receita" value={CURRENCY.format(totals.receita)} icon={<TrendingUp className="h-4 w-4" />} tone="gold" />
        <Kpi label="Despesas" value={CURRENCY.format(totals.despesa)} icon={<TrendingDown className="h-4 w-4" />} tone="danger" />
        <Kpi label="Comissões" value={CURRENCY.format(totals.comissao)} icon={<Users className="h-4 w-4" />} />
        <Kpi label="Lucro" value={CURRENCY.format(totals.lucro)} icon={<BarChart3 className="h-4 w-4" />} tone={totals.lucro >= 0 ? "gold" : "danger"} />
      </div>

      <div className="bc-card p-5">
        <h3 className="font-display text-lg text-ivory mb-4">Receita × Despesas — 30 dias</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#0D0D0D", border: "1px solid #333", borderRadius: 8 }}
                formatter={(v: number) => CURRENCY.format(v)}
              />
              <Line type="monotone" dataKey="receita" stroke="#D4AF37" strokeWidth={2} dot={false} name="Receita" />
              <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2} dot={false} name="Despesa" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bc-card p-5">
          <h3 className="font-display text-lg text-ivory mb-4">Serviços mais vendidos</h3>
          {topServices.length === 0 ? (
            <p className="text-sm text-silver/60 py-8 text-center">Sem atendimentos concluídos.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" stroke="#888" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#888" fontSize={11} width={100} />
                  <Tooltip
                    contentStyle={{ background: "#0D0D0D", border: "1px solid #333", borderRadius: 8 }}
                    formatter={(v: number) => CURRENCY.format(v)}
                  />
                  <Bar dataKey="total" fill="#D4AF37" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bc-card p-5">
          <h3 className="font-display text-lg text-ivory mb-4">Ranking de funcionários</h3>
          {rankingEmployees.length === 0 ? (
            <p className="text-sm text-silver/60 py-8 text-center">Sem dados de equipe.</p>
          ) : (
            <ul className="space-y-3">
              {rankingEmployees.map((e, i) => (
                <li key={e.name} className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs text-silver/40">{i + 1}º</span>
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center font-display text-xs text-black shrink-0"
                    style={{ background: e.color }}
                  >
                    {e.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 min-w-0 text-sm text-ivory truncate">{e.name}</span>
                  <span className="text-gold text-sm font-medium">{CURRENCY.format(e.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bc-card p-5">
        <h3 className="font-display text-lg text-ivory mb-4">Despesas por categoria</h3>
        {expensesByCategory.length === 0 ? (
          <p className="text-sm text-silver/60 py-8 text-center">Sem despesas registradas.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {expensesByCategory.map((row) => (
              <div key={row.category} className="flex items-center justify-between rounded-md border border-border/40 bg-secondary/20 px-4 py-3">
                <span className="text-sm text-silver/80 capitalize">{row.category}</span>
                <span className="text-destructive text-sm font-medium">{CURRENCY.format(row.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs uppercase tracking-widest text-silver/40">
        Período: {format(new Date(from + "T12:00:00"), "dd MMM", { locale: ptBR })} — hoje
      </p>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "gold" | "danger";
}) {
  const color = tone === "danger" ? "text-destructive" : tone === "gold" ? "text-gold" : "text-ivory";
  return (
    <div className="bc-card p-5">
      <div className="flex items-center justify-between text-silver/60">
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className={`mt-2 font-display text-2xl ${color}`}>{value}</p>
    </div>
  );
}
