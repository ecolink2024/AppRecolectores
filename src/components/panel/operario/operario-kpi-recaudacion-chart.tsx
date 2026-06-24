"use client";

import { useMemo, useState } from "react";

import { formatMoney } from "@/lib/domain/operario-dashboard";
import {
  KPI_RECAUDACION_MENSUAL_VENTANA,
  formatKpiMesLabel,
  type KpiSerieMes,
} from "@/lib/domain/operario-kpis";

const CHART_HEIGHT_PX = 180;
const MIN_BAR_PX = 8;

function formatMontoCorto(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toLocaleString("es-AR", { maximumFractionDigits: 0 })}k`;
  }
  return formatMoney(value).replace(/\s/g, "");
}

type Props = {
  serie: KpiSerieMes[];
};

export function OperarioKpiRecaudacionChart({ serie }: Props) {
  const [offset, setOffset] = useState(0);

  const maxOffset = Math.max(0, serie.length - KPI_RECAUDACION_MENSUAL_VENTANA);
  const effectiveOffset = Math.min(offset, maxOffset);

  const visible = useMemo(() => {
    const end = serie.length - effectiveOffset;
    const start = Math.max(0, end - KPI_RECAUDACION_MENSUAL_VENTANA);
    return serie.slice(start, end);
  }, [serie, effectiveOffset]);

  const canGoOlder = effectiveOffset < maxOffset;
  const canGoNewer = effectiveOffset > 0;

  const rangoLabel =
    visible.length > 0
      ? `${formatKpiMesLabel(visible[0].mes)} — ${formatKpiMesLabel(visible[visible.length - 1].mes)}`
      : "—";

  if (serie.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50">
        No hay datos de recaudación para mostrar.
      </p>
    );
  }

  const maxValor = Math.max(
    ...visible.flatMap((m) => [m.recaudado, m.totalPrecio]),
    1,
  );
  const plotHeight = CHART_HEIGHT_PX - 72;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{rangoLabel}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset((o) => Math.min(o + 1, maxOffset))}
            disabled={!canGoOlder}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Ver meses anteriores"
          >
            ← Anteriores
          </button>
          <button
            type="button"
            onClick={() => setOffset((o) => Math.max(o - 1, 0))}
            disabled={!canGoNewer}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Ver meses siguientes"
          >
            Siguientes →
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600 dark:bg-blue-500" />
          Monto total por servicios prestados
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
          Monto real recaudado
        </span>
      </div>

      <div className="overflow-x-auto">
        <div
          className="flex items-end justify-start gap-2 sm:gap-3"
          style={{
            minWidth: `${KPI_RECAUDACION_MENSUAL_VENTANA * 72}px`,
            height: `${CHART_HEIGHT_PX}px`,
          }}
        >
          {visible.map((mes) => {
            const barTotalPx =
              mes.totalPrecio > 0
                ? Math.max(MIN_BAR_PX, Math.round((mes.totalPrecio / maxValor) * plotHeight))
                : 4;
            const barRecaudadoPx =
              mes.recaudado > 0
                ? Math.max(MIN_BAR_PX, Math.round((mes.recaudado / maxValor) * plotHeight))
                : 4;
            const mesLabel = formatKpiMesLabel(mes.mes);

            return (
              <div
                key={mes.mes}
                className="flex h-full flex-1 flex-col items-center justify-end"
                style={{ minWidth: "3.75rem", maxWidth: "5rem" }}
              >
                <div className="mb-1 flex w-full max-w-[4.5rem] flex-col gap-0.5 text-center">
                  <span
                    className="truncate text-[9px] font-medium tabular-nums text-blue-700 dark:text-blue-300"
                    title={`Monto total por servicios prestados: ${formatMoney(mes.totalPrecio)}`}
                  >
                    {mes.totalPrecio > 0 ? formatMontoCorto(mes.totalPrecio) : "—"}
                  </span>
                  <span
                    className="truncate text-[9px] font-medium tabular-nums text-emerald-700 dark:text-emerald-300"
                    title={`Monto real recaudado: ${formatMoney(mes.recaudado)}`}
                  >
                    {mes.recaudado > 0 ? formatMontoCorto(mes.recaudado) : "—"}
                  </span>
                </div>
                <div className="flex items-end justify-center gap-0.5">
                  <div
                    role="img"
                    aria-label={`${mesLabel} monto total por servicios prestados: ${formatMoney(mes.totalPrecio)}`}
                    className="w-4 shrink-0 rounded-t-md bg-blue-600 shadow-sm dark:bg-blue-500"
                    style={{ height: `${barTotalPx}px` }}
                    title={`${mesLabel} · Monto total por servicios prestados: ${formatMoney(mes.totalPrecio)}`}
                  />
                  <div
                    role="img"
                    aria-label={`${mesLabel} monto real recaudado: ${formatMoney(mes.recaudado)}`}
                    className="w-4 shrink-0 rounded-t-md bg-emerald-600 shadow-sm dark:bg-emerald-500"
                    style={{ height: `${barRecaudadoPx}px` }}
                    title={`${mesLabel} · Monto real recaudado: ${formatMoney(mes.recaudado)} · ${mes.rutas} ruta(s)`}
                  />
                </div>
                <span className="mt-2 text-center text-[10px] font-medium capitalize text-zinc-600 dark:text-zinc-400">
                  {mesLabel}
                </span>
                <span className="text-[9px] text-zinc-400">
                  {mes.rutas} {mes.rutas === 1 ? "ruta" : "rutas"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Mostrando {visible.length} meses · Últimos {KPI_RECAUDACION_MENSUAL_VENTANA} meses por
        defecto · No depende del filtro de fechas de arriba
      </p>
    </div>
  );
}
