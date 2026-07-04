import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/hooks/use-barbershop";

export const Route = createFileRoute("/_authenticated/app/estoque")({
  head: () => ({ meta: [{ title: "Estoque — BC CLUBE" }] }),
  component: EstoquePage,
});

type Product = {
  id: string;
  barbershop_id: string;
  name: string;
  sku: string | null;
  category: string | null;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  active: boolean;
};

const CURRENCY = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const schema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto").max(80),
  sku: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  cost_price: z.coerce.number().min(0),
  sale_price: z.coerce.number().min(0),
  stock_quantity: z.coerce.number().int().min(0),
  min_stock: z.coerce.number().int().min(0),
  unit: z.string().max(10),
  active: z.boolean(),
});

function EstoquePage() {
  const { data: shop } = useBarbershop();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState<{ product: Product; type: "in" | "out" } | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("barbershop_id", shop!.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!shop?.id,
  });

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.sku ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  const totals = useMemo(() => {
    const stockValue = products.reduce((s, p) => s + Number(p.cost_price) * p.stock_quantity, 0);
    const lowStock = products.filter((p) => p.stock_quantity <= p.min_stock && p.active).length;
    return { total: products.length, stockValue, lowStock };
  }, [products]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto removido");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Produtos</p>
          <h1 className="font-display text-3xl text-ivory">Estoque</h1>
          <p className="text-sm text-silver/70">Controle de produtos, entradas e saídas.</p>
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
              <Plus className="mr-2 h-4 w-4" /> Novo produto
            </Button>
          </DialogTrigger>
          <ProductDialog
            key={editing?.id ?? "new"}
            editing={editing}
            barbershopId={shop?.id}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Produtos" value={String(totals.total)} icon={<Package className="h-4 w-4" />} />
        <Kpi
          label="Valor em estoque"
          value={CURRENCY.format(totals.stockValue)}
          icon={<Package className="h-4 w-4" />}
          tone="gold"
        />
        <Kpi
          label="Estoque baixo"
          value={String(totals.lowStock)}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={totals.lowStock > 0 ? "danger" : undefined}
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver/50" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou SKU..."
          className="pl-9 bg-secondary/40 border-border/60"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-silver/60">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="bc-card p-12 text-center">
          <Package className="mx-auto h-8 w-8 text-gold/70" />
          <h3 className="mt-4 font-display text-xl text-ivory">Nenhum produto ainda</h3>
          <p className="mt-2 text-sm text-silver/70">
            Cadastre pomadas, shampoos e outros itens que sua barbearia usa ou vende.
          </p>
        </div>
      ) : (
        <div className="bc-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-silver/60 text-xs uppercase tracking-widest">
              <tr>
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Categoria</th>
                <th className="text-right px-4 py-3">Estoque</th>
                <th className="text-right px-4 py-3 hidden sm:table-cell">Custo</th>
                <th className="text-right px-4 py-3">Venda</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const low = p.stock_quantity <= p.min_stock;
                return (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-ivory font-medium">{p.name}</p>
                          {p.sku && <p className="text-xs text-silver/50">SKU: {p.sku}</p>}
                        </div>
                        {!p.active && (
                          <span className="text-[10px] uppercase tracking-widest text-silver/40 border border-border rounded px-1.5 py-0.5">
                            Inativo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-silver/70 capitalize">
                      {p.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={low ? "text-destructive font-medium" : "text-ivory"}>
                        {p.stock_quantity} {p.unit}
                      </span>
                      {low && (
                        <p className="text-[10px] uppercase tracking-widest text-destructive/80">
                          Baixo
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-silver/70">
                      {CURRENCY.format(p.cost_price)}
                    </td>
                    <td className="px-4 py-3 text-right text-gold font-medium">
                      {CURRENCY.format(p.sale_price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-silver hover:text-gold"
                          title="Entrada"
                          onClick={() => setMoving({ product: p, type: "in" })}
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-silver hover:text-destructive"
                          title="Saída"
                          onClick={() => setMoving({ product: p, type: "out" })}
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-silver hover:text-gold"
                          onClick={() => {
                            setEditing(p);
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
                              <AlertDialogTitle>Remover produto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O produto "{p.name}" e seu histórico serão excluídos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove.mutate(p.id)}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <MovementDialog moving={moving} onClose={() => setMoving(null)} shopId={shop?.id} />
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

function ProductDialog({
  editing,
  barbershopId,
  onClose,
}: {
  editing: Product | null;
  barbershopId?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(editing?.name ?? "");
  const [sku, setSku] = useState(editing?.sku ?? "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [cost, setCost] = useState(String(editing?.cost_price ?? "0"));
  const [sale, setSale] = useState(String(editing?.sale_price ?? "0"));
  const [qty, setQty] = useState(String(editing?.stock_quantity ?? "0"));
  const [minStock, setMinStock] = useState(String(editing?.min_stock ?? "0"));
  const [unit, setUnit] = useState(editing?.unit ?? "un");
  const [active, setActive] = useState(editing?.active ?? true);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        name,
        sku,
        category,
        cost_price: cost,
        sale_price: sale,
        stock_quantity: qty,
        min_stock: minStock,
        unit,
        active,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!barbershopId) throw new Error("Barbearia não carregada");

      const payload = {
        ...parsed.data,
        sku: parsed.data.sku || null,
        category: parsed.data.category || null,
      };

      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert({ ...payload, barbershop_id: barbershopId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Produto atualizado" : "Produto criado");
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">
          {editing ? "Editar produto" : "Novo produto"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Nome</Label>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pomada modeladora" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-sku">SKU / Código</Label>
            <Input id="p-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="POM-001" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-cat">Categoria</Label>
            <Input id="p-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Cosmético" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-cost">Preço de custo</Label>
            <Input id="p-cost" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-sale">Preço de venda</Label>
            <Input id="p-sale" type="number" step="0.01" value={sale} onChange={(e) => setSale(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-qty">Estoque</Label>
            <Input id="p-qty" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-min">Estoque mín.</Label>
            <Input id="p-min" type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-unit">Unidade</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger id="p-unit"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="un">un</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="cx">cx</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2.5">
          <Label htmlFor="p-active" className="text-sm">Produto ativo</Label>
          <Switch id="p-active" checked={active} onCheckedChange={setActive} />
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

function MovementDialog({
  moving,
  onClose,
  shopId,
}: {
  moving: { product: Product; type: "in" | "out" } | null;
  onClose: () => void;
  shopId?: string;
}) {
  const qc = useQueryClient();
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!moving || !shopId) throw new Error("Dados incompletos");
      const q = Number(qty);
      if (!Number.isFinite(q) || q <= 0) throw new Error("Quantidade inválida");

      const delta = moving.type === "in" ? q : -q;
      const newQty = moving.product.stock_quantity + delta;
      if (newQty < 0) throw new Error("Estoque insuficiente");

      const [{ error: mErr }, { error: uErr }] = await Promise.all([
        supabase.from("stock_movements").insert({
          barbershop_id: shopId,
          product_id: moving.product.id,
          movement_type: moving.type,
          quantity: q,
          note: note || null,
        }),
        supabase.from("products").update({ stock_quantity: newQty }).eq("id", moving.product.id),
      ]);
      if (mErr) throw mErr;
      if (uErr) throw uErr;
    },
    onSuccess: () => {
      toast.success("Movimentação registrada");
      qc.invalidateQueries({ queryKey: ["products"] });
      setQty("1");
      setNote("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!moving} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {moving?.type === "in" ? "Entrada de estoque" : "Saída de estoque"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border border-border/50 bg-secondary/20 px-3 py-2 text-sm">
            <p className="text-silver/60 text-xs uppercase tracking-widest">Produto</p>
            <p className="text-ivory">{moving?.product.name}</p>
            <p className="text-xs text-silver/60 mt-1">
              Estoque atual: {moving?.product.stock_quantity} {moving?.product.unit}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-qty">Quantidade</Label>
            <Input id="m-qty" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-note">Observação</Label>
            <Input id="m-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
