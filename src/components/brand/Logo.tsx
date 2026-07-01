import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function Logo({ className, size = "md", showTagline = false }: LogoProps) {
  const sizes = {
    sm: { title: "text-lg", tagline: "text-[9px]" },
    md: { title: "text-2xl", tagline: "text-[10px]" },
    lg: { title: "text-5xl md:text-6xl", tagline: "text-xs" },
  }[size];

  return (
    <div className={cn("inline-flex flex-col leading-none", className)}>
      <div className="flex items-baseline gap-[2px]">
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-ivory",
            sizes.title,
          )}
        >
          BC
        </span>
        <span
          className={cn(
            "font-display font-semibold tracking-tight bc-gold-text",
            sizes.title,
          )}
        >
          CLUBE
        </span>
      </div>
      {showTagline && (
        <span
          className={cn(
            "mt-1 uppercase tracking-[0.28em] text-silver/70",
            sizes.tagline,
          )}
        >
          Gestão Inteligente para Barbearias
        </span>
      )}
    </div>
  );
}
