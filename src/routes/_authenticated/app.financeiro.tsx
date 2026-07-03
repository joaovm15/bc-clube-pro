import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/hooks/use-barbershop";

export const Route = createFileRoute("/_authenticated/app/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — BC CLUBE" }] }),
  component: FinanceiroPage,
});

type Employee = { id: string; name: string; commission_percent: number; color: string | null };
type Customer = { id: string; name: string };
type Payment = {
  id: string;
  amount: number;
  commission_amount: number;
  payment_method: string;
  payment_date: string;
  description: string | null;
  employee_id: string | null;
  customer_id: string | null;
};
type Expense = { amount: number; expense_date: string };

const METHODS = ["dinheiro", "pix", "cartao_debito", "cartao_credito", "boleto", "transferencia"];

const schema = z.object({
  amount: z.coerce.number().min(0.01, "Valor inválido"),
  payment_date: z.string().min(1),
  payment_method: z.string().min(1),
  description: z.string().max(200).optional(),
  employee_id: z.string().optional(),
  customer_id: z.string().optional(),
  commission_amount: z.coerce.number().min(0),
});

const CURRENCY = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function FinanceiroPage() {
  const { data: shop } = useBarbershop();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: payments = [] } = useQuery({
    queryKey: ["payments", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("barbershop_id", shop!.id)
        .order("payment_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!shop?.id,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount,expense_date")
        .eq("barbershop_id", shop!.id);
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!shop?.id,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id,name,commission_percent,color")
        .eq("barbershop_id", shop!.id)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!shop?.id,
  });

  const now = new Date();
  const mStart = startOfMonth(now).toISOString().slice(0, 10);
  const mEnd = endOfMonth(now).toISOString().slice(0, 10);
  const revenueMonth = payments
    .filter((p) => p.payment_date >= mStart && p.payment_date <= mEnd)
    .reduce((s, p) => s + Number(p.amount), 0);
  const expenseMonth = expenses
    .filter((e) => e.expense_date >= mStart && e.expense_date <= mEnd)
    .reduce((s, e) => s + Number(e.amount), 0);
  const profitMonth = revenueMonth - expenseMonth;
  const commissionMonth = payments
    .filter((p) => p.payment_date >= mStart && p.payment_date <= mEnd)
    .reduce((s, p) => s + Number(p.commission_amount), 0);

  const commissionByEmployee = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      if (p.payment_date < mStart || p.payment_date > mEnd) continue;
      if (!p.employee_id) continue;
      map.set(p.employee_id, (map.get(p.employee_id) ?? 0) + Number(p.commission_amount));
    }
    return employees
      .map((e) => ({ ...e, total: map.get(e.id) ?? 0 }))
      .sort((a, b) => b.total - a.total);
  }, [payments, employees, mStart, mEnd]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pagamento removido");
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Controle Financeiro</p>
          <h1 className="font-display text-3xl text-ivory">Financeiro</h1>
          <p className="text-sm text-silver/70">
            Receitas, comissões e lucro em tempo real.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Registrar pagamento
            </Button>
          </DialogTrigger>
          <PaymentDialog
            barbershopId={shop?.id}
            employees={employees}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Receita do mês" value={CURRENCY.format(revenueMonth)} icon={<TrendingUp />} tone="gold" />
        <KpiCard label="Despesas do mês" value={CURRENCY.format(expenseMonth)} icon={<TrendingDown />} tone="danger" />
        <KpiCard label="Comissões" value={CURRENCY.format(commissionMonth)} icon={<Wallet />} />
        <KpiCard
          label="Lucro líquido"
          value={CURRENCY.format(profitMonth)}
          icon={<DollarSign />}
          tone={profitMonth >= 0 ? "gold" : "danger"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bc-card p-5 lg:col-span-2">
          <h3 className="font-display text-lg text-ivory mb-4">Últimos pagamentos</h3>
          {payments.length === 0 ? (
            <p className="text-sm text-silver/60 py-8 text-center">Nenhum pagamento registrado.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {payments.slice(0, 12).map((p) => {
                const emp = employees.find((e) => e.id === p.employee_id);
                return (
                  <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-ivory truncate">
                        {p.description || "Atendimento"}
                      </p>
                      <p className="text-xs text-silver/50">
                        {format(new Date(p.payment_date + "T12:00:00"), "dd MMM", { locale: ptBR })}
                        {emp && ` · ${emp.name}`}
                        {" · "}
                        <span className="capitalize">{p.payment_method.replace("_", " ")}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-gold font-medium">+ {CURRENCY.format(Number(p.amount))}</p>
                      {Number(p.commission_amount) > 0 && (
                        <p className="text-[10px] text-silver/50">
                          comissão {CURRENCY.format(Number(p.commission_amount))}
                        </p>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-silver hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover pagamento?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove.mutate(p.id)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bc-card p-5">
          <h3 className="font-display text-lg text-ivory mb-4">Comissões do mês</h3>
          {commissionByEmployee.length === 0 ? (
            <p className="text-sm text-silver/60 py-8 text-center">Sem funcionários cadastrados.</p>
          ) : (
            <ul className="space-y-3">
              {commissionByEmployee.map((emp) => (
                <li key={emp.id} className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center font-display text-xs text-black shrink-0"
                    style={{ background: emp.color || "#D4AF37" }}
                  >
                    {emp.name.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ivory truncate">{emp.name}</p>
                    <p className="text-[10px] text-silver/50">{emp.commission_percent}%</p>
                  </div>
                  <span className="text-gold text-sm font-medium">{CURRENCY.format(emp.total)}</span>
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
        <span className={`${color} [&>svg]:h-4 [&>svg]:w-4`}>{icon}</span>
      </div>
      <p className={`mt-2 font-display text-2xl ${color}`}>{value}</p>
    </div>
  );
}

function PaymentDialog({
  barbershopId,
  employees,
  onClose,
}: {
  barbershopId?: string;
  employees: Employee[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [description, setDescription] = useState("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [commissionAmount, setCommissionAmount] = useState("0");
  const [customerId] = useState<string>("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  useQuery({
    queryKey: ["customers-lite", barbershopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id,name")
        .eq("barbershop_id", barbershopId!)
        .order("name");
      if (error) throw error;
      setCustomers(data as Customer[]);
      return data;
    },
    enabled: !!barbershopId,
  });

  const handleEmployeeChange = (id: string) => {
    setEmployeeId(id);
    const emp = employees.find((e) => e.id === id);
    const amt = Number(amount) || 0;
    if (emp && amt > 0) {
      setCommissionAmount(((amt * emp.commission_percent) / 100).toFixed(2));
    }
  };
  const handleAmountChange = (v: string) => {
    setAmount(v);
    const emp = employees.find((e) => e.id === employeeId);
    const amt = Number(v) || 0;
    if (emp && amt > 0) {
      setCommissionAmount(((amt * emp.commission_percent) / 100).toFixed(2));
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        description,
        employee_id: employeeId,
        customer_id: customerId,
        commission_amount: commissionAmount,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!barbershopId) throw new Error("Barbearia não carregada");

      const { error } = await supabase.from("payments").insert({
        barbershop_id: barbershopId,
        amount: parsed.data.amount,
        payment_date: parsed.data.payment_date,
        payment_method: parsed.data.payment_method,
        description: parsed.data.description || null,
        employee_id: parsed.data.employee_id || null,
        customer_id: parsed.data.customer_id || null,
        commission_amount: parsed.data.commission_amount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pagamento registrado");
      qc.invalidateQueries({ queryKey: ["payments"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">Registrar pagamento</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-desc">Descrição</Label>
          <Input id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Corte + barba" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-amount">Valor (R$)</Label>
            <Input id="p-amount" type="number" step="0.01" value={amount} onChange={(e) => handleAmountChange(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-date">Data</Label>
            <Input id="p-date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Funcionário</Label>
            <Select value={employeeId} onValueChange={handleEmployeeChange}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="p-comm">Comissão (R$)</Label>
            <Input id="p-comm" type="number" step="0.01" value={commissionAmount} onChange={(e) => setCommissionAmount(e.target.value)} />
            <p className="text-[10px] text-silver/50">Calculada automaticamente a partir do % do funcionário.</p>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Registrar"}
        </Button>
      </DialogFooter>
      {/* prevent unused warning */}
      <span className="hidden">{customers.length}</span>
    </DialogContent>
  );
}
