import type { UserRole } from "@/lib/auth/constants";
import type { RutaEstado as DbRutaEstado } from "@/types/database";

export const ORGANIZACION_TIPOS = ["generador", "empresa", "cooperativa"] as const;
export type OrganizacionTipo = (typeof ORGANIZACION_TIPOS)[number];

export const ORGANIZACION_TIPO_LABELS: Record<OrganizacionTipo, string> = {
  generador: "Generador",
  empresa: "Empresa",
  cooperativa: "Cooperativa",
};

export const RECOLECCION_ESTADOS = [
  "borrador",
  "solicitada",
  "asignada",
  "en_camino",
  "recolectada",
  "en_planta",
  "transformada",
  "cancelada",
] as const;

export type RecoleccionEstado = (typeof RECOLECCION_ESTADOS)[number];

export const RECOLECCION_ESTADO_LABELS: Record<RecoleccionEstado, string> = {
  borrador: "Borrador",
  solicitada: "Solicitada",
  asignada: "Asignada",
  en_camino: "En camino",
  recolectada: "Recolectada",
  en_planta: "En planta",
  transformada: "Transformada",
  cancelada: "Cancelada",
};

export const RECOLECTOR_ESTADOS: RecoleccionEstado[] = [
  "asignada",
  "en_camino",
  "recolectada",
  "en_planta",
];

export function isStaffRole(role: UserRole) {
  return role === "superadmin" || role === "admin";
}

export const RUTA_ESTADOS = [
  "borrador",
  "activa",
  "en_curso",
  "completada",
  "cerrada",
  "cancelada",
] as const;

export type RutaEstado = (typeof RUTA_ESTADOS)[number];

export const RUTA_ESTADO_LABELS: Record<RutaEstado, string> = {
  borrador: "Borrador",
  activa: "Activa",
  en_curso: "En curso",
  completada: "Completada",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};

/** Etiquetas para la vista operaria del panel */
export const RUTA_ESTADO_OPERARIO_LABELS: Record<RutaEstado, string> = {
  borrador: "Pendiente",
  activa: "Pendiente",
  en_curso: "En proceso",
  completada: "Realizado",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};

export function rutaEstadoOperarioLabel(estado: DbRutaEstado): string {
  if (estado === "suspendida") return "Suspendida";
  return RUTA_ESTADO_OPERARIO_LABELS[estado];
}

export const RUTA_TURNOS = ["manana", "tarde"] as const;

export const RUTA_TURNO_LABELS = {
  manana: "Mañana",
  tarde: "Tarde",
} as const;

export const RECOLECCION_OPERATIVA_ESTADOS = [
  "pendiente",
  "en_camino",
  "visitada",
  "omitida",
  "cancelada",
] as const;

export const RECOLECCION_OPERATIVA_LABELS = {
  pendiente: "Pendiente",
  en_camino: "En camino",
  visitada: "Visitada",
  omitida: "Omitida",
  cancelada: "Cancelada",
} as const;

/** Valores canónicos de planilla / panel (columna «Tipo de cliente» / tipo_servicio). */
export const RECOLECCION_TIPOS_CLIENTE = ["Reciclaje", "Mixto", "Organico", "Punto"] as const;
export type RecoleccionTipoCliente = (typeof RECOLECCION_TIPOS_CLIENTE)[number];

export const RECOLECCION_TIPO_CLIENTE_LABELS: Record<RecoleccionTipoCliente, string> = {
  Reciclaje: "Reciclaje",
  Mixto: "Mixto",
  Organico: "Orgánico",
  Punto: "Punto",
};

export function formatTipoClienteLabel(value: string | null | undefined): string {
  const text = value?.trim();
  if (!text) return "—";
  const folded = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const found = RECOLECCION_TIPOS_CLIENTE.find((t) => t.toLowerCase() === folded);
  if (found) return RECOLECCION_TIPO_CLIENTE_LABELS[found];
  if (folded === "puntos") return RECOLECCION_TIPO_CLIENTE_LABELS.Punto;
  return text;
}
