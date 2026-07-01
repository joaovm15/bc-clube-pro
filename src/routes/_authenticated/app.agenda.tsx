import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/app/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/app/agenda")({
  component: () => (
    <ComingSoonPage
      eyebrow="Agenda"
      title="Agenda Inteligente"
      description="Visualize e organize os agendamentos por dia, semana e por profissional."
      phase="Fase 2"
    />
  ),
});
