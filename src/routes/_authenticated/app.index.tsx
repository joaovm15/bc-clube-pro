import { createFileRoute } from "@tanstack/react-router";
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Receipt,
  Users,
  UserPlus,
  Scissors,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/")({
  component: DashboardPage,
});

const weekData = [
  { day: "Seg", value: 520 },
  { day: "Ter", value: 610 },
  { day: "Qua", value: 480 },
  { day: "Qui", value: 780 },
  { day: "Sex", value: 920 },
  { day: "Sáb", value: 1150 },
  { day: "Dom", value: 290 },
];

const monthExpenses = [
  { cat: "Aluguel", value: 1800 },
  { cat: "Produtos", value: 950 },
  { cat: "Energia", value: 420 },
  { cat: "Internet", value: 150 },
  { cat: "Mkt", value: 380 },
  { cat: "Outros", value: 240 },
];

function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            BC CLUBE
          </p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl text-ivory">
            Dashboard
          </h1>
          <p className="mt-1 text-silver/70">
            Visão geral da sua barbearia — hoje, {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Button>
          Ver relatório completo
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento do dia"
          value="R$ 1.150,00"
          delta="+12% vs ontem"
          up
          icon={DollarSign}
        />
        <KpiCard
          label="Faturamento da semana"
          value="R$ 4.750,00"
          delta="+18% vs semana anterior"
          up
          icon={TrendingUp}
        />
        <KpiCard
          label="Faturamento do mês"
          value="R$ 18.420,00"
          delta="+9% vs mês anterior"
          up
          icon={Wallet}
        />
        <KpiCard
          label="Lucro líquido"
          value="R$ 2.850,00"
          delta="+15% margem"
          up
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Despesas"
          value="R$ 1.900,00"
          delta="-4% vs semana"
          down
          icon={Receipt}
        />
        <KpiCard
          label="Clientes atendidos"
          value="87"
          delta="Esta semana"
          icon={Users}
          neutral
        />
        <KpiCard
          label="Novos clientes"
          value="12"
          delta="+3 esta semana"
          up
          icon={UserPlus}
        />
        <KpiCard
          label="Ticket médio"
          value="R$ 54,60"
          delta="+R$ 3,20"
          up
          icon={Scissors}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Faturamento da semana"
          subtitle="Últimos 7 dias"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weekData}>
              <defs>
                <linearGradient id="gold" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Faturamento"]}
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
        </ChartCard>

        <ChartCard title="Despesas por categoria" subtitle="Este mês">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthExpenses} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="#8a8a8a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="cat"
                stroke="#c0c0c0"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #2a2a2a",
                  borderRadius: 8,
                }}
                formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Valor"]}
              />
              <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Resumo + próximos agendamentos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bc-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gold">
                Resumo da Barbearia
              </p>
              <h2 className="mt-2 font-display text-2xl text-ivory">
                O que aconteceu por aqui
              </h2>
            </div>
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <ul className="mt-6 space-y-4 text-sm">
            {[
              "Hoje você faturou R$ 1.150,00.",
              "Você possui 8 clientes agendados para amanhã.",
              "Seu serviço mais vendido esta semana foi Corte + Barba.",
              "O funcionário com maior faturamento foi João Victor.",
              "Você gastou R$ 1.900,00 em despesas esta semana.",
            ].map((m) => (
              <li key={m} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                <span className="text-silver/85">{m}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bc-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gold">Próximos</p>
              <h2 className="mt-2 font-display text-2xl text-ivory">Agendamentos</h2>
            </div>
          </div>
          <ul className="mt-6 space-y-4">
            {[
              { time: "09:00", name: "Carlos Eduardo", svc: "Corte + Barba" },
              { time: "10:30", name: "Gabriel Souza", svc: "Corte Degradê" },
              { time: "14:00", name: "Matheus Lima", svc: "Barba" },
              { time: "15:30", name: "Rafael Alves", svc: "Corte + Barba" },
            ].map((a) => (
              <li
                key={a.time}
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
                    Confirmado
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  up,
  down,
  neutral,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  up?: boolean;
  down?: boolean;
  neutral?: boolean;
}) {
  const DeltaIcon = up ? TrendingUp : down ? TrendingDown : null;
  const deltaClass = up
    ? "text-emerald-400"
    : down
      ? "text-rose-400"
      : "text-silver/60";
  return (
    <div className="bc-card bc-card-hover p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-silver/60">{label}</p>
        <div className="h-8 w-8 rounded-md border border-gold/25 bg-gold/5 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gold" strokeWidth={1.75} />
        </div>
      </div>
      <p className="mt-4 font-display text-3xl text-ivory">{value}</p>
      <div className={`mt-2 flex items-center gap-1 text-xs ${deltaClass}`}>
        {DeltaIcon && <DeltaIcon className="h-3 w-3" />}
        <span>{delta}</span>
      </div>
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
