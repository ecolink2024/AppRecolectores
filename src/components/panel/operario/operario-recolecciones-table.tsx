import {
  RecoleccionEstadoBadge,
  RutaEstadoBadge,
  ZonaBadge,
} from "@/components/panel/operario/operario-badges";
import {
  formatHoraReal,
  formatMoney,
  type RecoleccionOperarioRow,
} from "@/lib/domain/operario-dashboard";

type Props = {
  recolecciones: RecoleccionOperarioRow[];
  rutaSeleccionada: boolean;
};

export function OperarioRecoleccionesTable({ recolecciones, rutaSeleccionada }: Props) {
  if (!rutaSeleccionada) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        Seleccioná una ruta en la tabla superior.
      </div>
    );
  }

  if (recolecciones.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        Esta ruta no tiene recolecciones cargadas.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-3 font-medium">Estado</th>
            <th className="px-3 py-3 font-medium">Zona</th>
            <th className="px-3 py-3 font-medium">Dirección</th>
            <th className="px-3 py-3 font-medium">Horario prog.</th>
            <th className="px-3 py-3 font-medium">Nombre</th>
            <th className="px-3 py-3 font-medium">Hora real</th>
            <th className="px-3 py-3 font-medium text-right">Precio total</th>
            <th className="px-3 py-3 font-medium text-right">Efectivo</th>
            <th className="px-3 py-3 font-medium text-right">Transferencia</th>
            <th className="px-3 py-3 font-medium">Observaciones</th>
            <th className="px-3 py-3 font-medium">Detalle</th>
            <th className="px-3 py-3 font-medium">Firma</th>
            <th className="px-3 py-3 font-medium">Firmante</th>
          </tr>
        </thead>
        <tbody>
          {recolecciones.map((item) => (
            <tr
              key={item.id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <td className="whitespace-nowrap px-3 py-2.5">
                <RecoleccionEstadoBadge estado={item.estado_operativo} />
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <ZonaBadge zona={item.zona} />
              </td>
              <td className="max-w-[160px] truncate px-3 py-2.5" title={item.direccion}>
                {item.direccion}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">{item.hora_programada}</td>
              <td className="px-3 py-2.5 font-medium">{item.nombre}</td>
              <td className="whitespace-nowrap px-3 py-2.5">
                {formatHoraReal(item.hora_real)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right">
                {formatMoney(item.precio_total ?? (item.precio_tarifa ? Number(item.precio_tarifa) || null : null))}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right">
                {formatMoney(item.monto_efectivo)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right">
                {formatMoney(item.monto_transferencia)}
              </td>
              <td className="max-w-[120px] truncate px-3 py-2.5 text-zinc-600" title={item.observaciones ?? undefined}>
                {item.observaciones || "—"}
              </td>
              <td className="max-w-[100px] truncate px-3 py-2.5 text-zinc-600" title={item.detalle ?? undefined}>
                {item.detalle || "—"}
              </td>
              <td className="px-3 py-2.5">
                {item.firma_digital ? (
                  <span className="text-emerald-700 dark:text-emerald-400">Sí</span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2.5">{item.nombre_firmante || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
