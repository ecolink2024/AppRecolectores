import { RutaEstadoBadge } from "@/components/panel/operario/operario-badges";
import {
  OPERARIO_SCROLL_RUTAS,
  OPERARIO_TABLE_HEAD_STICKY,
  OperarioScrollableTable,
} from "@/components/panel/operario/operario-scrollable-table";
import {
  formatDateTime,
  formatMaterialesRecolectadosDisplay,
  formatMoney,
  formatRutaFecha,
  formatTurno,
  type RutaOperarioRow,
} from "@/lib/domain/operario-dashboard";
import { puedeCierreOperario, puedeReactivarRuta, puedeSuspenderRuta } from "@/lib/domain/ruta-estado-transiciones";

type Props = {
  rutas: RutaOperarioRow[];
  selectedRutaId: string | null;
  onSelect: (id: string) => void;
  onVerDetalle: (id: string) => void;
  onVerMapa: (id: string) => void;
  onVerInsumos: (id: string) => void;
  onPrepararInsumos: (id: string) => void;
  onEditar: (id: string) => void;
  onSuspender?: (id: string) => void;
  onCierreOperario?: (id: string) => void;
  onReactivar?: (id: string) => void;
  mapsDisponible: boolean;
};

export function OperarioRutasTable({
  rutas,
  selectedRutaId,
  onSelect,
  onVerDetalle,
  onVerMapa,
  onVerInsumos,
  onPrepararInsumos,
  onEditar,
  onSuspender,
  onCierreOperario,
  onReactivar,
  mapsDisponible,
}: Props) {
  if (rutas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        Todavía no hay rutas activas, suspendidas ni realizadas pendientes de cierre operario.
      </div>
    );
  }

  return (
    <OperarioScrollableTable
      maxHeight={OPERARIO_SCROLL_RUTAS}
      footer={
        rutas.length > 8
          ? `${rutas.length} rutas · Desplazá vertical u horizontalmente para ver más`
          : `${rutas.length} ruta${rutas.length === 1 ? "" : "s"}`
      }
    >
      <table className="min-w-[1400px] w-full text-left text-sm">
        <thead className={OPERARIO_TABLE_HEAD_STICKY}>
          <tr>
            <th className="px-3 py-3 font-medium">Fecha</th>
            <th className="px-3 py-3 font-medium">Recolector</th>
            <th className="px-3 py-3 font-medium">Estado</th>
            <th className="px-3 py-3 font-medium">Turno</th>
            <th className="px-3 py-3 font-medium text-center">Puntos</th>
            <th className="px-3 py-3 font-medium text-center">Exitosas</th>
            <th className="px-3 py-3 font-medium text-center">Bolsas recolectadas</th>
            <th className="px-3 py-3 font-medium text-center">Biotachos</th>
            <th className="px-3 py-3 font-medium text-right">Km</th>
            <th className="px-3 py-3 font-medium">Inicio jornada</th>
            <th className="px-3 py-3 font-medium text-center">Preparación</th>
            <th className="px-3 py-3 font-medium text-center">Insumos</th>
            <th className="px-3 py-3 font-medium">Cierre recolector</th>
            <th className="px-3 py-3 font-medium">Cierre operario</th>
            <th className="px-3 py-3 font-medium text-right">Monto a recaudar</th>
            <th className="px-3 py-3 font-medium text-right">Total recaudado</th>
            <th className="px-3 py-3 font-medium">Observaciones</th>
            <th className="px-3 py-3 font-medium text-center">Detalle</th>
            <th className="px-3 py-3 font-medium text-center">Mapa</th>
            <th className="px-3 py-3 font-medium text-center">Acciones</th>
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
                <td
                  className="px-3 py-2.5 text-center font-medium"
                  title={ruta.bolsas_recolectadas_detalle ?? undefined}
                >
                  {formatMaterialesRecolectadosDisplay(ruta.bolsas_recolectadas)}
                </td>
                <td
                  className="px-3 py-2.5 text-center font-medium"
                  title={ruta.biotachos_recolectados_detalle ?? undefined}
                >
                  {formatMaterialesRecolectadosDisplay(ruta.biotachos_recolectados)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {ruta.km_recorridos != null ? ruta.km_recorridos : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600">
                  <span suppressHydrationWarning>
                    {formatDateTime(ruta.inicio_jornada_at)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrepararInsumos(ruta.id);
                    }}
                    className={
                      ruta.insumos_operario_completado
                        ? "rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                        : "rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
                    }
                    title={
                      ruta.insumos_operario_completado
                        ? "Preparación completada — ver o editar"
                        : "Completar insumos antes de que el recolector inicie"
                    }
                  >
                    {ruta.insumos_operario_completado ? "Ver prep." : "Completar"}
                  </button>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerInsumos(ruta.id);
                    }}
                    className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900"
                  >
                    Ver insumos
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600">
                  <span suppressHydrationWarning>
                    {formatDateTime(ruta.cierre_recolector_at)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600">
                  <span suppressHydrationWarning>
                    {formatDateTime(ruta.cierre_operario_at)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right text-zinc-700 dark:text-zinc-300">
                  {formatMoney(ruta.monto_a_recaudar)}
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
                <td className="px-3 py-2.5 text-center">
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(ruta.id);
                      }}
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Editar
                    </button>
                    {onCierreOperario && puedeCierreOperario(ruta.estado) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCierreOperario(ruta.id);
                        }}
                        className="rounded-lg border border-zinc-400 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                      >
                        Cierre operario
                      </button>
                    )}
                    {onReactivar && puedeReactivarRuta(ruta.estado) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReactivar(ruta.id);
                        }}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                      >
                        Reactivar
                      </button>
                    )}
                    {onSuspender && puedeSuspenderRuta(ruta.estado) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSuspender(ruta.id);
                        }}
                        className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800 hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
                      >
                        Suspender
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </OperarioScrollableTable>
  );
}
