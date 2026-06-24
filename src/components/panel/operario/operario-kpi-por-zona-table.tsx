"use client";

import { formatMoney } from "@/lib/domain/operario-dashboard";
import {
  KPI_LABEL_SERVICIOS,
  formatKpiNumber,
  type KpiDesgloseItem,
  type KpiZonaRow,
} from "@/lib/domain/operario-kpis";

type Props = {
  filas: KpiZonaRow[];
};

function DesgloseCell({ items, vacio }: { items: KpiDesgloseItem[]; vacio: string }) {
  if (items.length === 0) {
    return <span className="text-zinc-400">{vacio}</span>;
  }

  return (
    <ul className="space-y-1 text-xs">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center justify-between gap-2 rounded-md bg-zinc-50 px-2 py-1 dark:bg-zinc-800/60"
        >
          <span className="truncate text-zinc-700 dark:text-zinc-300" title={item.label}>
            {item.label}
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatKpiNumber(item.count)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function OperarioKpiPorZonaTable({ filas }: Props) {
  if (filas.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950">
          <tr>
            <th className="px-4 py-3 font-medium">Zona</th>
            <th className="px-4 py-3 font-medium text-center">{KPI_LABEL_SERVICIOS}</th>
            <th className="min-w-[10rem] px-4 py-3 font-medium">Tipo de servicio</th>
            <th className="min-w-[10rem] px-4 py-3 font-medium">Frecuencia</th>
            <th className="px-4 py-3 font-medium text-center">Bolsas llenas</th>
            <th className="px-4 py-3 font-medium text-right">Efectivo</th>
            <th className="px-4 py-3 font-medium text-right">Transferencia</th>
            <th className="px-4 py-3 font-medium text-right">QR</th>
            <th className="px-4 py-3 font-medium text-right">Ingreso total</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((row) => (
            <tr
              key={row.zona}
              className="border-b border-zinc-100 align-top last:border-0 dark:border-zinc-800"
            >
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                {row.zona}
              </td>
              <td className="px-4 py-3 text-center tabular-nums">
                {formatKpiNumber(row.recolecciones)}
              </td>
              <td className="px-4 py-3">
                <DesgloseCell items={row.porTipoServicio} vacio="—" />
              </td>
              <td className="px-4 py-3">
                <DesgloseCell items={row.porFrecuencia} vacio="—" />
              </td>
              <td className="px-4 py-3 text-center tabular-nums">
                {formatKpiNumber(row.bolsas)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{formatMoney(row.efectivo)}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatMoney(row.transferencia)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{formatMoney(row.qr)}</td>
              <td className="px-4 py-3 text-right font-medium tabular-nums text-emerald-800 dark:text-emerald-400">
                {formatMoney(row.ingresoTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
