import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { fetchSerieMensualRecaudacion } from "@/lib/data/operario-kpis-serie-mensual";
import { RUTA_ESTADOS_HISTORIAL } from "@/lib/domain/ruta-estado-transiciones";
import {
  buildOperarioKpis,
  buildSerieMensualRecaudacion,
  rangoMesesSerieRecaudacion,
  resolveKpiFiltroFechas,
  type KpiFiltroFechas,
  type KpiSerieMes,
  type OperarioKpis,
} from "@/lib/domain/operario-kpis";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];
type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

export type KpiFetchParams = {
  periodo?: string;
  desde?: string;
  hasta?: string;
};

export async function fetchOperarioKpisData(
  params: KpiFetchParams = {},
): Promise<{
  kpis: OperarioKpis;
  serieMensual: KpiSerieMes[];
  filtro: KpiFiltroFechas;
  error: string | null;
}> {
  const filtro = resolveKpiFiltroFechas(params);
  const periodo = {
    desde: filtro.desde,
    hasta: filtro.hasta,
    etiqueta: filtro.etiqueta,
  };

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return {
      kpis: emptyKpis(periodo),
      serieMensual: emptySerieMensual(),
      filtro,
      error: message,
    };
  }

  const serieMensualPromise = fetchSerieMensualRecaudacion(admin);

  const { data: rutas, error: rutasError } = await admin
    .from("rutas")
    .select("*")
    .in("estado", RUTA_ESTADOS_HISTORIAL)
    .gte("fecha", periodo.desde)
    .lte("fecha", periodo.hasta)
    .order("fecha", { ascending: true })
    .limit(5000);

  if (rutasError) {
    const { serie, error: serieError } = await serieMensualPromise;
    return {
      kpis: emptyKpis(periodo),
      serieMensual: serie,
      filtro,
      error: rutasError.message ?? serieError,
    };
  }

  const rutasRows = rutas ?? [];
  const rutaIds = rutasRows.map((r) => r.id);
  let recolecciones: RecoleccionRow[] = [];

  if (rutaIds.length > 0) {
    const { data, error: recError } = await admin
      .from("ruta_recolecciones")
      .select("*")
      .in("ruta_id", rutaIds);

    if (recError) {
      const { serie, error: serieError } = await serieMensualPromise;
      return {
        kpis: emptyKpis(periodo),
        serieMensual: serie,
        filtro,
        error: recError.message ?? serieError,
      };
    }
    recolecciones = data ?? [];
  }

  const { data: recolectores } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "recolector");

  const nombreMap = new Map(
    (recolectores ?? []).map((r) => [r.id, r.full_name || r.email || "Sin nombre"]),
  );

  const kpis = buildOperarioKpis(rutasRows, recolecciones, nombreMap, periodo);
  const { serie: serieMensual, error: serieError } = await serieMensualPromise;

  return { kpis, serieMensual, filtro, error: serieError };
}

function emptySerieMensual(): KpiSerieMes[] {
  const { desdeMes, hastaMes } = rangoMesesSerieRecaudacion();
  return buildSerieMensualRecaudacion([], [], desdeMes, hastaMes);
}

function emptyKpis(periodo: { desde: string; hasta: string; etiqueta: string }): OperarioKpis {
  return buildOperarioKpis([], [], new Map(), periodo);
}
