import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Clock, Scissors, Search } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/_authenticated/app/servicos")({
  head: () => ({ meta: [{ title: "Serviços — BC CLUBE" }] }),
  component: ServicosPage,
});

type Service = {
  id: string;
  barbershop_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  color: string | null;
  image_url: string | null;
  active: boolean;
};

const schema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço").max(80),
  description: z.string().max(400).optional(),
  price: z.coerce.number().min(0).max(99999),
  duration_minutes: z.coerce.number().int().min(5).max(600),
  color: z.string().optional(),
  active: z.boolean(),
});

const CURRENCY = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ServicosPage() {
  const { data: shop } = useBarbershop();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", shop!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!shop?.id,
  });

  const filtered = useMemo(
    () => services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [services, search],
  );

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Serviço removido");
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Cardápio</p>
          <h1 className="font-display text-3xl text-ivory">Serviços</h1>
          <p className="text-sm text-silver/70">Cadastre serviços com preço e duração.</p>
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
              <Plus className="mr-2 h-4 w-4" /> Novo serviço
            </Button>
          </DialogTrigger>
          <ServiceDialog
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
          placeholder="Buscar serviço..."
          className="pl-9 bg-secondary/40 border-border/60"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-silver/60">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="bc-card p-12 text-center">
          <Scissors className="mx-auto h-8 w-8 text-gold/70" />
          <h3 className="mt-4 font-display text-xl text-ivory">Nenhum serviço ainda</h3>
          <p className="mt-2 text-sm text-silver/70">
            Comece adicionando os serviços que sua barbearia oferece.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="bc-card p-5 group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-lg text-ivory truncate">{s.name}</h3>
                  {s.description && (
                    <p className="mt-1 text-xs text-silver/60 line-clamp-2">{s.description}</p>
                  )}
                </div>
                <span
                  className="h-3 w-3 rounded-full shrink-0 mt-1.5"
                  style={{ background: s.color || "#D4AF37" }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gold font-medium">{CURRENCY.format(s.price)}</span>
                <span className="flex items-center gap-1 text-silver/70 text-xs">
                  <Clock className="h-3 w-3" /> {s.duration_minutes} min
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <span
                  className={`text-[10px] uppercase tracking-widest ${
                    s.active ? "text-gold" : "text-silver/40"
                  }`}
                >
                  {s.active ? "Ativo" : "Inativo"}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-silver hover:text-gold"
                    onClick={() => {
                      setEditing(s);
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
                        <AlertDialogTitle>Remover serviço?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O serviço "{s.name}" será excluído.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove.mutate(s.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceDialog({
  editing,
  barbershopId,
  onClose,
}: {
  editing: Service | null;
  barbershopId?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [price, setPrice] = useState(String(editing?.price ?? "50"));
  const [duration, setDuration] = useState(String(editing?.duration_minutes ?? "30"));
  const [color, setColor] = useState(editing?.color ?? "#D4AF37");
  const [active, setActive] = useState(editing?.active ?? true);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        name,
        description,
        price,
        duration_minutes: duration,
        color,
        active,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!barbershopId) throw new Error("Barbearia não carregada");

      if (editing) {
        const { error } = await supabase
          .from("services")
          .update({ ...parsed.data, description: parsed.data.description || null })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert({
          ...parsed.data,
          description: parsed.data.description || null,
          barbershop_id: barbershopId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Serviço atualizado" : "Serviço criado");
      qc.invalidateQueries({ queryKey: ["services"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">
          {editing ? "Editar serviço" : "Novo serviço"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="s-name">Nome</Label>
          <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Corte + Barba" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-desc">Descrição</Label>
          <Textarea
            id="s-desc"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Detalhes opcionais"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="s-price">Preço (R$)</Label>
            <Input id="s-price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-dur">Duração (min)</Label>
            <Input id="s-dur" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="s-color">Cor</Label>
            <div className="flex items-center gap-2">
              <input
                id="s-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 rounded-md bg-transparent border border-border cursor-pointer"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2.5">
            <Label htmlFor="s-active" className="text-sm">Ativo</Label>
            <Switch id="s-active" checked={active} onCheckedChange={setActive} />
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
