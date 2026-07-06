import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  DollarSign,
  Wallet,
  Receipt,
  Users,
  UserPlus,
  Scissors,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CalendarClock,
  Inbox,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/hooks/use-barbershop";

export const Route = createFileRoute("/_authenticated/app/")({
  component: DashboardPage,
});

type DashboardData = {
  revenueDay: number;
  revenueWeek: number;
  revenueMonth: number;
  expensesMonth: number;
  netProfit: number;
  clientsWeek: number;
  newClientsWeek: number;
  avgTicket: number;
  weekChart: { day: string; value: number }[];
  expensesChart: { cat: string; value: number }[];
  upcoming: {
    id: string;
    time: string;
    name: string;
    svc: string;
    status: string;
  }[];
  totalCustomers: number;
  totalServices: number;
  totalEmployees: number;
};

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function fetchDashboard(barbershopId: string): Promise<DashboardData> {
  const now = new Date();
  const today = startOfDay(now);
  const weekStart = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const isoDate = (d: Date) => d.toISOString().slice(0, 10);

  const [paymentsRes, expensesRes, customersRes, upcomingRes, servicesRes, employeesRes] =
    await Promise.all([
      supabase
        .from("payments")
        .select("amount, payment_date")
        .eq("barbershop_id", barbershopId)
        .gte("payment_date", isoDate(monthStart)),
      supabase
        .from("expenses")
        .select("amount, category, expense_date")
        .eq("barbershop_id", barbershopId)
        .gte("expense_date", isoDate(monthStart)),
      supabase
        .from("customers")
        .select("id, created_at", { count: "exact" })
        .eq("barbershop_id", barbershopId),
      supabase
        .from("appointments")
        .select("id, start_at, status, customer_name_snapshot, service_name_snapshot")
        .eq("barbershop_id", barbershopId)
        .gte("start_at", now.toISOString())
        .order("start_at", { ascending: true })
        .limit(6),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("barbershop_id", barbershopId),
      supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("barbershop_id", barbershopId)
        .eq("active", true),
    ]);

  if (paymentsRes.error) throw paymentsRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (customersRes.error) throw customersRes.error;
  if (upcomingRes.error) throw upcomingRes.error;

  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const customers = customersRes.data ?? [];

  let revenueDay = 0;
  let revenueWeek = 0;
  let revenueMonth = 0;
  const weekMap = new Map<string, number>();
  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    weekMap.set(isoDate(d), 0);
  }

  for (const p of payments) {
    const amt = Number(p.amount) || 0;
    revenueMonth += amt;
    const pd = new Date(p.payment_date + "T00:00:00");
    if (pd.getTime() === today.getTime()) revenueDay += amt;
    if (pd >= weekStart) revenueWeek += amt;
    const key = isoDate(pd);
    if (weekMap.has(key)) weekMap.set(key, (weekMap.get(key) ?? 0) + amt);
  }

  const weekChart = Array.from(weekMap.entries()).map(([iso, value]) => {
    const d = new Date(iso + "T00:00:00");
    return { day: dayLabels[d.getDay()], value };
  });

  let expensesMonth = 0;
  const expMap = new Map<string, number>();
  for (const e of expenses) {
    const amt = Number(e.amount) || 0;
    expensesMonth += amt;
    const cat = (e.category as string) || "Outros";
    expMap.set(cat, (expMap.get(cat) ?? 0) + amt);
  }
  const expensesChart = Array.from(expMap.entries())
    .map(([cat, value]) => ({ cat, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const clientIdsWeek = new Set<string>();
  let newClientsWeek = 0;
  for (const c of customers) {
    const created = new Date(c.created_at as string);
    if (created >= weekStart) newClientsWeek += 1;
  }

  // customers actually attended this week (from appointments)
  const attendedRes = await supabase
    .from("appointments")
    .select("customer_id")
    .eq("barbershop_id", barbershopId)
    .gte("start_at", weekStart.toISOString())
    .lte("start_at", now.toISOString())
    .in("status", ["completed", "confirmed", "done", "concluded"]);
  const attended = attendedRes.data ?? [];
  for (const a of attended) {
    if (a.customer_id) clientIdsWeek.add(a.customer_id as string);
  }
  const clientsWeek = clientIdsWeek.size;

  const paymentsCountMonth = payments.length;
  const avgTicket = paymentsCountMonth > 0 ? revenueMonth / paymentsCountMonth : 0;

  const upcoming = (upcomingRes.data ?? []).map((a) => {
    const dt = new Date(a.start_at as string);
    return {
      id: a.id as string,
      time: dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      name: (a.customer_name_snapshot as string) || "Cliente",
      svc: (a.service_name_snapshot as string) || "—",
      status: (a.status as string) || "scheduled",
    };
  });

  return {
    revenueDay,
    revenueWeek,
    revenueMonth,
    expensesMonth,
    netProfit: revenueMonth - expensesMonth,
    clientsWeek,
    newClientsWeek,
    avgTicket,
    weekChart,
    expensesChart,
    upcoming,
    totalCustomers: customersRes.count ?? customers.length,
    totalServices: servicesRes.count ?? 0,
    totalEmployees: employeesRes.count ?? 0,
  };
}

function DashboardPage() {
  const { data: shop, isLoading: shopLoading } = useBarbershop();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", shop?.id],
    queryFn: () => fetchDashboard(shop!.id),
    enabled: !!shop?.id,
  });

  const loading = shopLoading || isLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">BC CLUBE</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl text-ivory">Dashboard</h1>
          <p className="mt-1 text-silver/70">
            {shop?.name ?? "Sua barbearia"} — {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Link to="/app/relatorios">
          <Button>
            Ver relatório completo
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento do dia"
          value={loading ? "—" : fmtBRL(data?.revenueDay ?? 0)}
          icon={DollarSign}
        />
        <KpiCard
          label="Faturamento da semana"
          value={loading ? "—" : fmtBRL(data?.revenueWeek ?? 0)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Faturamento do mês"
          value={loading ? "—" : fmtBRL(data?.revenueMonth ?? 0)}
          icon={Wallet}
        />
        <KpiCard
          label="Lucro líquido (mês)"
          value={loading ? "—" : fmtBRL(data?.netProfit ?? 0)}
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Despesas do mês"
          value={loading ? "—" : fmtBRL(data?.expensesMonth ?? 0)}
          icon={Receipt}
        />
        <KpiCard
          label="Clientes atendidos (semana)"
          value={loading ? "—" : String(data?.clientsWeek ?? 0)}
          icon={Users}
        />
        <KpiCard
          label="Novos clientes (semana)"
          value={loading ? "—" : String(data?.newClientsWeek ?? 0)}
          icon={UserPlus}
        />
        <KpiCard
          label="Ticket médio (mês)"
          value={loading ? "—" : fmtBRL(data?.avgTicket ?? 0)}
          icon={Scissors}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Faturamento da semana"
          subtitle="Últimos 7 dias"
          className="lg:col-span-2"
        >
          {loading ? (
            <ChartSkeleton />
          ) : (data?.weekChart.reduce((s, d) => s + d.value, 0) ?? 0) === 0 ? (
            <EmptyChart label="Nenhum pagamento registrado nos últimos 7 dias" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data!.weekChart}>
                <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="#8a8a8a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8a8a8a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141414",
                    border: "1px solid #2a2a2a",
                    borderRadius: 8,
                    color: "#e5e5e5",
                  }}
                  formatter={(v: number) => [fmtBRL(v), "Faturamento"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#D4AF37", stroke: "#0D0D0D", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Despesas por categoria" subtitle="Este mês">
          {loading ? (
            <ChartSkeleton />
          ) : (data?.expensesChart.length ?? 0) === 0 ? (
            <EmptyChart label="Nenhuma despesa registrada este mês" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data!.expensesChart} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#8a8a8a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="cat"
                  stroke="#c0c0c0"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141414",
                    border: "1px solid #2a2a2a",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => [fmtBRL(v), "Valor"]}
                />
                <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bc-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gold">
                Resumo da Barbearia
              </p>
              <h2 className="mt-2 font-display text-2xl text-ivory">Visão geral</h2>
            </div>
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          {loading ? (
            <div className="mt-6 space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-secondary/40" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-secondary/40" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-secondary/40" />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <MiniStat label="Clientes cadastrados" value={data?.totalCustomers ?? 0} />
              <MiniStat label="Serviços cadastrados" value={data?.totalServices ?? 0} />
              <MiniStat label="Funcionários ativos" value={data?.totalEmployees ?? 0} />
            </div>
          )}
        </div>

        <div className="bc-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gold">Próximos</p>
              <h2 className="mt-2 font-display text-2xl text-ivory">Agendamentos</h2>
            </div>
            <CalendarClock className="h-5 w-5 text-gold" />
          </div>
          {loading ? (
            <div className="mt-6 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-secondary/40" />
              ))}
            </div>
          ) : (data?.upcoming.length ?? 0) === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
              <Inbox className="h-8 w-8 text-silver/40" />
              <p className="mt-3 text-sm text-silver/60">
                Nenhum agendamento futuro
              </p>
              <Link
                to="/app/agenda"
                className="mt-3 text-xs text-gold hover:underline"
              >
                Ir para a agenda
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {data!.upcoming.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm text-ivory">{a.name}</p>
                    <p className="text-xs text-silver/60">{a.svc}</p>
                  </div>
                  <div className="text-right">
                    <p className="bc-gold-text font-medium text-sm">{a.time}</p>
                    <Badge
                      variant="outline"
                      className="mt-1 border-gold/30 text-[10px] text-gold"
                    >
                      {a.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="bc-card bc-card-hover p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-silver/60">{label}</p>
        <div className="h-8 w-8 rounded-md border border-gold/25 bg-gold/5 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gold" strokeWidth={1.75} />
        </div>
      </div>
      <p className="mt-4 font-display text-3xl text-ivory">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bc-card p-6 ${className}`}>
      <div>
        <p className="text-xs uppercase tracking-widest text-gold">{title}</p>
        {subtitle && <p className="mt-1 text-sm text-silver/60">{subtitle}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-[280px] animate-pulse rounded bg-secondary/30" />;
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center text-center">
      <Inbox className="h-10 w-10 text-silver/30" />
      <p className="mt-3 text-sm text-silver/60">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/40 bg-secondary/20 p-4">
      <p className="text-xs uppercase tracking-widest text-silver/60">{label}</p>
      <p className="mt-2 font-display text-2xl text-ivory">{value}</p>
    </div>
  );
}
