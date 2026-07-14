export const PRECIO_BOLSA_EXTRA_CLAVE = "bolsa_extra" as const;
export const PRECIO_RETIRO_RECICLABLE_MIXTO_CLAVE = "retiro_reciclable_mixto" as const;
export const PRECIO_BOLSA_PUNTO_CLAVE = "bolsa_punto" as const;
export const PRECIO_BOLSA_LLENA_PUNTO_CLAVE = "bolsa_llena_punto" as const;

export const PRECIO_PARAMETRO_CLAVES = [
  PRECIO_BOLSA_EXTRA_CLAVE,
  PRECIO_RETIRO_RECICLABLE_MIXTO_CLAVE,
  PRECIO_BOLSA_PUNTO_CLAVE,
  PRECIO_BOLSA_LLENA_PUNTO_CLAVE,
] as const;

export type PrecioParametroClave = (typeof PRECIO_PARAMETRO_CLAVES)[number];

export const PARAMETRO_PRECIO_SLUGS = {
  "bolsa-extra": PRECIO_BOLSA_EXTRA_CLAVE,
  "retiro-reciclable-mixto": PRECIO_RETIRO_RECICLABLE_MIXTO_CLAVE,
  "bolsa-punto": PRECIO_BOLSA_PUNTO_CLAVE,
  "bolsa-llena-punto": PRECIO_BOLSA_LLENA_PUNTO_CLAVE,
} as const;

export type ParametroPrecioSlug = keyof typeof PARAMETRO_PRECIO_SLUGS;

/** Orden de visualización en /panel/parametros */
export const PARAMETRO_PRECIO_ORDEN: ParametroPrecioSlug[] = [
  "bolsa-extra",
  "retiro-reciclable-mixto",
  "bolsa-punto",
  "bolsa-llena-punto",
];

export const PARAMETRO_PRECIO_UI: Record<
  ParametroPrecioSlug,
  { titulo: string; descripcion: string; inputLabel: string }
> = {
  "bolsa-extra": {
    titulo: "Precio bolsa extra - Hogar",
    descripcion:
      "Se suma por cada bolsa llena a partir de la 3.ª en el cobro en campo. Solo podés agregar un nuevo precio; el anterior se cierra automáticamente.",
    inputLabel: "Nuevo precio bolsa extra - Hogar *",
  },
  "retiro-reciclable-mixto": {
    titulo: "Retiro reciclables - Hogar Mixto",
    descripcion:
      "Cobro en campo para tipo de servicio Mixto (incluye hasta 2 bolsas llenas). Solo podés agregar un nuevo precio; el anterior se cierra automáticamente.",
    inputLabel: "Nuevo precio retiro reciclables - Hogar Mixto *",
  },
  "bolsa-punto": {
    titulo: "Precio bolsa punto",
    descripcion:
      "Cobro Empresa + Punto: precio por cada bolsa nueva vendida en campo. Solo podés agregar un nuevo precio; el anterior se cierra automáticamente.",
    inputLabel: "Nuevo precio bolsa punto *",
  },
  "bolsa-llena-punto": {
    titulo: "Precio bolsa llena hogar (Empresa + Punto)",
    descripcion:
      "Cobro Empresa + Punto: precio por cada bolsa llena hogar en campo. Las bolsas llenas punto solo se registran; el cobro punto va en los montos de pago. Solo podés agregar un nuevo precio; el anterior se cierra automáticamente.",
    inputLabel: "Nuevo precio bolsa llena hogar *",
  },
};

export function resolveParametroPrecioClave(slug: string): PrecioParametroClave | null {
  if (slug in PARAMETRO_PRECIO_SLUGS) {
    return PARAMETRO_PRECIO_SLUGS[slug as ParametroPrecioSlug];
  }
  return null;
}

export const BOLSAS_LLENAS_INCLUIDAS = 2;

export type PrecioCobroRegla = "estandar" | "empresa" | "empresa_punto" | "mixto";

