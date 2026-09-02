"use client";

import {
  OPERARIO_SCROLL_KPI_POR_ZONA,
  OPERARIO_TABLE_HEAD_STICKY,
  OperarioScrollableTable,
} from "@/components/panel/operario/operario-scrollable-table";
import {
  KPI_LABEL_SERVICIOS,
  formatKpiNumber,
  type KpiTipoServicioRow,
} from "@/lib/domain/operario-kpis";

const TH_TIPO =
  "sticky left-0 z-30 min-w-[8rem] bg-zinc-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:bg-zinc-950 dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.4)]";

const TD_TIPO =
  "sticky left-0 z-10 min-w-[8rem] bg-white font-medium text-zinc-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.4)]";

type Props = {
  filas: KpiTipoServicioRow[];
};

export function OperarioKpiPorTipoServicioTable({ filas }: Props) {
  if (filas.length === 0) return null;

  return (
    <OperarioScrollableTable
      maxHeightClass={OPERARIO_SCROLL_KPI_POR_ZONA}
      footer={`${filas.length} tipo${filas.length === 1 ? "" : "s"} de servicio`}
    >
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className={OPERARIO_TABLE_HEAD_STICKY}>
          <tr>
            <th className={`${TH_TIPO} px-4 py-3 font-medium`}>Tipo de servicio</th>
            <th className="px-4 py-3 font-medium text-center">{KPI_LABEL_SERVICIOS}</th>
            <th className="px-4 py-3 font-medium text-center">Exitosos</th>
            <th className="px-4 py-3 font-medium text-center">Cancelados</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((row) => (
            <tr
              key={row.tipo}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <td className={`${TD_TIPO} px-4 py-3`}>{row.tipo}</td>
              <td className="px-4 py-3 text-center font-medium tabular-nums text-emerald-800 dark:text-emerald-400">
                {formatKpiNumber(row.total)}
              </td>
              <td className="px-4 py-3 text-center tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatKpiNumber(row.exitosas)}
              </td>
              <td className="px-4 py-3 text-center tabular-nums text-red-700 dark:text-red-400">
                {formatKpiNumber(row.canceladas)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </OperarioScrollableTable>
  );
}
