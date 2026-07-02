import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Users, Phone, Mail, Cake } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/hooks/use-barbershop";

export const Route = createFileRoute("/_authenticated/app/clientes")({
  head: () => ({ meta: [{ title: "Clientes — BC CLUBE" }] }),
  component: ClientesPage,
});

type Customer = {
  id: string;
  barbershop_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  notes: string | null;
  active: boolean;
};

const schema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  phone: z.string().max(30).optional(),
  email: z.string().email("Email inválido").max(255).optional().or(z.literal("")),
  birthday: z.string().optional(),
  notes: z.string().max(500).optional(),
});

function initialsOf(name: string) {
  return name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase() || "?";
}

function ClientesPage() {
  const { data: shop } = useBarbershop();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("barbershop_id", shop!.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!shop?.id,
  });

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q)
        );
      }),
    [customers, search],
  );

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente removido");
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Relacionamento</p>
          <h1 className="font-display text-3xl text-ivory">Clientes</h1>
          <p className="text-sm text-silver/70">
            {customers.length} {customers.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
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
              <Plus className="mr-2 h-4 w-4" /> Novo cliente
            </Button>
          </DialogTrigger>
          <CustomerDialog
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
          placeholder="Buscar por nome, telefone ou email..."
          className="pl-9 bg-secondary/40 border-border/60"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-silver/60">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="bc-card p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-gold/70" />
          <h3 className="mt-4 font-display text-xl text-ivory">Sua base de clientes começa aqui</h3>
          <p className="mt-2 text-sm text-silver/70">
            Cadastre clientes para acompanhar histórico e frequência.
          </p>
        </div>
      ) : (
        <div className="bc-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30 text-left text-[11px] uppercase tracking-widest text-silver/60">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 hidden md:table-cell">Contato</th>
                <th className="px-4 py-3 hidden lg:table-cell">Aniversário</th>
                <th className="px-4 py-3 w-24 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-gold/20">
                        <AvatarFallback className="bg-noir text-gold text-xs">
                          {initialsOf(c.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-ivory truncate">{c.name}</p>
                        {c.notes && (
                          <p className="text-[11px] text-silver/50 truncate max-w-xs">{c.notes}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="space-y-0.5 text-xs text-silver/80">
                      {c.phone && (
                        <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-gold/60" />{c.phone}</p>
                      )}
                      {c.email && (
                        <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-gold/60" />{c.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-silver/70">
                    {c.birthday && (
                      <span className="inline-flex items-center gap-1.5">
                        <Cake className="h-3 w-3 text-gold/60" />
                        {format(new Date(c.birthday + "T00:00:00"), "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-silver hover:text-gold"
                        onClick={() => {
                          setEditing(c);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-silver hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{c.name}" será removido. Agendamentos passados são preservados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(c.id)}>Remover</AlertDialogAction>
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

function CustomerDialog({
  editing,
  barbershopId,
  onClose,
}: {
  editing: Customer | null;
  barbershopId?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(editing?.name ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [birthday, setBirthday] = useState(editing?.birthday ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ name, phone, email, birthday, notes });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!barbershopId) throw new Error("Barbearia não carregada");

      const payload = {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        birthday: parsed.data.birthday || null,
        notes: parsed.data.notes || null,
      };

      if (editing) {
        const { error } = await supabase.from("customers").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customers")
          .insert({ ...payload, barbershop_id: barbershopId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Cliente atualizado" : "Cliente criado");
      qc.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">
          {editing ? "Editar cliente" : "Novo cliente"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Nome completo</Label>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="João Silva" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">Telefone</Label>
            <Input id="c-phone" value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-birthday">Aniversário</Label>
            <Input id="c-birthday" type="date" value={birthday ?? ""} onChange={(e) => setBirthday(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-email">Email</Label>
          <Input id="c-email" type="email" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-notes">Observações</Label>
          <Textarea id="c-notes" value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Preferências, alergias, referências..." />
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
