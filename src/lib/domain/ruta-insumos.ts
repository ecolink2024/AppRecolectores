export const INSUMO_TIPOS = [
  "Bolsa Nueva",
  "Cesto",
  "Biotacho",
  "Bolsa de Punto",
  "Planilla Empresas",
  "Planilla de Punto",
  "Cartel Empresa",
] as const;

export type InsumoTipo = (typeof INSUMO_TIPOS)[number];

export type InsumoInicio = {
  tipo: InsumoTipo;
  cantidad: number;
};

export const MAX_INSUMOS_INICIO = 20;

export function parseInsumosFromJson(value: unknown): InsumoInicio[] {
  if (!Array.isArray(value)) return [];
  const insumos: InsumoInicio[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const tipo = String(row.tipo ?? "").trim();
    const cantidadRaw = row.cantidad;
    const cantidad =
      typeof cantidadRaw === "number"
        ? cantidadRaw
        : typeof cantidadRaw === "string"
          ? Number.parseInt(cantidadRaw, 10)
          : NaN;

    if (!INSUMO_TIPOS.includes(tipo as InsumoTipo)) continue;
    if (!Number.isInteger(cantidad) || cantidad <= 0) continue;

    insumos.push({ tipo: tipo as InsumoTipo, cantidad });
  }

  return insumos;
}

export function insumosOperarioCompletados(value: unknown): boolean {
  return parseInsumosFromJson(value).length > 0;
}

function parseInsumosLista(raw: unknown):
  | { ok: true; insumos: InsumoInicio[] }
  | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "Agregá al menos un insumo con cantidad mayor a cero" };
  }

  if (raw.length > MAX_INSUMOS_INICIO) {
    return { ok: false, error: `Máximo ${MAX_INSUMOS_INICIO} insumos` };
  }

  const insumos: InsumoInicio[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Formato de insumos inválido" };
    }

    const row = item as Record<string, unknown>;
    const tipo = String(row.tipo ?? "").trim();
    const cantidadRaw = row.cantidad;
    const cantidad =
      typeof cantidadRaw === "number"
        ? cantidadRaw
        : typeof cantidadRaw === "string"
          ? Number.parseInt(cantidadRaw, 10)
          : NaN;

    if (!INSUMO_TIPOS.includes(tipo as InsumoTipo)) {
      return { ok: false, error: `Insumo inválido: ${tipo || "(vacío)"}` };
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return { ok: false, error: `Cantidad inválida para ${tipo}` };
    }

    insumos.push({ tipo: tipo as InsumoTipo, cantidad });
  }

  return { ok: true, insumos };
}

export function parseInsumosOperarioBody(body: Record<string, unknown>):
  | { ok: true; data: { insumos: InsumoInicio[] } }
  | { ok: false; error: string } {
  const parsed = parseInsumosLista(body.insumos);
  if (!parsed.ok) return parsed;
  return { ok: true, data: { insumos: parsed.insumos } };
}

export function parseInicioRutaBody(body: Record<string, unknown>):
  | { ok: true; data: { km_inicial: number; insumos: InsumoInicio[] } }
  | { ok: false; error: string } {
  const kmRaw = body.km_inicial;
  const km =
    typeof kmRaw === "number"
      ? kmRaw
      : typeof kmRaw === "string"
        ? Number(kmRaw.replace(",", "."))
        : NaN;

  if (!Number.isFinite(km) || km <= 0) {
    return { ok: false, error: "Los kilómetros iniciales deben ser mayores a cero" };
  }

  const insumosParsed = parseInsumosLista(body.insumos);
  if (!insumosParsed.ok) {
    return insumosParsed;
  }

  return { ok: true, data: { km_inicial: km, insumos: insumosParsed.insumos } };
}

export function formatInsumosResumen(insumos: InsumoInicio[]): string {
  if (insumos.length === 0) return "—";
  return insumos.map((item) => `${item.tipo} ×${item.cantidad}`).join(", ");
}