export type PrecioCobroInput = {
  unidad: string | null;
  tipoServicio: string | null;
  precioRetiro: number;
  precioBolsaExtra: number;
  precioRetiroReciclableMixto: number;
  precioBolsaPunto: number;
  precioBolsaLlenaPunto: number;
  bolsasLlenas: number;
  bolsasLlenasPunto: number;
  bolsasNuevasVendidas: number;
};

export function normalizeUnidad(unidad: string | null | undefined): string {
  return (unidad ?? "").trim();
}

export function normalizeTipoServicio(tipoServicio: string | null | undefined): string {
  return (tipoServicio ?? "").trim();
}

export function isUnidadEmpresa(unidad: string | null | undefined): boolean {
  return normalizeUnidad(unidad).toLowerCase() === "empresa";
}

export function isTipoServicioMixto(tipoServicio: string | null | undefined): boolean {
  return normalizeTipoServicio(tipoServicio).toLowerCase() === "mixto";
}

/** Empresa + Punto: cobro automático = hogar × bolsa llena hogar + nuevas vendidas × bolsa punto. */
export function isEmpresaPuntoCobro(
  unidad: string | null | undefined,
  tipoServicio: string | null | undefined,
): boolean {
  if (!isUnidadEmpresa(unidad)) return false;
  const tipo = normalizeTipoServicio(tipoServicio).toLowerCase();
  return tipo === "punto" || tipo === "puntos";
}

export function resolvePrecioCobroRegla(
  unidad: string | null | undefined,
  tipoServicio: string | null | undefined,
): PrecioCobroRegla {
  if (isEmpresaPuntoCobro(unidad, tipoServicio)) return "empresa_punto";
  if (isUnidadEmpresa(unidad)) return "empresa";
  if (isTipoServicioMixto(tipoServicio)) return "mixto";
  return "estandar";
}

export function calcBolsasExtraCount(bolsasLlenas: number): number {
  if (!Number.isFinite(bolsasLlenas) || bolsasLlenas <= BOLSAS_LLENAS_INCLUIDAS) {
    return 0;
  }
  return bolsasLlenas - BOLSAS_LLENAS_INCLUIDAS;
}

export function calcPrecioBolsaExtraTotal(
  precioBolsaExtra: number,
  bolsasLlenas: number,
): number {
  return precioBolsaExtra * calcBolsasExtraCount(bolsasLlenas);
}

/** @deprecated Usar calcPrecioTotalCobrarConReglas */
export function calcPrecioTotalCobrar(
  precioRetiro: number,
  precioBolsaExtra: number,
  bolsasLlenas: number,
): number {
  return calcPrecioTotalCobrarConReglas({
    unidad: null,
    tipoServicio: null,
    precioRetiro,
    precioBolsaExtra,
    precioRetiroReciclableMixto: 0,
    precioBolsaPunto: 0,
    precioBolsaLlenaPunto: 0,
    bolsasLlenas,
    bolsasLlenasPunto: 0,
    bolsasNuevasVendidas: 0,
  });
}

export function calcPrecioEmpresaPunto(input: PrecioCobroInput): number {
  const hogar = sanitizeBolsasLlenas(input.bolsasLlenas);
  const vendidas = sanitizeBolsasLlenas(input.bolsasNuevasVendidas);
  return hogar * input.precioBolsaLlenaPunto + vendidas * input.precioBolsaPunto;
}

export function calcPrecioTotalCobrarConReglas(input: PrecioCobroInput): number {
  const bolsas = sanitizeBolsasLlenas(input.bolsasLlenas);
  const regla = resolvePrecioCobroRegla(input.unidad, input.tipoServicio);

  if (regla === "empresa_punto") {
    return calcPrecioEmpresaPunto(input);
  }

  if (regla === "empresa") {
    return input.precioRetiro;
  }

  if (regla === "mixto") {
    if (bolsas === 0) {
      return input.precioRetiro;
    }
    return (
      input.precioRetiroReciclableMixto +
      calcPrecioBolsaExtraTotal(input.precioBolsaExtra, bolsas)
    );
  }

  return input.precioRetiro + calcPrecioBolsaExtraTotal(input.precioBolsaExtra, bolsas);
}

