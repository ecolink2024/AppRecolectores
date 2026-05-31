import type { ReactNode } from "react";

import { RutaEstadoBadge } from "@/components/panel/operario/operario-badges";
import {
  formatMoney,
  formatRutaFecha,
  formatTurno,
  type RutaDetalleOperario,
} from "@/lib/domain/operario-dashboard";

type Props = {
  detalle: RutaDetalleOperario | null;
  operarioNombre: string;
};

type DetalleItem = {
  label: string;
  value: ReactNode;
  highlight?: boolean;
};

export function OperarioRutaDetalle({ detalle, operarioNombre }: Props) {
  if (!detalle) return null;

  const items: DetalleItem[] = [
    { label: "Fecha", value: formatRutaFecha(detalle.fecha) },
    { label: "ID Ruta", value: detalle.id.slice(0, 8) + "…" },
    { label: "Turno", value: formatTurno(detalle.turno) },
    { label: "Nombre operario", value: operarioNombre },
    { label: "Nombre recolector", value: detalle.recolector_nombre ?? "—" },
    { label: "Estado", value: <RutaEstadoBadge estado={detalle.estado} /> },
    { label: "Recolecciones exitosas", value: String(detalle.recolecciones_exitosas) },
    { label: "Recolecciones pendientes", value: String(detalle.recolecciones_pendientes) },
    { label: "Recolecciones canceladas", value: String(detalle.recolecciones_canceladas) },
    {
      label: "Total recaudado",
      value: formatMoney(detalle.total_recaudado),
      highlight: true,
    },
  ];

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900">
      <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
          >
            <dt className="shrink-0 text-zinc-500">{item.label}</dt>
            <dd
              className={`text-right font-medium ${
                item.highlight
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
