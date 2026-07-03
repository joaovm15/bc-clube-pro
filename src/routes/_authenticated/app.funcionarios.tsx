import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserCog, Search, Percent, Phone, Mail } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/hooks/use-barbershop";

export const Route = createFileRoute("/_authenticated/app/funcionarios")({
  head: () => ({ meta: [{ title: "Funcionários — BC CLUBE" }] }),
  component: FuncionariosPage,
});

type Employee = {
  id: string;
  barbershop_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  commission_percent: number;
  color: string | null;
  avatar_url: string | null;
  active: boolean;
};

const schema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(80),
  phone: z.string().max(30).optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  role: z.string().max(40).optional(),
  commission_percent: z.coerce.number().min(0).max(100),
  color: z.string().optional(),
  active: z.boolean(),
});

function FuncionariosPage() {
  const { data: shop } = useBarbershop();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [open, setOpen] = useState(false);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("barbershop_id", shop!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!shop?.id,
  });

  const filtered = useMemo(
    () => employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())),
    [employees, search],
  );

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Funcionário removido");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Equipe</p>
          <h1 className="font-display text-3xl text-ivory">Funcionários</h1>
          <p className="text-sm text-silver/70">
            Gerencie sua equipe, comissões e desempenho individual.
          </p>
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
              <Plus className="mr-2 h-4 w-4" /> Novo funcionário
            </Button>
          </DialogTrigger>
          <EmployeeDialog
            key={editing?.id ?? "new"}
            editing={editing}
            barbershopId={shop?.id}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver/50" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar funcionário..."
          className="pl-9 bg-secondary/40 border-border/60"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-silver/60">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="bc-card p-12 text-center">
          <UserCog className="mx-auto h-8 w-8 text-gold/70" />
          <h3 className="mt-4 font-display text-xl text-ivory">Nenhum funcionário cadastrado</h3>
          <p className="mt-2 text-sm text-silver/70">
            Adicione barbeiros para acompanhar comissões e atendimentos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp) => (
            <div key={emp.id} className="bc-card p-5">
              <div className="flex items-start gap-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center font-display text-lg text-black shrink-0"
                  style={{ background: emp.color || "#D4AF37" }}
                >
                  {emp.name.trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg text-ivory truncate">{emp.name}</h3>
                  <p className="text-xs text-silver/60 capitalize">{emp.role || "barbeiro"}</p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-widest ${
                    emp.active ? "text-gold" : "text-silver/40"
                  }`}
                >
                  {emp.active ? "Ativo" : "Off"}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-silver/70">
                {emp.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {emp.phone}
                  </p>
                )}
                {emp.email && (
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="h-3 w-3" /> {emp.email}
                  </p>
                )}
                <p className="flex items-center gap-2 text-gold font-medium">
                  <Percent className="h-3 w-3" /> {emp.commission_percent}% de comissão
                </p>
              </div>

              <div className="mt-4 flex items-center justify-end gap-1 border-t border-border/50 pt-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-silver hover:text-gold"
                  onClick={() => {
                    setEditing(emp);
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
                      <AlertDialogTitle>Remover funcionário?</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{emp.name}" será removido. Histórico de atendimentos será preservado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(emp.id)}>
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmployeeDialog({
  editing,
  barbershopId,
  onClose,
}: {
  editing: Employee | null;
  barbershopId?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(editing?.name ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [role, setRole] = useState(editing?.role ?? "Barbeiro");
  const [commission, setCommission] = useState(String(editing?.commission_percent ?? "50"));
  const [color, setColor] = useState(editing?.color ?? "#D4AF37");
  const [active, setActive] = useState(editing?.active ?? true);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        name,
        phone,
        email,
        role,
        commission_percent: commission,
        color,
        active,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!barbershopId) throw new Error("Barbearia não carregada");

      const payload = {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        role: parsed.data.role || null,
        commission_percent: parsed.data.commission_percent,
        color: parsed.data.color || "#D4AF37",
        active: parsed.data.active,
      };

      if (editing) {
        const { error } = await supabase.from("employees").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employees")
          .insert({ ...payload, barbershop_id: barbershopId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Funcionário atualizado" : "Funcionário adicionado");
      qc.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">
          {editing ? "Editar funcionário" : "Novo funcionário"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="f-name">Nome</Label>
            <Input id="f-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="João Silva" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-role">Cargo</Label>
            <Input id="f-role" value={role ?? ""} onChange={(e) => setRole(e.target.value)} placeholder="Barbeiro" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-com">Comissão (%)</Label>
            <Input id="f-com" type="number" min="0" max="100" value={commission} onChange={(e) => setCommission(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-phone">Telefone</Label>
            <Input id="f-phone" value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-email">E-mail</Label>
            <Input id="f-email" type="email" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} placeholder="joao@barbearia.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-color">Cor</Label>
            <div className="flex items-center gap-2">
              <input
                id="f-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 rounded-md bg-transparent border border-border cursor-pointer"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2.5">
            <Label htmlFor="f-active" className="text-sm">Ativo</Label>
            <Switch id="f-active" checked={active} onCheckedChange={setActive} />
          </div>
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
