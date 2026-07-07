import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Receipt, TrendingDown, CalendarDays } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

export const Route = createFileRoute("/_authenticated/app/despesas")({
  head: () => ({ meta: [{ title: "Despesas — BC CLUBE" }] }),
  component: DespesasPage,
});

type Expense = {
  id: string;
  barbershop_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string | null;
  recurring: boolean;
  notes: string | null;
};

const CATEGORIES = [
  { value: "aluguel", label: "Aluguel" },
  { value: "energia", label: "Energia" },
  { value: "agua", label: "Água" },
  { value: "internet", label: "Internet" },
  { value: "produtos", label: "Produtos" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "marketing", label: "Marketing" },
  { value: "salarios", label: "Salários" },
  { value: "impostos", label: "Impostos" },
  { value: "outros", label: "Outros" },
];

const METHODS = ["dinheiro", "pix", "cartao_debito", "cartao_credito", "boleto", "transferencia"];

const schema = z.object({
  category: z.string().min(1),
  description: z.string().trim().min(2, "Descreva a despesa").max(200),
  amount: z.coerce.number().min(0.01, "Valor inválido"),
  expense_date: z.string().min(1, "Selecione uma data"),
  payment_method: z.string().optional(),
  recurring: z.boolean(),
  notes: z.string().max(500).optional(),
});

const CURRENCY = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function DespesasPage() {
  const { data: shop } = useBarbershop();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("barbershop_id", shop!.id)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!shop?.id,
  });

  const filtered = useMemo(
    () => (filterCategory === "all" ? expenses : expenses.filter((e) => e.category === filterCategory)),
    [expenses, filterCategory],
  );

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().slice(0, 10);
  const monthEnd = endOfMonth(now).toISOString().slice(0, 10);
  const monthTotal = expenses
    .filter((e) => e.expense_date >= monthStart && e.expense_date <= monthEnd)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const recurringTotal = expenses.filter((e) => e.recurring).reduce((s, e) => s + Number(e.amount), 0);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Despesa removida");
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Controle</p>
          <h1 className="font-display text-3xl text-ivory">Despesas</h1>
          <p className="text-sm text-silver/70">Categorize e acompanhe todas as saídas.</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="mr-2 h-4 w-4" /> Nova despesa
            </Button>
          </DialogTrigger>
          <ExpenseDialog
            key={editing?.id ?? "new"}
            editing={editing}
            barbershopId={shop?.id}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Este mês"
          value={CURRENCY.format(monthTotal)}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          label="Recorrentes"
          value={CURRENCY.format(recurringTotal)}
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatCard
          label="Total geral"
          value={CURRENCY.format(total)}
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>

      <div className="flex items-center gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-56 bg-secondary/40 border-border/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-silver/60">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="bc-card p-12 text-center">
          <Receipt className="mx-auto h-8 w-8 text-gold/70" />
          <h3 className="mt-4 font-display text-xl text-ivory">Nenhuma despesa registrada</h3>
          <p className="mt-2 text-sm text-silver/70">
            Comece adicionando os custos fixos e variáveis da sua barbearia.
          </p>
        </div>
      ) : (
        <div className="bc-card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-[10px] uppercase tracking-widest text-silver/50">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-silver/80 whitespace-nowrap">
                    {format(new Date(e.expense_date + "T12:00:00"), "dd MMM yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-ivory">
                    {e.description}
                    {e.recurring && (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-gold">recorrente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-silver/70 capitalize">
                    {CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category}
                  </td>
                  <td className="px-4 py-3 text-silver/60 capitalize text-xs">
                    {(e.payment_method ?? "—").replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-destructive">
                    − {CURRENCY.format(Number(e.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-silver hover:text-gold"
                        onClick={() => {
                          setEditing(e);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-silver hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover despesa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{e.description}" será excluída permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(e.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bc-card p-5">
      <div className="flex items-center justify-between text-silver/60">
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
        <span className="text-gold">{icon}</span>
      </div>
      <p className="mt-2 font-display text-2xl text-ivory">{value}</p>
    </div>
  );
}

function ExpenseDialog({
  editing,
  barbershopId,
  onClose,
}: {
  editing: Expense | null;
  barbershopId?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [category, setCategory] = useState(editing?.category ?? "outros");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [amount, setAmount] = useState(String(editing?.amount ?? ""));
  const [expenseDate, setExpenseDate] = useState(
    editing?.expense_date ?? new Date().toISOString().slice(0, 10),
  );
  const [paymentMethod, setPaymentMethod] = useState(editing?.payment_method ?? "dinheiro");
  const [recurring, setRecurring] = useState(editing?.recurring ?? false);
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        category,
        description,
        amount,
        expense_date: expenseDate,
        payment_method: paymentMethod,
        recurring,
        notes,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!barbershopId) throw new Error("Barbearia não carregada");

      const payload = {
        ...parsed.data,
        notes: parsed.data.notes || null,
      };

      if (editing) {
        const { error } = await supabase.from("expenses").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("expenses")
          .insert({ ...payload, barbershop_id: barbershopId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Despesa atualizada" : "Despesa adicionada");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">
          {editing ? "Editar despesa" : "Nova despesa"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="d-desc">Descrição</Label>
          <Input id="d-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Aluguel novembro" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-amount">Valor (R$)</Label>
            <Input id="d-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-date">Data</Label>
            <Input id="d-date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Pagamento</Label>
            <Select value={paymentMethod ?? "dinheiro"} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2.5">
          <div>
            <Label htmlFor="d-rec" className="text-sm">Despesa recorrente</Label>
            <p className="text-xs text-silver/50">Repete todo mês (fixa)</p>
          </div>
          <Switch id="d-rec" checked={recurring} onCheckedChange={setRecurring} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-notes">Observações</Label>
          <Textarea id="d-notes" value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
