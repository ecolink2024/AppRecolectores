import {
  RECOLECCION_OPERATIVA_LABELS,
  rutaEstadoOperarioLabel,
} from "@/lib/domain/constants";
import type { RecoleccionOperativaEstado, RutaEstado } from "@/types/database";

const BADGE_BASE =
  "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

const RUTA_ESTADO_STYLES: Record<RutaEstado, string> = {
  borrador:
    "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  activa:
    "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  en_curso:
    "border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  completada:
    "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  cerrada:
    "border-zinc-300 bg-zinc-200 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
  cancelada:
    "border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  suspendida:
    "border-orange-200 bg-orange-100 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
};

const RECOLECCION_ESTADO_STYLES: Record<RecoleccionOperativaEstado, string> = {
  pendiente:
    "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
  en_camino:
    "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  visitada:
    "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  omitida:
    "border-orange-200 bg-orange-100 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
  cancelada:
    "border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

const ZONA_PALETTE = [
  "border-violet-200 bg-violet-100 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
  "border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  "border-teal-200 bg-teal-100 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200",
  "border-pink-200 bg-pink-100 text-pink-900 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-200",
  "border-indigo-200 bg-indigo-100 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  "border-cyan-200 bg-cyan-100 text-cyan-900 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-900 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200",
  "border-lime-200 bg-lime-100 text-lime-900 dark:border-lime-800 dark:bg-lime-950 dark:text-lime-200",
] as const;

function hashZona(zona: string): number {
  const normalized = zona.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getZonaMarkerColor(zona: string | null | undefined): string {
  if (!zona?.trim()) return "#71717a";
  const colors = [
    "#7c3aed",
    "#2563eb",
    "#0d9488",
    "#db2777",
    "#4f46e5",
    "#0891b2",
    "#c026d3",
    "#65a30d",
  ];
  return colors[hashZona(zona) % colors.length];
}

export function zonaBadgeClass(zona: string | null | undefined): string {
  if (!zona?.trim()) {
    return "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500";
  }
  return ZONA_PALETTE[hashZona(zona) % ZONA_PALETTE.length];
}

type BadgeProps = { className: string; children: React.ReactNode };

function Badge({ className, children }: BadgeProps) {
  return <span className={`${BADGE_BASE} ${className}`}>{children}</span>;
}

export function RutaEstadoBadge({ estado }: { estado: RutaEstado }) {
  return (
    <Badge className={RUTA_ESTADO_STYLES[estado]}>
      {rutaEstadoOperarioLabel(estado)}
    </Badge>
  );
}

export function RecoleccionEstadoBadge({
  estado,
}: {
  estado: RecoleccionOperativaEstado;
}) {
  return (
    <Badge className={RECOLECCION_ESTADO_STYLES[estado]}>
      {RECOLECCION_OPERATIVA_LABELS[estado]}
    </Badge>
  );
}

export function ZonaBadge({ zona }: { zona: string | null | undefined }) {
  const label = zona?.trim() || "—";
  return <Badge className={zonaBadgeClass(zona)}>{label}</Badge>;
}