export type PrecioCobroDetalle = {
  regla: PrecioCobroRegla;
  precioRetiro: number;
  precioBolsaExtra: number;
  precioRetiroReciclableMixto: number;
  precioBolsaPunto: number;
  precioBolsaLlenaPunto: number;
  bolsasLlenas: number;
  bolsasLlenasPunto: number;
  bolsasNuevasVendidas: number;
  bolsasConTarifaMixto: number;
  bolsasExtra: number;
  montoRetiroMixto: number;
  montoBolsaExtra: number;
  montoBolsaLlenaPunto: number;
  montoBolsaPunto: number;
  precioTotal: number;
  precioRetiroLabel: string;
  precioBolsaExtraLabel: string;
  precioRetiroReciclableMixtoLabel: string;
  precioBolsaPuntoLabel: string;
  precioBolsaLlenaPuntoLabel: string;
  montoRetiroMixtoLabel: string;
  montoBolsaExtraLabel: string;
  montoBolsaLlenaPuntoLabel: string;
  montoBolsaPuntoLabel: string;
  precioTotalLabel: string;
  bolsaExtraDetalleLabel: string | null;
  retiroMixtoDetalleLabel: string | null;
  bolsaLlenaPuntoDetalleLabel: string | null;
  bolsaPuntoDetalleLabel: string | null;
  ayudaCobro: string;
};

function sanitizeBolsasLlenas(bolsasLlenas: number): number {
  if (!Number.isFinite(bolsasLlenas) || bolsasLlenas < 0) return 0;
  return Math.floor(bolsasLlenas);
}

