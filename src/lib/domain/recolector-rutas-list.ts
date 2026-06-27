import type { RutaEstado } from "@/types/database";

export type RecolectorRutaCategoria = "activas" | "completadas";

export type RutasByCategoriaRecolector<T extends { estado: RutaEstado; fecha: string; created_at: string }> = {
  activas: T[];
  completadas: T[];
};

const CATEGORIA_SECTIONS: { key: RecolectorRutaCategoria; label: string; icon: string }[] = [
  { key: "activas", label: "Activas", icon: "🟢" },
  { key: "completadas", label: "Completadas", icon: "✅" },
];

function sortRutasByFechaDesc<T extends { fecha: string; created_at: string }>(a: T, b: T): number {
  if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
  return b.created_at.localeCompare(a.created_at);
}

export function categoriaRutaRecolector(estado: RutaEstado): RecolectorRutaCategoria {
  if (estado === "completada" || estado === "cerrada" || estado === "cancelada") return "completadas";
  return "activas";
}

export function groupRutasByCategoriaRecolector<
  T extends { estado: RutaEstado; fecha: string; created_at: string },
>(rutas: T[]): RutasByCategoriaRecolector<T> {
  const activas: T[] = [];
  const completadas: T[] = [];

  for (const ruta of rutas) {
    const categoria = categoriaRutaRecolector(ruta.estado);
    if (categoria === "activas") activas.push(ruta);
    else completadas.push(ruta);
  }

  activas.sort(sortRutasByFechaDesc);
  completadas.sort(sortRutasByFechaDesc);

  return { activas, completadas };
}

export function getCategoriaSections<T extends { estado: RutaEstado; fecha: string; created_at: string }>(
  grouped: RutasByCategoriaRecolector<T>,
) {
  return CATEGORIA_SECTIONS.filter(({ key }) => grouped[key].length > 0);
}
