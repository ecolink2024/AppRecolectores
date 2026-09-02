"use client";

import {
  OPERARIO_SCROLL_KPI_POR_ZONA,
  OPERARIO_TABLE_HEAD_STICKY,
  OperarioScrollableTable,
} from "@/components/panel/operario/operario-scrollable-table";
import {
  KPI_LABEL_SERVICIOS,
  KPI_TIPOS_SERVICIO_COLUMNAS,
  formatKpiNumber,
  type KpiUnidadNegocioRow,
} from "@/lib/domain/operario-kpis";

const TH_UNIDAD =
  "sticky left-0 z-30 min-w-[7rem] bg-zinc-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:bg-zinc-950 dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.4)]";

const TD_UNIDAD =
  "sticky left-0 z-10 min-w-[7rem] bg-white font-medium text-zinc-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.4)]";

const TH_SUB = "px-2 py-2 font-medium normal-case tracking-normal text-center";

type Props = {
  filas: KpiUnidadNegocioRow[];
};

export function OperarioKpiPorUnidadNegocioTable({ filas }: Props) {
  if (filas.length === 0) return null;

  return (
    <OperarioScrollableTable
      maxHeightClass={OPERARIO_SCROLL_KPI_POR_ZONA}
      footer={`${filas.length} unidad${filas.length === 1 ? "" : "es"} de negocio · Desplazá horizontalmente si hace falta`}
    >
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className={OPERARIO_TABLE_HEAD_STICKY}>
          <tr>
            <th className={`${TH_UNIDAD} px-4 py-3 font-medium`} rowSpan={2}>
              Unidad
            </th>
            {KPI_TIPOS_SERVICIO_COLUMNAS.map(({ key, label }) => (
              <th
                key={key}
                className="border-l border-zinc-200 px-2 py-3 text-center font-medium dark:border-zinc-800"
                colSpan={2}
              >
                {label}
              </th>
            ))}
            <th
              className="border-l border-zinc-200 px-4 py-3 text-center font-medium dark:border-zinc-800"
              rowSpan={2}
            >
              {KPI_LABEL_SERVICIOS}
            </th>
            <th
              className="border-l border-zinc-200 px-4 py-3 text-center font-medium dark:border-zinc-800"
              rowSpan={2}
            >
              Exitosos
            </th>
            <th
              className="border-l border-zinc-200 px-4 py-3 text-center font-medium dark:border-zinc-800"
              rowSpan={2}
            >
              Cancelados
            </th>
          </tr>
          <tr>
            {KPI_TIPOS_SERVICIO_COLUMNAS.flatMap(({ key }) => [
              <th key={`${key}-exit`} className={`${TH_SUB} text-emerald-800 dark:text-emerald-400`}>
                Exit.
              </th>,
              <th key={`${key}-canc`} className={`${TH_SUB} text-red-800 dark:text-red-400`}>
                Canc.
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {filas.map((row) => (
            <tr
              key={row.unidad}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <td className={`${TD_UNIDAD} px-4 py-3`}>{row.unidad}</td>
              {KPI_TIPOS_SERVICIO_COLUMNAS.flatMap(({ key }) => {
                const celda = row.porTipo[key];
                return [
                  <td
                    key={`${row.unidad}-${key}-exit`}
                    className="border-l border-zinc-100 px-2 py-3 text-center tabular-nums text-emerald-700 dark:border-zinc-800 dark:text-emerald-400"
                  >
                    {formatKpiNumber(celda.exitosas)}
                  </td>,
                  <td
                    key={`${row.unidad}-${key}-canc`}
                    className="px-2 py-3 text-center tabular-nums text-red-700 dark:text-red-400"
                  >
                    {formatKpiNumber(celda.canceladas)}
                  </td>,
                ];
              })}
              <td className="border-l border-zinc-100 px-4 py-3 text-center font-medium tabular-nums text-emerald-800 dark:border-zinc-800 dark:text-emerald-400">
                {formatKpiNumber(row.total)}
              </td>
              <td className="border-l border-zinc-100 px-4 py-3 text-center tabular-nums text-emerald-700 dark:border-zinc-800 dark:text-emerald-400">
                {formatKpiNumber(row.exitosas)}
              </td>
              <td className="border-l border-zinc-100 px-4 py-3 text-center tabular-nums text-red-700 dark:border-zinc-800 dark:text-red-400">
                {formatKpiNumber(row.canceladas)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </OperarioScrollableTable>
  );
}
