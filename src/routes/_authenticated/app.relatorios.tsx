import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/app/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/app/relatorios")({
  component: () => (
    <ComingSoonPage
      eyebrow="Relatórios"
      title="Relatórios Avançados"
      description="Faturamento, lucro, ranking de funcionários e serviços mais vendidos."
      phase="Fase 3"
    />
  ),
});
