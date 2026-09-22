import {
  OPERARIO_TABLE_HEAD_STICKY,
  OperarioScrollableTable,
} from "@/components/panel/operario/operario-scrollable-table";
import { formatMoney } from "@/lib/domain/operario-dashboard";
import type { HistorialPuntoRow } from "@/lib/domain/historial-puntos";

type Props = {
  rows: HistorialPuntoRow[];
};

const TH = "whitespace-nowrap px-3 py-3 font-medium";
const TD = "whitespace-nowrap px-3 py-2.5";

function formatCount(value: number | null): string {
  if (value == null) return "—";
  return String(value);
}

export function OperarioHistorialPuntosTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        No hay recolecciones Empresa + Punto en este rango de fechas.
      </div>
    );
  }

  return (
    <OperarioScrollableTable
      maxHeightClass="max-h-[min(70vh,40rem)]"
      footer={`${rows.length} recolección${rows.length === 1 ? "" : "es"} Empresa + Punto`}
    >
      <table className="min-w-full text-left text-sm">
        <thead className={OPERARIO_TABLE_HEAD_STICKY}>
          <tr>
            <th className={TH}>Fecha</th>
            <th className={TH}>Punto</th>
            <th className={`${TH} text-right`}>Bolsas de clientes llenas</th>
            <th className={`${TH} text-right`}>Bolsas nuevas vendidas</th>
            <th className={`${TH} text-right`}>Bolsas llenas punto</th>
            <th className={`${TH} text-right`}>Monto</th>
            <th className={TH}>Forma de pago</th>
            <th className={`${TH} text-right`}>Bolsas nuevas</th>
            <th className={TH}>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-t border-zinc-100 dark:border-zinc-800"
            >
              <td className={`${TD} font-medium text-zinc-800 dark:text-zinc-200`}>
                {row.fechaLabel}
              </td>
              <td className="max-w-[220px] truncate px-3 py-2.5 font-medium text-zinc-900 dark:text-zinc-50" title={row.punto}>
                {row.punto}
              </td>
              <td className={`${TD} text-right tabular-nums text-zinc-700 dark:text-zinc-300`}>
                {formatCount(row.bolsasClientesLlenas)}
              </td>
              <td className={`${TD} text-right tabular-nums text-zinc-700 dark:text-zinc-300`}>
                {formatCount(row.bolsasNuevasVendidas)}
              </td>
              <td className={`${TD} text-right tabular-nums text-zinc-700 dark:text-zinc-300`}>
                {formatCount(row.bolsasLlenasPunto)}
              </td>
              <td className={`${TD} text-right tabular-nums font-medium text-zinc-800 dark:text-zinc-200`}>
                {formatMoney(row.monto)}
              </td>
              <td
                className="max-w-[240px] truncate px-3 py-2.5 text-zinc-600 dark:text-zinc-400"
                title={row.formaPago !== "—" ? row.formaPago : undefined}
              >
                {row.formaPago}
              </td>
              <td className={`${TD} text-right tabular-nums text-zinc-700 dark:text-zinc-300`}>
                {formatCount(row.bolsasNuevas)}
              </td>
              <td
                className="max-w-[280px] truncate px-3 py-2.5 text-zinc-600 dark:text-zinc-400"
                title={row.observaciones ?? undefined}
              >
                {row.observaciones?.trim() || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </OperarioScrollableTable>
  );
}
