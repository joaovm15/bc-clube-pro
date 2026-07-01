import { Sparkles } from "lucide-react";

interface Props {
  title: string;
  eyebrow?: string;
  description: string;
  phase?: string;
}

export function ComingSoonPage({ title, eyebrow, description, phase }: Props) {
  return (
    <div className="space-y-8">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
        )}
        <h1 className="mt-2 font-display text-4xl md:text-5xl text-ivory">
          {title}
        </h1>
        <p className="mt-2 text-silver/70 max-w-2xl">{description}</p>
      </div>
      <div className="bc-card p-10 md:p-14 text-center max-w-3xl mx-auto">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
          <Sparkles className="h-6 w-6 text-gold" strokeWidth={1.5} />
        </div>
        <h2 className="mt-6 font-display text-3xl text-ivory">Em desenvolvimento</h2>
        <p className="mt-3 text-silver/70">
          Este módulo está sendo construído na próxima fase do BC CLUBE
          {phase ? ` (${phase})` : ""}. Todas as tabelas e regras de acesso já
          estão preparadas no backend.
        </p>
      </div>
    </div>
  );
}
