import type { CSSProperties, ReactNode } from "react";

/** Filas visibles en tablas de rutas y recolecciones (operativo e historial). */
export const OPERARIO_TABLE_VISIBLE_ROWS = 10;

/** thead (~2.75rem) + N filas tbody (~2.5rem c/u, py-2.5 / text-sm). */
export const OPERARIO_TABLE_SCROLL_HEIGHT = `calc(2.75rem + ${OPERARIO_TABLE_VISIBLE_ROWS} * 2.5rem)`;

/** Recolecciones: mismo tope de filas + 2 cm extra de alto visible. */
export const OPERARIO_TABLE_SCROLL_HEIGHT_RECOLECCIONES = `calc(2.75rem + ${OPERARIO_TABLE_VISIBLE_ROWS} * 2.5rem + 2cm)`;

/** KPIs — tabla por zona (filas altas por desglose tipo/frecuencia). */
export const OPERARIO_SCROLL_KPI_POR_ZONA = "max-h-[min(48vh,30rem)]";

/** KPIs — tabla por recolector. */
export const OPERARIO_SCROLL_KPI_POR_RECOLECTOR = "max-h-[min(40vh,24rem)]";

/** Encabezado de tabla fijo al hacer scroll vertical. */
export const OPERARIO_TABLE_HEAD_STICKY =
  "sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 shadow-[0_1px_0_0_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]";

export type OperarioScrollableTableKind = "rutas" | "recolecciones";

type Props = {
  children: ReactNode;
  /** Altura según tipo de tabla (operativo e historial). */
  tableKind?: OperarioScrollableTableKind;
  /** Clases Tailwind de altura máxima (p. ej. KPIs). */
  maxHeightClass?: string;
  /** Altura máxima CSS explícita (opcional; sobreescribe tableKind). */
  scrollMaxHeight?: string;
  footer?: string;
};

function resolveScrollMaxHeight({
  tableKind,
  maxHeightClass,
  scrollMaxHeight,
}: Pick<Props, "tableKind" | "maxHeightClass" | "scrollMaxHeight">): string | undefined {
  if (maxHeightClass) return undefined;
  if (scrollMaxHeight) return scrollMaxHeight;
  if (tableKind === "recolecciones") return OPERARIO_TABLE_SCROLL_HEIGHT_RECOLECCIONES;
  if (tableKind === "rutas") return OPERARIO_TABLE_SCROLL_HEIGHT;
  return OPERARIO_TABLE_SCROLL_HEIGHT;
}

export function OperarioScrollableTable({
  children,
  tableKind,
  maxHeightClass,
  scrollMaxHeight,
  footer,
}: Props) {
  const resolvedScrollMaxHeight = resolveScrollMaxHeight({
    tableKind,
    maxHeightClass,
    scrollMaxHeight,
  });

  const scrollStyle: CSSProperties | undefined = resolvedScrollMaxHeight
    ? { maxHeight: resolvedScrollMaxHeight }
    : undefined;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className={`overflow-auto overscroll-contain ${maxHeightClass ?? ""}`}
        style={scrollStyle}
      >
        {children}
      </div>
      {footer ? (
        <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {footer}
        </p>
      ) : null}
    </div>
  );
}