export function buildPrecioCobroDetalle(input: PrecioCobroInput): PrecioCobroDetalle {
  const bolsasLlenas = sanitizeBolsasLlenas(input.bolsasLlenas);
  const bolsasLlenasPunto = sanitizeBolsasLlenas(input.bolsasLlenasPunto);
  const bolsasNuevasVendidas = sanitizeBolsasLlenas(input.bolsasNuevasVendidas);
  const regla = resolvePrecioCobroRegla(input.unidad, input.tipoServicio);
  const precioRetiroLabel = formatParametroMoney(input.precioRetiro);
  const precioBolsaExtraLabel = formatParametroMoney(input.precioBolsaExtra);
  const precioRetiroReciclableMixtoLabel = formatParametroMoney(
    input.precioRetiroReciclableMixto,
  );
  const precioBolsaPuntoLabel = formatParametroMoney(input.precioBolsaPunto);
  const precioBolsaLlenaPuntoLabel = formatParametroMoney(input.precioBolsaLlenaPunto);

  const baseDetalle = {
    precioBolsaPunto: input.precioBolsaPunto,
    precioBolsaLlenaPunto: input.precioBolsaLlenaPunto,
    bolsasLlenasPunto,
    bolsasNuevasVendidas,
    precioBolsaPuntoLabel,
    precioBolsaLlenaPuntoLabel,
    montoBolsaLlenaPunto: 0,
    montoBolsaPunto: 0,
    montoBolsaLlenaPuntoLabel: formatParametroMoney(0),
    montoBolsaPuntoLabel: formatParametroMoney(0),
    bolsaLlenaPuntoDetalleLabel: null as string | null,
    bolsaPuntoDetalleLabel: null as string | null,
  };

  if (regla === "empresa_punto") {
    const montoBolsaLlenaPunto = bolsasLlenas * input.precioBolsaLlenaPunto;
    const montoBolsaPunto = bolsasNuevasVendidas * input.precioBolsaPunto;
    const precioTotal = montoBolsaLlenaPunto + montoBolsaPunto;

    return {
      regla,
      precioRetiro: input.precioRetiro,
      precioBolsaExtra: input.precioBolsaExtra,
      precioRetiroReciclableMixto: input.precioRetiroReciclableMixto,
      bolsasLlenas,
      bolsasConTarifaMixto: 0,
      bolsasExtra: 0,
      montoRetiroMixto: 0,
      montoBolsaExtra: 0,
      precioTotal,
      precioRetiroLabel,
      precioBolsaExtraLabel,
      precioRetiroReciclableMixtoLabel,
      montoRetiroMixtoLabel: formatParametroMoney(0),
      montoBolsaExtraLabel: formatParametroMoney(0),
      precioTotalLabel: formatParametroMoney(precioTotal),
      bolsaExtraDetalleLabel: null,
      retiroMixtoDetalleLabel: null,
      ...baseDetalle,
      montoBolsaLlenaPunto,
      montoBolsaPunto,
      montoBolsaLlenaPuntoLabel: formatParametroMoney(montoBolsaLlenaPunto),
      montoBolsaPuntoLabel: formatParametroMoney(montoBolsaPunto),
      bolsaLlenaPuntoDetalleLabel:
        bolsasLlenas > 0
          ? `${bolsasLlenas} bolsa(s) llena(s) hogar × ${precioBolsaLlenaPuntoLabel}`
          : null,
      bolsaPuntoDetalleLabel:
        bolsasNuevasVendidas > 0
          ? `${bolsasNuevasVendidas} bolsa(s) nueva(s) vendida(s) × ${precioBolsaPuntoLabel}`
          : null,
      ayudaCobro:
        "Empresa + Punto: total mínimo = (bolsas llenas hogar × precio bolsa llena hogar) + (bolsas nuevas vendidas × precio bolsa punto). Bolsas llenas punto: solo cantidad; el cobro en punto va en efectivo/transferencia/QR.",
    };
  }

  if (regla === "empresa") {
    return {
      regla,
      precioRetiro: input.precioRetiro,
      precioBolsaExtra: input.precioBolsaExtra,
      precioRetiroReciclableMixto: input.precioRetiroReciclableMixto,
      bolsasLlenas,
      bolsasConTarifaMixto: 0,
      bolsasExtra: 0,
      montoRetiroMixto: 0,
      montoBolsaExtra: 0,
      precioTotal: input.precioRetiro,
      precioRetiroLabel,
      precioBolsaExtraLabel,
      precioRetiroReciclableMixtoLabel,
      montoRetiroMixtoLabel: formatParametroMoney(0),
      montoBolsaExtraLabel: formatParametroMoney(0),
      precioTotalLabel: precioRetiroLabel,
      bolsaExtraDetalleLabel: null,
      retiroMixtoDetalleLabel: null,
      ...baseDetalle,
      ayudaCobro:
        "Empresa: el total es el precio de retiro de la planilla; no cambia por la cantidad de bolsas llenas.",
    };
  }

  if (regla === "mixto") {
    const bolsasExtra = bolsasLlenas > 0 ? calcBolsasExtraCount(bolsasLlenas) : 0;
    const montoRetiroMixto = bolsasLlenas > 0 ? input.precioRetiroReciclableMixto : 0;
    const montoBolsaExtra = calcPrecioBolsaExtraTotal(input.precioBolsaExtra, bolsasLlenas);
    const precioTotal =
      bolsasLlenas === 0 ? input.precioRetiro : montoRetiroMixto + montoBolsaExtra;

    return {
      regla,
      precioRetiro: input.precioRetiro,
      precioBolsaExtra: input.precioBolsaExtra,
      precioRetiroReciclableMixto: input.precioRetiroReciclableMixto,
      bolsasLlenas,
      bolsasConTarifaMixto: bolsasLlenas > 0 && bolsasLlenas <= BOLSAS_LLENAS_INCLUIDAS ? 1 : 0,
      bolsasExtra,
      montoRetiroMixto,
      montoBolsaExtra,
      precioTotal,
      precioRetiroLabel,
      precioBolsaExtraLabel,
      precioRetiroReciclableMixtoLabel,
      montoRetiroMixtoLabel: formatParametroMoney(montoRetiroMixto),
      montoBolsaExtraLabel: formatParametroMoney(montoBolsaExtra),
      precioTotalLabel: formatParametroMoney(precioTotal),
      retiroMixtoDetalleLabel:
        bolsasLlenas > 0
          ? `Incluye 1.ª y 2.ª bolsa llena (${precioRetiroReciclableMixtoLabel})`
          : null,
      bolsaExtraDetalleLabel:
        bolsasExtra > 0
          ? `${bolsasExtra} bolsa(s) extra × ${precioBolsaExtraLabel}`
          : null,
      ...baseDetalle,
      ayudaCobro:
        bolsasLlenas === 0
          ? "Mixto sin bolsas llenas: se usa el precio de retiro de la planilla."
          : "Se debe aplicar solo cuando un hogar con tipo de servicio mixto entrega 1 o 2 bolsas de reciclables",
    };
  }

  const bolsasExtra = calcBolsasExtraCount(bolsasLlenas);
  const montoBolsaExtra = calcPrecioBolsaExtraTotal(input.precioBolsaExtra, bolsasLlenas);
  const precioTotal = input.precioRetiro + montoBolsaExtra;

  return {
    regla: "estandar",
    precioRetiro: input.precioRetiro,
    precioBolsaExtra: input.precioBolsaExtra,
    precioRetiroReciclableMixto: input.precioRetiroReciclableMixto,
    bolsasLlenas,
    bolsasConTarifaMixto: 0,
    bolsasExtra,
    montoRetiroMixto: 0,
    montoBolsaExtra,
    precioTotal,
    precioRetiroLabel,
    precioBolsaExtraLabel,
    precioRetiroReciclableMixtoLabel,
    montoRetiroMixtoLabel: formatParametroMoney(0),
    montoBolsaExtraLabel: formatParametroMoney(montoBolsaExtra),
    precioTotalLabel: formatParametroMoney(precioTotal),
    bolsaExtraDetalleLabel:
      bolsasExtra > 0
        ? `${bolsasExtra} bolsa(s) extra × ${precioBolsaExtraLabel}`
        : null,
    retiroMixtoDetalleLabel: null,
    ...baseDetalle,
    ayudaCobro:
      "Se debe aplicar solo cuando un hogar con tipo de servicio reciclaje o mixto entrega una tercera bolsa o mas",
  };
}

