import { RutaEstadoBadge } from "@/components/panel/operario/operario-badges";
import {
  OPERARIO_SCROLL_HISTORIAL_RUTAS,
  OperarioScrollableTable,
} from "@/components/panel/operario/operario-scrollable-table";
import {
  formatDateTime,
  formatKm,
  formatMoney,
  formatRutaFecha,
  formatTurno,
  type RutaOperarioRow,
} from "@/lib/domain/operario-dashboard";
import { formatObservacionesHistorial } from "@/lib/domain/operario-historial-ruta";

type Props = {
  rutas: RutaOperarioRow[];
  selectedRutaId: string | null;
  onSelect: (id: string) => void;
  onVerInsumos: (id: string) => void;
};

/** Primera columna fija al scroll horizontal */
const STICKY_1 =
  "sticky left-0 z-30 min-w-[6.5rem] bg-inherit shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.4)]";
/** Segunda columna fija */
const STICKY_2 =
  "sticky left-[6.5rem] z-30 min-w-[9.5rem] max-w-[9.5rem] bg-inherit shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.4)]";
/** Tercera columna fija (borde derecho al separar del scroll) */
const STICKY_3 =
  "sticky left-[16rem] z-30 min-w-[5.5rem] border-r border-zinc-200 bg-inherit dark:border-zinc-700";

const TH = "whitespace-nowrap px-3 py-3 font-medium";
const TD = "whitespace-nowrap px-3 py-2.5";
const TH_HEAD =
  "sticky top-0 z-20 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 shadow-[0_1px_0_0_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]";
const TD_STICKY_HEAD = `${TH_HEAD} ${TH} z-40 bg-zinc-50 dark:bg-zinc-950`;

function stickyRowBg(selected: boolean) {
  return selected
    ? "bg-emerald-50 dark:bg-emerald-950/30"
    : "bg-white group-hover:bg-zinc-50 dark:bg-zinc-900 dark:group-hover:bg-zinc-800/50";
}

