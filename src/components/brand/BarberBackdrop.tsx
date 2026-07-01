import emblem from "@/assets/emblem-skull.png";
import scissors from "@/assets/scissors-gold.png";
import razor from "@/assets/razor-gold.png";

/**
 * Decorative barbershop-themed backdrop.
 * Elements are placed at the edges, low-opacity, non-interactive.
 * Never in the reading area.
 */
export function BarberBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, oklch(0.08 0 0) 100%)",
        }}
      />

      {/* Corner emblem — top left */}
      <img
        src={emblem}
        alt=""
        className="absolute -left-24 -top-24 w-[420px] opacity-[0.05] blur-[1px] select-none"
        loading="lazy"
        width={420}
        height={420}
      />

      {/* Corner emblem — bottom right */}
      <img
        src={emblem}
        alt=""
        className="absolute -right-32 -bottom-32 w-[520px] opacity-[0.04] blur-[2px] select-none"
        loading="lazy"
        width={520}
        height={520}
      />

      {/* Scissors — right edge */}
      <img
        src={scissors}
        alt=""
        className="absolute right-[-80px] top-1/3 w-[280px] opacity-[0.06] rotate-[35deg] blur-[1px] select-none"
        loading="lazy"
        width={280}
        height={280}
      />

      {/* Razor — bottom left */}
      <img
        src={razor}
        alt=""
        className="absolute left-[-40px] bottom-1/4 w-[360px] opacity-[0.06] -rotate-12 blur-[1px] select-none"
        loading="lazy"
        width={360}
        height={180}
      />

      {/* Noise texture layer */}
      <div className="absolute inset-0 bc-noise" />
    </div>
  );
}
