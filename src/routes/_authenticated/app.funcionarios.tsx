import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/app/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/app/funcionarios")({
  component: () => (
    <ComingSoonPage
      eyebrow="Funcionários"
      title="Equipe & Comissões"
      description="Gerencie profissionais, comissões, atendimentos e lucro gerado."
      phase="Fase 3"
    />
  ),
});
