import { useId } from "react";

export type VitruLogoState = "idle" | "listening" | "thinking" | "speaking";

interface VitruLogoProps {
  state?: VitruLogoState;
  size?: "small" | "large";
}

const PETAL_PATH =
  "M100,15 C112,15 120,24 119,38 C118,50 114,62 108,71 C105,75 95,75 92,71 C86,62 82,50 81,38 C80,24 88,15 100,15 Z";

// Coordenadas pré-calculadas e arredondadas. Valores produzidos por
// Math.sin/Math.cos durante o SSR podem ser normalizados pelo parser SVG do
// navegador antes da hidratação (por exemplo, 100.00000000000001 → 100), o
// que faz React detectar atributos diferentes mesmo com o desenho idêntico.
const PARTICLES = [
  { x: 182, y: 100 },
  { x: 141, y: 171 },
  { x: 59, y: 171 },
  { x: 18, y: 100 },
  { x: 59, y: 29 },
  { x: 141, y: 29 },
] as const;

export function VitruLogo({ state = "idle", size = "large" }: VitruLogoProps) {
  const gradientId = useId().replaceAll(":", "");
  const rotations = Array.from({ length: 8 }, (_, index) => index * 45);

  return (
    <div
      className={`vitru-logo vitru-logo--${state} ${
        size === "small" ? "h-12 w-12" : "h-24 w-24"
      }`}
      role="img"
      aria-label={`Vitru ${state}`}
    >
      <span className="vitru-logo__halo" aria-hidden="true" />
      <svg viewBox="0 0 200 200" className="relative h-full w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7d778" />
            <stop offset="0.55" stopColor="#f4c64b" />
            <stop offset="1" stopColor="#e0a92e" />
          </linearGradient>
        </defs>

        <g className="vitru-logo__rings" aria-hidden="true">
          {[0, 1, 2].map((ring) => (
            <circle
              key={ring}
              cx="100"
              cy="100"
              r="46"
              className="vitru-logo__ring"
              style={{ animationDelay: `${ring * 0.55}s` }}
            />
          ))}
        </g>

        <g className="vitru-logo__particles" aria-hidden="true">
          {PARTICLES.map(({ x, y }) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r="4"
              fill="#f4c64b"
            />
          ))}
        </g>

        <g className="vitru-logo__symbol">
          {rotations.map((rotation) => (
            <path
              key={rotation}
              d={PETAL_PATH}
              fill={`url(#${gradientId})`}
              transform={`rotate(${rotation} 100 100)`}
              className="vitru-logo__petal"
            />
          ))}
          <circle className="vitru-logo__core" cx="100" cy="100" r="10" fill={`url(#${gradientId})`} />
        </g>
      </svg>
    </div>
  );
}