export type PrecioHistorialRow = {
  id: string;
  clave: string;
  precio: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  created_by: string | null;
  created_at: string;
  creador_nombre: string | null;
  creador_email: string | null;
};

export type PrecioHistorialItem = {
  id: string;
  precio: number;
  precioLabel: string;
  vigenciaDesde: string;
  vigenciaDesdeLabel: string;
  vigenciaHasta: string | null;
  vigenciaHastaLabel: string;
  activo: boolean;
  creadorLabel: string;
  createdAtLabel: string;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatParametroMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatParametroDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseNuevoPrecioBody(
  body: Record<string, unknown>,
): { ok: true; precio: number } | { ok: false; error: string } {
  const raw = body.precio;
  const precio =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw.replace(",", "."))
        : NaN;

  if (!Number.isFinite(precio) || precio < 0) {
    return { ok: false, error: "El precio debe ser un número mayor o igual a cero" };
  }

  return { ok: true, precio };
}

export function buildPrecioHistorialItem(row: PrecioHistorialRow): PrecioHistorialItem {
  const precio = num(row.precio);
  const creadorLabel =
    row.creador_nombre?.trim() ||
    row.creador_email?.trim() ||
    (row.created_by ? "Usuario del sistema" : "—");

  return {
    id: row.id,
    precio,
    precioLabel: formatParametroMoney(precio),
    vigenciaDesde: row.vigencia_desde,
    vigenciaDesdeLabel: formatParametroDateTime(row.vigencia_desde),
    vigenciaHasta: row.vigencia_hasta,
    vigenciaHastaLabel: row.vigencia_hasta
      ? formatParametroDateTime(row.vigencia_hasta)
      : "Vigente",
    activo: row.vigencia_hasta == null,
    creadorLabel,
    createdAtLabel: formatParametroDateTime(row.created_at),
  };
}
