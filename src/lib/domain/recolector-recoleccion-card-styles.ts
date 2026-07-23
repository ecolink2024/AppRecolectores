import type { RecoleccionOperativaEstado } from "@/types/database";

/** Estilos de la card de parada en el detalle de ruta (recolector). */
export function recoleccionCardShellClass(estado: RecoleccionOperativaEstado): string {
  const base = "w-full rounded-2xl border text-left shadow-sm";
  switch (estado) {
    case "visitada":
      return `${base} border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/55`;
    case "en_camino":
      return `${base} border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50`;
    case "cancelada":
      return `${base} border-red-400 bg-red-100 dark:border-red-800 dark:bg-red-950/70`;
    case "omitida":
      return `${base} border-orange-300 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/45`;
    case "pendiente":
    default:
      return `${base} border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900`;
  }
}

export function recoleccionCardOrdenClass(estado: RecoleccionOperativaEstado): string {
  const base =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold";
  switch (estado) {
    case "visitada":
      return `${base} bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100`;
    case "en_camino":
      return `${base} bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100`;
    case "cancelada":
      return `${base} bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100`;
    case "omitida":
      return `${base} bg-orange-200 text-orange-950 dark:bg-orange-900 dark:text-orange-100`;
    case "pendiente":
    default:
      return `${base} bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100`;
  }
}

export function recoleccionCardEstadoBadgeClass(estado: RecoleccionOperativaEstado): string {
  const base = "rounded-full px-2 py-0.5 text-xs font-semibold";
  switch (estado) {
    case "visitada":
      return `${base} bg-emerald-600/15 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-100`;
    case "en_camino":
      return `${base} bg-amber-600/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-100`;
    case "cancelada":
      return `${base} bg-red-600/15 text-red-900 dark:bg-red-400/20 dark:text-red-100`;
    case "omitida":
      return `${base} bg-orange-600/15 text-orange-950 dark:bg-orange-400/20 dark:text-orange-100`;
    case "pendiente":
    default:
      return `${base} bg-zinc-600/10 text-zinc-800 dark:bg-zinc-400/15 dark:text-zinc-200`;
  }
}

export function recoleccionCardPressableClass(estado: RecoleccionOperativaEstado): string {
  switch (estado) {
    case "visitada":
      return "active:bg-emerald-100/80 dark:active:bg-emerald-900/60";
    case "en_camino":
      return "active:bg-amber-100/80 dark:active:bg-amber-900/60";
    case "cancelada":
      return "active:bg-red-100/80 dark:active:bg-red-900/60";
    case "omitida":
      return "active:bg-orange-100/80 dark:active:bg-orange-900/60";
    case "pendiente":
    default:
      return "active:bg-zinc-50 dark:active:bg-zinc-800";
  }
}

export function recoleccionCardSecondaryButtonClass(estado: RecoleccionOperativaEstado): string {
  const base =
    "inline-flex min-h-[1.75rem] items-center rounded-full border px-2.5 text-xs font-semibold";
  switch (estado) {
    case "visitada":
      return `${base} border-emerald-300/80 bg-white/70 text-emerald-900 active:bg-white dark:border-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-100`;
    case "en_camino":
      return `${base} border-amber-300/80 bg-white/70 text-amber-950 active:bg-white dark:border-amber-700 dark:bg-amber-950/80 dark:text-amber-100`;
    case "cancelada":
      return `${base} border-red-300/80 bg-white/70 text-red-900 active:bg-white dark:border-red-800 dark:bg-red-950/80 dark:text-red-100`;
    case "omitida":
      return `${base} border-orange-300/80 bg-white/70 text-orange-950 active:bg-white dark:border-orange-800 dark:bg-orange-950/80 dark:text-orange-100`;
    case "pendiente":
    default:
      return `${base} border-zinc-200 bg-zinc-50 text-zinc-700 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:active:bg-zinc-700`;
  }
}

export function recoleccionCardActionHintClass(estado: RecoleccionOperativaEstado): string {
  const base = "text-xs font-medium";
  switch (estado) {
    case "visitada":
      return `${base} text-emerald-800 dark:text-emerald-300`;
    case "en_camino":
      return `${base} text-amber-900 dark:text-amber-300`;
    case "cancelada":
      return `${base} text-red-800 dark:text-red-300`;
    case "omitida":
      return `${base} text-orange-900 dark:text-orange-300`;
    case "pendiente":
    default:
      return `${base} text-zinc-500 dark:text-zinc-400`;
  }
}
