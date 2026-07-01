import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/app/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/app/despesas")({
  component: () => (
    <ComingSoonPage
      eyebrow="Despesas"
      title="Despesas & Categorias"
      description="Aluguel, energia, produtos, internet, marketing — tudo organizado."
      phase="Fase 3"
    />
  ),
});
