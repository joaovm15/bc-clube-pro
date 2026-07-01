import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/app/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/app/servicos")({
  component: () => (
    <ComingSoonPage
      eyebrow="Serviços"
      title="Cardápio de Serviços"
      description="Cadastre serviços com preço, duração e imagem ilustrativa."
      phase="Fase 2"
    />
  ),
});