export function OperarioHistorialRutasTable({
  rutas,
  selectedRutaId,
  onSelect,
  onVerInsumos,
}: Props) {
  if (rutas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        No hay rutas cerradas ni canceladas en el historial.
      </div>
    );
  }

  return (
    <OperarioScrollableTable
      maxHeight={OPERARIO_SCROLL_HISTORIAL_RUTAS}
      footer={
        rutas.length > 8
          ? `${rutas.length} rutas en historial · Desplazá para ver más`
          : `${rutas.length} ruta${rutas.length === 1 ? "" : "s"} en historial`
      }
    >
      <table className="min-w-[3200px] w-full text-left text-sm">
        <thead className={TH_HEAD}>
          <tr>
            <th className={`${TD_STICKY_HEAD} ${STICKY_1}`}>Fecha</th>
            <th className={`${TD_STICKY_HEAD} ${STICKY_2}`}>Nombre recolector</th>
            <th className={`${TD_STICKY_HEAD} ${STICKY_3}`}>Turno</th>
            <th className={TH}>Duración recolección</th>
            <th className={TH}>Nombre operario</th>
            <th className={TH}>Inicio jornada</th>
            <th className={TH}>Cierre recolector</th>
            <th className={TH}>Cierre operario</th>
            <th className={`${TH} text-right`}>Km iniciales</th>
            <th className={`${TH} text-right`}>Km finales</th>
            <th className={TH}>Observaciones</th>
            <th className={TH}>Estado</th>
            <th className={`${TH} text-center`}>Insumos</th>
            <th className={TH}>Descarga</th>
            <th className={`${TH} text-right`}>Combustible</th>
            <th className={`${TH} text-right`}>Descuento</th>
            <th className={`${TH} text-right`}>Otros gastos</th>
            <th className={`${TH} text-center`}>Recolecciones</th>
            <th className={`${TH} text-center`}>Exitosos</th>
            <th className={`${TH} text-center`}>Pendientes</th>
            <th className={`${TH} text-center`}>Canceladas</th>
            <th className={`${TH} text-right`}>Km recorridos</th>
            <th className={`${TH} text-right`}>Monto a recaudar</th>
            <th className={`${TH} text-right`}>Total recaudado</th>
            <th className={`${TH} text-right`}>Después de gastos</th>
            <th className={`${TH} text-right`}>Total efectivo</th>
          </tr>
        </thead>
        <tbody>
          {rutas.map((ruta) => {
            const selected = ruta.id === selectedRutaId;
            const d = ruta.insumos_detalle;
            const observaciones = formatObservacionesHistorial(
              ruta.observaciones_recolector,
              ruta.observaciones_operario,
            );
            const rowBg = stickyRowBg(selected);

            return (
              <tr
                key={ruta.id}
                onClick={() => onSelect(ruta.id)}
                className={`group cursor-pointer border-b border-zinc-100 transition-colors last:border-0 dark:border-zinc-800 ${
                  selected
                    ? "bg-emerald-50 dark:bg-emerald-950/30"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <td className={`${TD} ${STICKY_1} font-medium ${rowBg}`}>
                  {formatRutaFecha(ruta.fecha)}
                </td>
                <td
                  className={`${TD} ${STICKY_2} truncate ${rowBg}`}
                  title={ruta.recolector_nombre ?? undefined}
                >
                  {ruta.recolector_nombre ?? "—"}
                </td>
                <td className={`${TD} ${STICKY_3} ${rowBg}`}>
                  {formatTurno(ruta.turno)}
                </td>
                <td className={`${TD} text-zinc-600`}>{ruta.duracion_recoleccion ?? "—"}</td>
                <td className={TD}>{ruta.operario_nombre ?? "—"}</td>
                <td className={`${TD} text-zinc-600`}>
                  <span suppressHydrationWarning>
                    {formatDateTime(ruta.inicio_jornada_at)}
                  </span>
                </td>
                <td className={`${TD} text-zinc-600`}>
                  <span suppressHydrationWarning>
                    {formatDateTime(ruta.cierre_recolector_at)}
                  </span>
                </td>
                <td className={`${TD} text-zinc-600`}>
                  <span suppressHydrationWarning>
                    {formatDateTime(ruta.cierre_operario_at)}
                  </span>
                </td>
                <td className={`${TD} text-right`}>{formatKm(ruta.km_inicial)}</td>
                <td className={`${TD} text-right`}>{formatKm(ruta.km_final)}</td>
                <td
                  className={`max-w-[180px] truncate px-3 py-2.5 text-zinc-600`}
                  title={observaciones !== "—" ? observaciones : undefined}
                >
                  {observaciones}
                </td>
                <td className={TD}>
                  <RutaEstadoBadge estado={ruta.estado} />
                </td>
                <td className={`${TD} text-center`}>
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
                <td className={TD}>{d.descarga ? "Sí" : "No"}</td>
                <td className={`${TD} text-right`}>{formatMoney(d.combustible)}</td>
                <td className={`${TD} text-right`}>{formatMoney(d.descuento)}</td>
                <td className={`${TD} text-right`}>{formatMoney(d.otrosGastos)}</td>
                <td className={`${TD} text-center`}>{d.puntosRecoleccion}</td>
                <td className={`${TD} text-center`}>{d.exitosos}</td>
                <td className={`${TD} text-center`}>{d.pendientes}</td>
                <td className={`${TD} text-center`}>{d.canceladas}</td>
                <td className={`${TD} text-right`}>
                  {d.kmRecorridos != null ? `${formatKm(d.kmRecorridos)}` : "—"}
                </td>
                <td className={`${TD} text-right text-zinc-700 dark:text-zinc-300`}>
                  {formatMoney(ruta.monto_a_recaudar)}
                </td>
                <td className={`${TD} text-right font-medium`}>
                  {formatMoney(ruta.total_recaudado)}
                </td>
                <td className={`${TD} text-right`}>
                  {formatMoney(d.recaudadoDespuesGastos)}
                </td>
                <td className={`${TD} text-right font-medium text-emerald-700 dark:text-emerald-400`}>
                  {formatMoney(d.totalEfectivo)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </OperarioScrollableTable>
  );
}
