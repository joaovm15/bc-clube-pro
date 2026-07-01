import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/app/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/app/financeiro")({
  component: () => (
    <ComingSoonPage
      eyebrow="Financeiro"
      title="Controle Financeiro"
      description="Pagamentos, receitas, comissões e conciliação em tempo real."
      phase="Fase 3"
    />
  ),
});
