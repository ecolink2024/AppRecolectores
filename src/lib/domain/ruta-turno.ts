import type { RutaTurno } from "@/types/database";

/** Ventanas operativas de cada turno (hora local Argentina, como en la planilla). */
export const RUTA_TURNO_RANGOS = {
  manana: { desde: "08:30", hasta: "13:30" },
  tarde: { desde: "14:30", hasta: "20:30" },
} as const;

const MANANA_INICIO_MIN = 8 * 60 + 30;
const MANANA_FIN_MIN = 13 * 60 + 30;
const TARDE_INICIO_MIN = 14 * 60 + 30;
const TARDE_FIN_MIN = 20 * 60 + 30;

export const RUTA_TURNO_FUERA_RANGO_MSG =
  "Hora fuera de turno (mañana 8:30–13:30, tarde 14:30–20:30)";

function horaPartsToMinutes(hh: number, mm: number): number {
  return hh * 60 + mm;
}

/** Turno según hora programada; `null` si cae fuera de los rangos operativos. */
export function turnoFromHoraParts(hh: number, mm: number): RutaTurno | null {
  const min = horaPartsToMinutes(hh, mm);
  if (min >= MANANA_INICIO_MIN && min <= MANANA_FIN_MIN) return "manana";
  if (min >= TARDE_INICIO_MIN && min <= TARDE_FIN_MIN) return "tarde";
  return null;
}

/** Acepta `HH:MM` o `HH:MM:SS`. */
export function turnoFromHoraString(hora: string): RutaTurno | null {
  const match = hora.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return turnoFromHoraParts(Number(match[1]), Number(match[2]));
}

export function defaultHoraForTurno(turno: RutaTurno | null): string {
  if (turno === "tarde") return RUTA_TURNO_RANGOS.tarde.desde;
  return RUTA_TURNO_RANGOS.manana.desde;
}

/** Hora representativa del turno para ordenar rutas por proximidad (inicio de ventana). */
export function horaInicioTurnoForSort(turno: RutaTurno | null): string {
  if (turno === "tarde") return RUTA_TURNO_RANGOS.tarde.desde;
  return RUTA_TURNO_RANGOS.manana.desde;
}
