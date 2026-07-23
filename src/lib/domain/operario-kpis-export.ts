import {
  csvRow,
  csvSectionTitle,
  downloadCsvFile,
} from "@/lib/domain/csv-download";
import { formatRutaFecha } from "@/lib/domain/rutas";
import type { KpiSerieMes, OperarioKpis } from "@/lib/domain/operario-kpis";
import {
  formatKpiDuracion,
  formatKpiMesLabel,
  formatKpiPercent,
} from "@/lib/domain/operario-kpis";

const row = csvRow;
const sectionTitle = csvSectionTitle;

function desgloseText(
  items: { label: string; count: number }[],
): string {
  if (items.length === 0) return "—";
  return items.map((i) => `${i.label}: ${i.count}`).join(" | ");
}

export function buildOperarioKpisCsv(kpis: OperarioKpis, serieMensual: KpiSerieMes[]): string {
  const lines: string[] = [];
  const { periodo, rutas, recolecciones, finanzas, materiales, operacion } = kpis;

  lines.push(row(["KPIs — App Recolectores"]));
  lines.push(row(["Generado", new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })]));
  lines.push(row(["Período", periodo.etiqueta]));
  lines.push(row(["Desde", formatRutaFecha(periodo.desde), periodo.desde]));
  lines.push(row(["Hasta", formatRutaFecha(periodo.hasta), periodo.hasta]));

  lines.push(...sectionTitle("RESUMEN"));
  lines.push(row(["Métrica", "Valor"]));
  lines.push(row(["Monto total por servicios prestados", finanzas.totalPrecio]));
  lines.push(row(["Monto real recaudado", finanzas.total]));
  lines.push(row(["Servicios exitosos", recolecciones.exitosas]));
  lines.push(row(["Índice de exitosas", formatKpiPercent(recolecciones.indiceExitosas)]));
  lines.push(row(["Rutas en el período (cerradas)", rutas.cerradas]));
  lines.push(row(["Rutas cerradas", rutas.cerradas]));
  lines.push(row(["Pendiente cierre operario", rutas.pendientesCierre]));
  lines.push(row(["Rutas realizadas", rutas.realizadas]));
  lines.push(row(["Canceladas", rutas.canceladas]));

  lines.push(...sectionTitle("RUTAS"));
  lines.push(row(["Métrica", "Cantidad"]));
  lines.push(row(["Total historial", rutas.total]));
  lines.push(row(["Pendiente cierre operario", rutas.pendientesCierre]));
  lines.push(row(["Realizadas", rutas.realizadas]));
  lines.push(row(["Cerradas", rutas.cerradas]));
  lines.push(row(["Canceladas", rutas.canceladas]));
  lines.push(
    row([
      "Nota: montos y materiales solo de rutas con cierre operario. Pendiente cierre no suma.",
    ]),
  );
  lines.push(row(["Estado", "Cantidad", "% del total"]));
  for (const e of rutas.porEstado) {
    const pct =
      rutas.total > 0 ? `${Math.round((e.count / rutas.total) * 100)}%` : "—";
    lines.push(row([e.label, e.count, pct]));
  }

  lines.push(...sectionTitle("RECOLECCIONES (SERVICIOS)"));
  lines.push(
    row(["Solo paradas de rutas con cierre operario en el período."]),
  );
  lines.push(row(["Métrica", "Cantidad"]));
  lines.push(row(["Total ingresadas", recolecciones.ingresadas]));
  lines.push(row(["Exitosas", recolecciones.exitosas]));
  lines.push(row(["Índice de exitosas", formatKpiPercent(recolecciones.indiceExitosas)]));
  lines.push(row(["Canceladas", recolecciones.canceladas]));
  lines.push(row(["Omitidas", recolecciones.omitidas]));
  lines.push(row(["Pendientes", recolecciones.pendientes]));

  lines.push(...sectionTitle("FINANZAS (período filtrado arriba: Desde/Hasta)"));
  lines.push(
    row([
      "Monto real recaudado = efectivo + transferencia + QR en paradas visitadas del período.",
    ]),
  );
  lines.push(row(["Concepto", "Monto (ARS)"]));
  lines.push(row(["Monto total por servicios prestados", finanzas.totalPrecio]));
  lines.push(row(["Efectivo", finanzas.efectivo]));
  lines.push(row(["Transferencia", finanzas.transferencia]));
  lines.push(row(["QR", finanzas.qr]));
  lines.push(row(["Monto real recaudado", finanzas.total]));
  lines.push(row(["Gastos (rutas con cierre operario)", finanzas.gastos]));
  lines.push(row(["Promedio por recolección", finanzas.promedioPorRecoleccion ?? ""]));

  lines.push(...sectionTitle("OPERACIÓN Y MATERIALES"));
  lines.push(row(["Métrica", "Valor"]));
  lines.push(row(["Km recorridos", operacion.kmRecorridos]));
  lines.push(row(["Rutas finalizadas (recolector)", operacion.rutasFinalizadasRecolector]));
  lines.push(row(["Duración promedio jornada", formatKpiDuracion(operacion.duracionPromedioMin)]));
  lines.push(row(["Bolsas llenas", materiales.bolsas]));
  lines.push(row(["Biotachos retirados", materiales.biotachos]));

  lines.push(...sectionTitle("POR ZONA"));
  lines.push(
    row([
      "Zona",
      "Recolecciones (servicios)",
      "Bolsas llenas",
      "Efectivo",
      "Transferencia",
      "QR",
      "Ingreso total",
      "Tipos de servicio (detalle)",
      "Frecuencias (detalle)",
    ]),
  );
  for (const z of kpis.porZona) {
    lines.push(
      row([
        z.zona,
        z.recolecciones,
        z.bolsas,
        z.efectivo,
        z.transferencia,
        z.qr,
        z.ingresoTotal,
        desgloseText(z.porTipoServicio),
        desgloseText(z.porFrecuencia),
      ]),
    );
  }

  lines.push(...sectionTitle("POR ZONA — TIPO DE SERVICIO"));
  lines.push(row(["Zona", "Tipo de servicio", "Cantidad"]));
  for (const z of kpis.porZona) {
    for (const item of z.porTipoServicio) {
      lines.push(row([z.zona, item.label, item.count]));
    }
  }

  lines.push(...sectionTitle("POR ZONA — FRECUENCIA"));
  lines.push(row(["Zona", "Frecuencia", "Cantidad"]));
  for (const z of kpis.porZona) {
    for (const item of z.porFrecuencia) {
      lines.push(row([z.zona, item.label, item.count]));
    }
  }

  lines.push(
    ...sectionTitle(
      "RECAUDACIÓN POR MES (48 meses; no usa el filtro Desde/Hasta de arriba)",
    ),
  );
  lines.push(
    row([
      "Por mes de la ruta: monto total por servicios prestados y monto real recaudado en paradas visitadas.",
    ]),
  );
  lines.push(
    row([
      "Mes",
      "Mes (ISO)",
      "Rutas en el mes",
      "Monto total por servicios prestados (ARS)",
      "Monto real recaudado (ARS)",
    ]),
  );
  for (const m of serieMensual) {
    lines.push(row([formatKpiMesLabel(m.mes), m.mes, m.rutas, m.totalPrecio, m.recaudado]));
  }

  lines.push(...sectionTitle("POR RECOLECTOR"));
  lines.push(row(["Recolector", "Rutas", "Agendadas", "Realizadas", "% éxito", "Ingresos (ARS)"]));
  for (const r of kpis.porRecolector) {
    lines.push(
      row([
        r.nombre,
        r.rutas,
        r.agendadas,
        r.realizadas,
        formatKpiPercent(r.porcentajeExito),
        r.ingresos,
      ]),
    );
  }

  return lines.join("\r\n");
}

export function downloadOperarioKpisCsv(kpis: OperarioKpis, serieMensual: KpiSerieMes[]): void {
  downloadCsvFile(
    `kpis_${kpis.periodo.desde}_${kpis.periodo.hasta}.csv`,
    buildOperarioKpisCsv(kpis, serieMensual),
  );
}
