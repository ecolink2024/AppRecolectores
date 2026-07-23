"use client";

import Link from "next/link";
import { useState } from "react";

import { OperarioKpiPorZonaTable } from "@/components/panel/operario/operario-kpi-por-zona-table";
import { OperarioKpisFiltroFechas } from "@/components/panel/operario/operario-kpis-filtro-fechas";
import { OperarioKpiRecaudacionChart } from "@/components/panel/operario/operario-kpi-recaudacion-chart";
import { formatMoney, formatRutaFecha } from "@/lib/domain/operario-dashboard";
import {
  formatKpiDuracion,
  formatKpiNumber,
  formatKpiPercent,
  KPI_LABEL_SERVICIOS,
  type KpiFiltroModo,
  type KpiPeriodo,
  type KpiSerieMes,
  type OperarioKpis,
} from "@/lib/domain/operario-kpis";
import { downloadOperarioKpisCsv } from "@/lib/domain/operario-kpis-export";

type Props = {
  kpis: OperarioKpis;
  serieMensual: KpiSerieMes[];
  filtroModo: KpiFiltroModo;
  periodoPreset: KpiPeriodo | null;
};

function KpiCard({
  label,
  value,
  hint,
  accent = "emerald",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "emerald" | "blue" | "violet" | "amber" | "zinc";
}) {
  const accentClasses = {
    emerald:
      "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/40",
    blue: "border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/40",
    violet:
      "border-violet-200 bg-violet-50/80 dark:border-violet-900 dark:bg-violet-950/40",
    amber:
      "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/40",
    zinc: "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${accentClasses[accent]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function OperarioKpisDashboard({
  kpis,
  serieMensual,
  filtroModo,
  periodoPreset,
}: Props) {
  const [descargando, setDescargando] = useState(false);

  function handleDescargar() {
    setDescargando(true);
    try {
      downloadOperarioKpisCsv(kpis, serieMensual);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              KPIs
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {kpis.periodo.etiqueta} ·{" "}
              {formatRutaFecha(kpis.periodo.desde)} — {formatRutaFecha(kpis.periodo.hasta)}
              {" · "}
              Solo historial · montos y materiales al cerrar operario
            </p>
          </div>
          <button
            type="button"
            onClick={handleDescargar}
            disabled={descargando}
            className="rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {descargando ? "Generando…" : "Descargar KPIs (CSV)"}
          </button>
        </div>
        <OperarioKpisFiltroFechas
          desde={kpis.periodo.desde}
          hasta={kpis.periodo.hasta}
          modo={filtroModo}
          periodoPreset={periodoPreset}
        />
      </div>

      <Section
        title="Recaudación por mes"
        subtitle="Monto total por servicios prestados y monto real recaudado, por mes de la ruta. Solo rutas Cerradas (cierre operario). Ignora el filtro Desde/Hasta; últimos 12 meses visibles."
      >
        <OperarioKpiRecaudacionChart serie={serieMensual} />
      </Section>

      {kpis.rutas.total === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No hay rutas del historial en el período seleccionado.
          </p>
          <Link
            href="/panel/historial"
            className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Ir al historial
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              label="Total precio"
              value={formatMoney(kpis.finanzas.totalPrecio)}
              hint="Monto total por servicios prestados"
              accent="blue"
            />
            <KpiCard
              label="Total recaudado"
              value={formatMoney(kpis.finanzas.total)}
              hint="Monto real recaudado"
              accent="emerald"
            />
            <KpiCard
              label="Exitosas"
              value={formatKpiNumber(kpis.recolecciones.exitosas)}
              hint={`de ${formatKpiNumber(kpis.recolecciones.ingresadas)} ingresadas`}
              accent="blue"
            />
            <KpiCard
              label="Índice de exitosas"
              value={formatKpiPercent(kpis.recolecciones.indiceExitosas)}
              hint="Exitosas ÷ ingresadas"
              accent="violet"
            />
            <KpiCard
              label="Rutas en el período"
              value={formatKpiNumber(kpis.rutas.total)}
              hint={`${formatKpiNumber(kpis.rutas.realizadas)} finalizadas por recolector · ${formatKpiNumber(kpis.rutas.cerradas)} con cierre operario`}
              accent="amber"
            />
          </div>

          <Section title="Rutas" subtitle="Conteos del historial. Montos y materiales solo de rutas Cerradas (cierre operario).">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Pendiente cierre"
                value={formatKpiNumber(kpis.rutas.pendientesCierre)}
                hint="Realizado: aún no impacta montos/KPIs de recaudación"
                accent="zinc"
              />
              <KpiCard
                label="Realizadas"
                value={formatKpiNumber(kpis.rutas.realizadas)}
                hint="Finalizadas por recolector (incluye cerradas)"
                accent="zinc"
              />
              <KpiCard
                label="Cerradas"
                value={formatKpiNumber(kpis.rutas.cerradas)}
                hint="Con cierre operario · alimentan montos y materiales"
                accent="zinc"
              />
              <KpiCard
                label="Canceladas"
                value={formatKpiNumber(kpis.rutas.canceladas)}
                accent="zinc"
              />
            </div>
            {kpis.rutas.porEstado.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <ul className="space-y-2">
                  {kpis.rutas.porEstado.map((row) => {
                    const pct =
                      kpis.rutas.total > 0
                        ? Math.round((row.count / kpis.rutas.total) * 100)
                        : 0;
                    return (
                      <li key={row.estado} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {row.label}
                          </span>
                          <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                            {row.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Section>

          <Section
            title={KPI_LABEL_SERVICIOS}
            subtitle="Servicios (paradas) ingresados en rutas del período"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <KpiCard
                label="Total ingresadas"
                value={formatKpiNumber(kpis.recolecciones.ingresadas)}
                accent="zinc"
              />
              <KpiCard
                label="Exitosas"
                value={formatKpiNumber(kpis.recolecciones.exitosas)}
                accent="emerald"
              />
              <KpiCard
                label="Índice de exitosas"
                value={formatKpiPercent(kpis.recolecciones.indiceExitosas)}
                hint="Exitosas ÷ ingresadas"
                accent="violet"
              />
              <KpiCard
                label="Canceladas"
                value={formatKpiNumber(kpis.recolecciones.canceladas)}
                accent="zinc"
              />
              <KpiCard
                label="Omitidas"
                value={formatKpiNumber(kpis.recolecciones.omitidas)}
                accent="zinc"
              />
              <KpiCard
                label="Pendientes"
                value={formatKpiNumber(kpis.recolecciones.pendientes)}
                hint="Incluye en camino"
                accent="amber"
              />
            </div>
          </Section>

          {kpis.porZona.length > 0 && (
            <Section
              title="Por zona"
              subtitle="Servicios por zona, tipo de servicio, frecuencia e ingresos"
            >
              <OperarioKpiPorZonaTable filas={kpis.porZona} />
            </Section>
          )}

          <Section title="Finanzas" subtitle="Montos en servicios exitosos del período">
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <KpiCard
                label="Total precio"
                value={formatMoney(kpis.finanzas.totalPrecio)}
                hint="Monto total por servicios prestados"
                accent="blue"
              />
              <KpiCard
                label="Total recaudado"
                value={formatMoney(kpis.finanzas.total)}
                hint="Monto real recaudado"
                accent="emerald"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Efectivo"
                value={formatMoney(kpis.finanzas.efectivo)}
                accent="emerald"
              />
              <KpiCard
                label="Transferencia"
                value={formatMoney(kpis.finanzas.transferencia)}
                accent="blue"
              />
              <KpiCard
                label="QR"
                value={formatMoney(kpis.finanzas.qr)}
                accent="violet"
              />
              <KpiCard
                label="Promedio por recolección"
                value={
                  kpis.finanzas.promedioPorRecoleccion != null
                    ? formatMoney(kpis.finanzas.promedioPorRecoleccion)
                    : "—"
                }
                hint={`Total recaudado ÷ ${formatKpiNumber(kpis.recolecciones.exitosas)} exitosas`}
                accent="amber"
              />
            </div>
          </Section>

          <Section title="Operación y materiales">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Km recorridos"
                value={`${formatKpiNumber(kpis.operacion.kmRecorridos)} km`}
                accent="zinc"
              />
              <KpiCard
                label="Rutas finalizadas (recolector)"
                value={formatKpiNumber(kpis.operacion.rutasFinalizadasRecolector)}
                hint={`Duración prom.: ${formatKpiDuracion(kpis.operacion.duracionPromedioMin)}`}
                accent="zinc"
              />
              <KpiCard
                label="Bolsas llenas"
                value={formatKpiNumber(kpis.materiales.bolsas)}
                accent="zinc"
              />
              <KpiCard
                label="Biotachos retirados"
                value={formatKpiNumber(kpis.materiales.biotachos)}
                accent="zinc"
              />
            </div>
          </Section>

          {kpis.porRecolector.length > 0 && (
            <Section title="Por recolector" subtitle="Agendadas, realizadas e ingresos">
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950">
                    <tr>
                      <th className="px-4 py-3 font-medium">Recolector</th>
                      <th className="px-4 py-3 font-medium text-center">Agendadas</th>
                      <th className="px-4 py-3 font-medium text-center">Realizadas</th>
                      <th className="px-4 py-3 font-medium text-center">% éxito</th>
                      <th className="px-4 py-3 font-medium text-right">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.porRecolector.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                      >
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                          {row.nombre}
                          <span className="ml-2 text-xs font-normal text-zinc-500">
                            {row.rutas} ruta(s)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums">{row.agendadas}</td>
                        <td className="px-4 py-3 text-center tabular-nums text-emerald-800 dark:text-emerald-400">
                          {row.realizadas}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums">
                          {formatKpiPercent(row.porcentajeExito)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-emerald-800 dark:text-emerald-400">
                          {formatMoney(row.ingresos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
