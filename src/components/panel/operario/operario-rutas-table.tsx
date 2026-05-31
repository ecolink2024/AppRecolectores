import { RutaEstadoBadge } from "@/components/panel/operario/operario-badges";
import {
  formatDateTime,
  formatMoney,
  formatRutaFecha,
  formatTurno,
  type RutaOperarioRow,
} from "@/lib/domain/operario-dashboard";

type Props = {
  rutas: RutaOperarioRow[];
  selectedRutaId: string | null;
  onSelect: (id: string) => void;
  onVerDetalle: (id: string) => void;
  onVerMapa: (id: string) => void;
  mapsDisponible: boolean;
};

export function OperarioRutasTable({
  rutas,
  selectedRutaId,
  onSelect,
  onVerDetalle,
  onVerMapa,
  mapsDisponible,
}: Props) {
  if (rutas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        Todavía no hay rutas importadas desde la planilla.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-[1200px] w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-3 font-medium">Fecha</th>
            <th className="px-3 py-3 font-medium">Recolector</th>
            <th className="px-3 py-3 font-medium">Estado</th>
            <th className="px-3 py-3 font-medium">Turno</th>
            <th className="px-3 py-3 font-medium text-center">Puntos</th>
            <th className="px-3 py-3 font-medium text-center">Exitosas</th>
            <th className="px-3 py-3 font-medium text-right">Km</th>
            <th className="px-3 py-3 font-medium">Inicio jornada</th>
            <th className="px-3 py-3 font-medium">Cierre recolector</th>
            <th className="px-3 py-3 font-medium">Cierre operario</th>
            <th className="px-3 py-3 font-medium text-right">Total recaudado</th>
            <th className="px-3 py-3 font-medium">Observaciones</th>
            <th className="px-3 py-3 font-medium text-center">Detalle</th>
            <th className="px-3 py-3 font-medium text-center">Mapa</th>
          </tr>
        </thead>
        <tbody>
          {rutas.map((ruta) => {
            const selected = ruta.id === selectedRutaId;
            return (
              <tr
                key={ruta.id}
                onClick={() => onSelect(ruta.id)}
                className={`cursor-pointer border-b border-zinc-100 transition-colors last:border-0 dark:border-zinc-800 ${
                  selected
                    ? "bg-emerald-50 dark:bg-emerald-950/30"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                  {formatRutaFecha(ruta.fecha)}
                </td>
                <td className="px-3 py-2.5">{ruta.recolector_nombre ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <RutaEstadoBadge estado={ruta.estado} />
                </td>
                <td className="px-3 py-2.5">{formatTurno(ruta.turno)}</td>
                <td className="px-3 py-2.5 text-center">{ruta.puntos_recoleccion}</td>
                <td className="px-3 py-2.5 text-center">{ruta.recolecciones_exitosas}</td>
                <td className="px-3 py-2.5 text-right">
                  {ruta.km_recorridos != null ? ruta.km_recorridos : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600">
                  {formatDateTime(ruta.inicio_jornada_at)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600">
                  {formatDateTime(ruta.cierre_recolector_at)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600">
                  {formatDateTime(ruta.cierre_operario_at)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
                  {formatMoney(ruta.total_recaudado)}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2.5 text-zinc-600" title={ruta.observaciones_operario ?? undefined}>
                  {ruta.observaciones_operario || "—"}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerDetalle(ruta.id);
                    }}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                  >
                    Ver detalle
                  </button>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    type="button"
                    disabled={!mapsDisponible}
                    title={mapsDisponible ? "Ver mapa de la ruta" : "Falta configurar Google Maps"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerMapa(ruta.id);
                    }}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                  >
                    Ver mapa
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
