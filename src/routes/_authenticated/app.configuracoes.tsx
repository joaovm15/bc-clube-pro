import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/app/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/app/configuracoes")({
  component: () => (
    <ComingSoonPage
      eyebrow="Configurações"
      title="Configurações"
      description="Perfil, dados da barbearia, horários de funcionamento e integrações."
      phase="Fase 4"
    />
  ),
});
