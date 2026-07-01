import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/app/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/app/clientes")({
  component: () => (
    <ComingSoonPage
      eyebrow="Clientes"
      title="Base de Clientes"
      description="Histórico completo, frequência, valor gasto e observações de cada cliente."
      phase="Fase 2"
    />
  ),
});
