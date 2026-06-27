import type { Database, RutaEstado as DbRutaEstado, RutaTurno } from "@/types/database";
import { RUTA_ESTADO_LABELS, RUTA_TURNO_LABELS, type RutaEstado } from "@/lib/domain/constants";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type RutaListItem = RutaRow & {
  paradas_count: number;
  recolector_nombre: string | null;
};

export function enrichRutas(
  rutas: RutaRow[],
  paradaCounts: Map<string, number>,
  recolectores: Pick<ProfileRow, "id" | "full_name" | "email">[],
): RutaListItem[] {
  const recMap = new Map(
    recolectores.map((r) => [r.id, r.full_name || r.email]),
  );

  return rutas.map((ruta) => ({
    ...ruta,
    paradas_count: paradaCounts.get(ruta.id) ?? 0,
    recolector_nombre: ruta.asignado_a
      ? (recMap.get(ruta.asignado_a) ?? null)
      : null,
  }));
}

export function formatRutaEstado(estado: DbRutaEstado): string {
  if (estado === "suspendida") return "Suspendida";
  return RUTA_ESTADO_LABELS[estado as RutaEstado] ?? estado;
}

export function formatRutaFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  if (!y || !m || !d) return fecha;
  return `${d}/${m}/${y}`;
}

export type RutasByTurno<T extends { turno: RutaTurno | null; fecha: string; created_at: string }> = {
  manana: T[];
  tarde: T[];
  sinTurno: T[];
};

function sortRutasByFechaDesc<T extends { fecha: string; created_at: string }>(a: T, b: T): number {
  if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
  return b.created_at.localeCompare(a.created_at);
}

export function groupRutasByTurno<T extends { turno: RutaTurno | null; fecha: string; created_at: string }>(
  rutas: T[],
): RutasByTurno<T> {
  const manana: T[] = [];
  const tarde: T[] = [];
  const sinTurno: T[] = [];

  for (const ruta of rutas) {
    if (ruta.turno === "manana") manana.push(ruta);
    else if (ruta.turno === "tarde") tarde.push(ruta);
    else sinTurno.push(ruta);
  }

  manana.sort(sortRutasByFechaDesc);
  tarde.sort(sortRutasByFechaDesc);
  sinTurno.sort(sortRutasByFechaDesc);

  return { manana, tarde, sinTurno };
}

export function formatRutaTurno(turno: RutaTurno | null): string {
  if (!turno) return "Sin turno";
  return RUTA_TURNO_LABELS[turno];
}
