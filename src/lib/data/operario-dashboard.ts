import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRecoleccionOperarioRows,
  buildRutaOperarioRows,
  type RecolectorOption,
} from "@/lib/domain/operario-dashboard";
import {
  esRutaHistorial,
  esRutaOperativa,
  RUTA_ESTADOS_HISTORIAL,
} from "@/lib/domain/ruta-estado-transiciones";

type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

export type OperarioRutasFiltro = "operativo" | "historial";

export type HistorialFechaFiltro = {
  desde: string;
  hasta: string;
};

export async function fetchOperarioDashboardData(
  filtro: OperarioRutasFiltro = "operativo",
  opciones?: { fechas?: HistorialFechaFiltro },
) {
  const admin = createAdminClient();
  const limit = filtro === "historial" ? 5000 : 200;
  const fechas = filtro === "historial" ? opciones?.fechas : undefined;

  let query = admin.from("rutas").select("*");

  if (filtro === "historial") {
    query = query
      .in("estado", RUTA_ESTADOS_HISTORIAL)
      .order("fecha", { ascending: false })
      .order("turno", { ascending: true })
      .limit(limit);
    if (fechas) {
      query = query.gte("fecha", fechas.desde).lte("fecha", fechas.hasta);
    }
  } else {
    query = query
      .order("fecha", { ascending: true })
      .order("turno", { ascending: true })
      .limit(limit);
  }

  const { data: rutas, error: rutasError } = await query;

  if (rutasError) {
    return { rutas: [], recolecciones: [], recolectores: [] as RecolectorOption[], error: rutasError.message };
  }

  const rutasFiltradas = (rutas ?? []).filter((r) =>
    filtro === "historial" ? esRutaHistorial(r.estado) : esRutaOperativa(r.estado),
  );

  const rutaIds = rutasFiltradas.map((r) => r.id);
  let recoleccionesRaw: RecoleccionRow[] = [];

  if (rutaIds.length > 0) {
    const { data } = await admin
      .from("ruta_recolecciones")
      .select("*")
      .in("ruta_id", rutaIds)
      .order("orden", { ascending: true });
    recoleccionesRaw = data ?? [];
  }

  const { data: recolectores } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "recolector");

  const operarioIds = [
    ...new Set(
      rutasFiltradas
        .map((r) => r.cierre_operario_por)
        .filter((id): id is string => !!id),
    ),
  ];

  let operarios: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "id" | "full_name" | "email"
  >[] = [];

  if (operarioIds.length > 0) {
    const { data } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", operarioIds);
    operarios = data ?? [];
  }

  const rutasRows = buildRutaOperarioRows(
    rutasFiltradas,
    recoleccionesRaw,
    recolectores ?? [],
    operarios,
  );
  const recolecciones = buildRecoleccionOperarioRows(recoleccionesRaw);

  const recolectoresOptions: RecolectorOption[] = (recolectores ?? []).map((r) => ({
    id: r.id,
    nombre: r.full_name || r.email || "Sin nombre",
  }));

  return { rutas: rutasRows, recolecciones, recolectores: recolectoresOptions, error: null };
}
