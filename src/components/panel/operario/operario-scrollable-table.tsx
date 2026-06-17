import type { ReactNode } from "react";

/** Altura máx. tabla de rutas (deja espacio para recolecciones abajo). */
export const OPERARIO_SCROLL_RUTAS = "max-h-[min(36vh,24rem)]";

/** Altura máx. tabla de recolecciones de la ruta seleccionada. */
export const OPERARIO_SCROLL_RECOLECCIONES = "max-h-[min(44vh,28rem)]";

/** Historial: mismas proporciones que operativo. */
export const OPERARIO_SCROLL_HISTORIAL_RUTAS = OPERARIO_SCROLL_RUTAS;
export const OPERARIO_SCROLL_HISTORIAL_RECOLECCIONES = OPERARIO_SCROLL_RECOLECCIONES;

/** Encabezado de tabla fijo al hacer scroll vertical. */
export const OPERARIO_TABLE_HEAD_STICKY =
  "sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 shadow-[0_1px_0_0_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]";

type Props = {
  children: ReactNode;
  maxHeight?: string;
  footer?: string;
};

export function OperarioScrollableTable({
  children,
  maxHeight = OPERARIO_SCROLL_RUTAS,
  footer,
}: Props) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`overflow-auto overscroll-contain ${maxHeight}`}>{children}</div>
      {footer ? (
        <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {footer}
        </p>
      ) : null}
    </div>
  );
}
