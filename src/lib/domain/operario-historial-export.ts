import {
  RECOLECCION_OPERATIVA_LABELS,
  rutaEstadoOperarioLabel,
} from "@/lib/domain/constants";
import {
  csvRow,
  csvSectionTitle,
  downloadCsvFile,
} from "@/lib/domain/csv-download";
import {
  esFirmaDigitalImagen,
  formatDateTime,
  formatHoraReal,
  formatRutaHorario,
  formatTurno,
  type RecoleccionOperarioRow,
  type RutaOperarioRow,
} from "@/lib/domain/operario-dashboard";
import { formatObservacionesHistorial } from "@/lib/domain/operario-historial-ruta";
import { formatRutaFecha } from "@/lib/domain/rutas";

function firmaExport(firma: string | null): string {
  if (!firma) return "";
  if (esFirmaDigitalImagen(firma)) return "Imagen";
  return "Confirmada";
}

function precioRecoleccion(item: RecoleccionOperarioRow): number | null {
  if (item.precio_total != null) return item.precio_total;
  if (item.precio_tarifa) {
    const n = Number(item.precio_tarifa);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function buildHistorialCsv(
  rutas: RutaOperarioRow[],
  recolecciones: RecoleccionOperarioRow[],
): string {
  const lines: string[] = [];
  const rutaMap = new Map(rutas.map((r) => [r.id, r]));

  lines.push(csvRow(["Historial — App Recolectores"]));
  lines.push(
    csvRow([
      "Generado",
      new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
    ]),
  );
  lines.push(csvRow(["Total rutas", rutas.length]));
  lines.push(csvRow(["Total servicios (recolecciones)", recolecciones.length]));

  lines.push(...csvSectionTitle("RUTAS"));
  lines.push(
    csvRow([
      "Fecha",
      "Fecha (ISO)",
      "Turno",
      "Nombre ruta",
      "Recolector",
      "Duración recolección",
      "Operario cierre",
      "Inicio jornada",
      "Cierre recolector",
      "Cierre operario",
      "Km iniciales",
      "Km finales",
      "Km recorridos",
      "Observaciones",
      "Estado",
      "Descarga",
      "Combustible",
      "Descuento",
      "Otros gastos",
      "Recolecciones",
      "Exitosos",
      "Pendientes",
      "Canceladas",
      "Monto a recaudar",
      "Total recaudado",
      "Después de gastos",
      "Total efectivo",
      "Insumos bolsas",
      "Insumos kit puntos",
      "Insumos cestos",
      "Insumos biotachos",
      "Insumos ropa",
      "Insumos celular",
    ]),
  );

  for (const ruta of rutas) {
    const d = ruta.insumos_detalle;
    lines.push(
      csvRow([
        formatRutaFecha(ruta.fecha),
        ruta.fecha,
        formatTurno(ruta.turno),
        ruta.nombre,
        ruta.recolector_nombre ?? "",
        ruta.duracion_recoleccion ?? "",
        ruta.operario_nombre ?? "",
        formatDateTime(ruta.inicio_jornada_at),
        formatDateTime(ruta.cierre_recolector_at),
        formatDateTime(ruta.cierre_operario_at),
        ruta.km_inicial ?? "",
        ruta.km_final ?? "",
        d.kmRecorridos ?? "",
        formatObservacionesHistorial(
          ruta.observaciones_recolector,
          ruta.observaciones_operario,
        ),
        rutaEstadoOperarioLabel(ruta.estado),
        d.descarga ? "Sí" : "No",
        d.combustible,
        d.descuento,
        d.otrosGastos,
        d.puntosRecoleccion,
        d.exitosos,
        d.pendientes,
        d.canceladas,
        ruta.monto_a_recaudar,
        ruta.total_recaudado,
        d.recaudadoDespuesGastos,
        d.totalEfectivo ?? "",
        d.bolsas,
        d.kitPuntos,
        d.cestos,
        d.biotachos,
        d.ropa,
        d.celular,
      ]),
    );
  }

  lines.push(...csvSectionTitle("RECOLECCIONES (SERVICIOS)"));
  lines.push(
    csvRow([
      "Fecha ruta",
      "Horario ruta",
      "Nombre ruta",
      "Recolector",
      "Orden",
      "Nombre cliente",
      "Dirección",
      "Barrio",
      "Zona",
      "Horario programado",
      "Hora real",
      "Unidad",
      "Tipo de cliente",
      "Frecuencia",
      "Biotachos llenos",
      "Biotachos nuevos",
      "Bolsas llenas",
      "Bolsas nuevas",
      "Precio total",
      "Monto efectivo",
      "Monto transferencia",
      "Monto QR",
      "Estado",
      "Motivo cancelación",
      "Observaciones",
      "Detalle",
      "Firma digital",
      "Nombre firmante",
      "Teléfono",
      "Deuda planilla",
      "Precio planilla",
    ]),
  );

  const recsOrdenadas = recolecciones
    .slice()
    .sort((a, b) => {
      const rutaA = rutaMap.get(a.ruta_id);
      const rutaB = rutaMap.get(b.ruta_id);
      const fa = rutaA?.fecha ?? "";
      const fb = rutaB?.fecha ?? "";
      if (fa !== fb) return fa.localeCompare(fb);
      if (a.ruta_id !== b.ruta_id) return a.ruta_id.localeCompare(b.ruta_id);
      return a.orden - b.orden;
    });

  for (const item of recsOrdenadas) {
    const ruta = rutaMap.get(item.ruta_id);
    lines.push(
      csvRow([
        ruta ? formatRutaFecha(ruta.fecha) : "",
        ruta ? formatRutaHorario(ruta.fecha, ruta.turno) : "",
        ruta?.nombre ?? "",
        ruta?.recolector_nombre ?? "",
        item.orden,
        item.nombre,
        item.direccion,
        item.barrio ?? "",
        item.zona ?? "",
        item.hora_programada,
        formatHoraReal(item.hora_real),
        item.unidad ?? "",
        item.tipo_servicio ?? "",
        item.frecuencia ?? "",
        item.biotachos_llenos ?? "",
        item.biotachos_nuevos ?? "",
        item.bolsas_llenas ?? "",
        item.bolsas_nuevas ?? "",
        precioRecoleccion(item) ?? "",
        item.monto_efectivo ?? "",
        item.monto_transferencia ?? "",
        item.monto_qr ?? "",
        RECOLECCION_OPERATIVA_LABELS[item.estado_operativo] ?? item.estado_operativo,
        item.motivo_cancelacion ?? "",
        item.observaciones ?? "",
        item.detalle ?? "",
        firmaExport(item.firma_digital),
        item.nombre_firmante ?? "",
        item.telefono ?? "",
        item.deuda ?? "",
        item.precio_tarifa ?? "",
      ]),
    );
  }

  return lines.join("\r\n");
}

export function downloadHistorialCsv(
  rutas: RutaOperarioRow[],
  recolecciones: RecoleccionOperarioRow[],
): void {
  const content = buildHistorialCsv(rutas, recolecciones);
  const fechas = rutas.map((r) => r.fecha).sort();
  const desde = fechas[0] ?? "sin-fecha";
  const hasta = fechas[fechas.length - 1] ?? desde;
  downloadCsvFile(`historial_${desde}_${hasta}.csv`, content);
}
