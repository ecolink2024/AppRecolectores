import type { SupabaseClient } from "@supabase/supabase-js";

import { puedeAgregarRecoleccion } from "@/lib/domain/ruta-estado-transiciones";
import {
  buildRutaExternalKey,
  buildRutaNombre,
  type ValidatedRecoleccion,
} from "@/lib/integrations/sheet-recoleccion-validation";
import type { Database, RutaEstado, RutaTurno } from "@/types/database";

export type ImportRecoleccionPayload = {
  spreadsheet_id: string;
  spreadsheet_url?: string;
  sheet_name?: string;
  recolecciones: ValidatedRecoleccion[];
};

export type ImportFilaOmitida = {
  fila: number;
  motivo: string;
};

export type ImportRecoleccionResult = {
  ok: true;
  rutas_creadas: number;
  rutas_actualizadas: number;
  rutas_omitidas: number;
  filas_omitidas: number[];
  omitidas: ImportFilaOmitida[];
  recolecciones_count: number;
  warnings: string[];
  message: string;
};

export type ImportRecoleccionError = {
  ok: false;
  error: string;
  details?: string[];
};

type RutaGroup = {
  fecha: string;
  turno: ValidatedRecoleccion["turno"];
  recolector_email: string;
  recolector_id: string;
  recolector_label: string;
  items: ValidatedRecoleccion[];
};

type RutaMatch = {
  id: string;
  estado: RutaEstado;
  external_key: string | null;
};

const ESTADOS_OPERATIVOS: RutaEstado[] = ["borrador", "activa", "en_curso", "suspendida"];

function toRecoleccionRow(
  rutaId: string,
  item: ValidatedRecoleccion,
  orden: number,
) {
  return {
    ruta_id: rutaId,
    orden,
    zona: item.zona,
    nombre: item.nombre,
    unidad: item.unidad,
    tipo_servicio: item.tipo_servicio,
    frecuencia: item.frecuencia,
    barrio: item.barrio,
    direccion: item.direccion,
    depto: item.depto,
    telefono: item.telefono,
    telefono_normalizado: item.telefono_normalizado,
    observaciones: item.observaciones,
    dia: item.dia,
    hora: item.hora,
    nota_encargado: item.nota_encargado,
    precio: item.precio,
    deuda: item.deuda,
    sheet_fila: item.fila,
    sheet_estado: "Enviada",
    estado_operativo: "pendiente" as const,
  };
}

async function findRutaParaImport(
  admin: SupabaseClient<Database>,
  params: {
    externalKey: string;
    fecha: string;
    turno: RutaTurno;
    recolectorId: string;
  },
): Promise<{ ruta: RutaMatch | null; finalizada: boolean }> {
  const { data: byKey } = await admin
    .from("rutas")
    .select("id, estado, external_key")
    .eq("external_key", params.externalKey)
    .maybeSingle();

  if (byKey) {
    return { ruta: byKey, finalizada: !puedeAgregarRecoleccion(byKey.estado) };
  }

  const { data: operativas } = await admin
    .from("rutas")
    .select("id, estado, external_key")
    .eq("fecha", params.fecha)
    .eq("turno", params.turno)
    .eq("asignado_a", params.recolectorId)
    .in("estado", ESTADOS_OPERATIVOS)
    .order("created_at", { ascending: false })
    .limit(1);

  if (operativas?.[0]) {
    return { ruta: operativas[0], finalizada: false };
  }

  const { data: finalizadas } = await admin
    .from("rutas")
    .select("id, estado, external_key")
    .eq("fecha", params.fecha)
    .eq("turno", params.turno)
    .eq("asignado_a", params.recolectorId)
    .in("estado", ["completada", "cerrada"])
    .limit(1);

  if (finalizadas?.[0]) {
    return { ruta: finalizadas[0], finalizada: true };
  }

  return { ruta: null, finalizada: false };
}

export async function importRecoleccionesFromSheets(
  admin: SupabaseClient<Database>,
  payload: ImportRecoleccionPayload,
): Promise<ImportRecoleccionResult | ImportRecoleccionError> {
  if (payload.recolecciones.length === 0) {
    return { ok: false, error: "No hay recolecciones válidas para importar" };
  }

  const warnings: string[] = [];
  const omitidas: ImportFilaOmitida[] = [];
  const groups = new Map<string, RutaGroup>();

  for (const item of payload.recolecciones) {
    const key = `${item.dia}:${item.turno}:${item.recolector_email}`;
    if (!groups.has(key)) {
      const recolector = await admin
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", item.recolector_email)
        .eq("role", "recolector")
        .maybeSingle();

      if (!recolector.data) {
        return {
          ok: false,
          error: `Recolector no encontrado: ${item.recolector_email}`,
        };
      }

      groups.set(key, {
        fecha: item.dia,
        turno: item.turno,
        recolector_email: item.recolector_email,
        recolector_id: recolector.data.id,
        recolector_label: recolector.data.full_name || recolector.data.email,
        items: [],
      });
    }
    groups.get(key)!.items.push(item);
  }

  let rutasCreadas = 0;
  let rutasActualizadas = 0;
  let rutasOmitidas = 0;
  let totalRecolecciones = 0;
  const now = new Date().toISOString();

  const omitir = (fila: number, motivo: string) => {
    omitidas.push({ fila, motivo });
  };

  for (const group of groups.values()) {
    const externalKey = buildRutaExternalKey(
      payload.spreadsheet_id,
      group.fecha,
      group.turno,
      group.recolector_email,
    );
    const nombre = buildRutaNombre(group.fecha, group.turno, group.recolector_label);

    const found = await findRutaParaImport(admin, {
      externalKey,
      fecha: group.fecha,
      turno: group.turno,
      recolectorId: group.recolector_id,
    });

    if (found.finalizada) {
      rutasOmitidas += 1;
      const motivo = `La ruta «${nombre}» ya está finalizada. Reactivala para agregar paradas.`;
      warnings.push(motivo);
      for (const item of group.items) {
        omitir(item.fila, motivo);
      }
      continue;
    }

    let rutaId: string;
    let nextOrden = 1;
    const phones = new Set<string>();

    if (found.ruta) {
      rutaId = found.ruta.id;

      const { data: existentes, error: existentesError } = await admin
        .from("ruta_recolecciones")
        .select("telefono_normalizado, orden")
        .eq("ruta_id", rutaId);

      if (existentesError) return { ok: false, error: existentesError.message };

      for (const rec of existentes ?? []) {
        phones.add(rec.telefono_normalizado);
        if (rec.orden >= nextOrden) nextOrden = rec.orden + 1;
      }

      const linkage: Database["public"]["Tables"]["rutas"]["Update"] = {
        spreadsheet_id: payload.spreadsheet_id,
        spreadsheet_url: payload.spreadsheet_url ?? null,
        sheet_name: payload.sheet_name ?? null,
        imported_at: now,
      };
      if (!found.ruta.external_key) {
        linkage.external_key = externalKey;
      }

      const { error: linkError } = await admin.from("rutas").update(linkage).eq("id", rutaId);
      if (linkError) return { ok: false, error: linkError.message };
    } else {
      const { data: inserted, error } = await admin
        .from("rutas")
        .insert({
          nombre,
          fecha: group.fecha,
          turno: group.turno,
          estado: "activa",
          asignado_a: group.recolector_id,
          spreadsheet_id: payload.spreadsheet_id,
          spreadsheet_url: payload.spreadsheet_url ?? null,
          sheet_name: payload.sheet_name ?? null,
          external_key: externalKey,
          imported_at: now,
          metadata: {
            source: "google_sheets",
            recolecciones_count: group.items.length,
          },
        })
        .select("id")
        .single();

      if (error || !inserted) {
        return { ok: false, error: error?.message ?? "No se pudo crear la ruta" };
      }
      rutasCreadas += 1;
      rutaId = inserted.id;
    }

    const rows = [];
    for (const item of group.items) {
      if (phones.has(item.telefono_normalizado)) {
        omitir(
          item.fila,
          `Ya existe una recolección con el teléfono ${item.telefono} en «${nombre}».`,
        );
        continue;
      }
      phones.add(item.telefono_normalizado);
      rows.push(toRecoleccionRow(rutaId, item, nextOrden));
      nextOrden += 1;
    }

    if (rows.length === 0) {
      if (found.ruta) {
        rutasOmitidas += 1;
        warnings.push(`No se agregaron paradas a «${nombre}»: teléfonos ya existentes.`);
      }
      continue;
    }

    const { error: insertError } = await admin.from("ruta_recolecciones").insert(rows);
    if (insertError) {
      return { ok: false, error: insertError.message };
    }

    if (found.ruta) {
      rutasActualizadas += 1;
    }
    totalRecolecciones += rows.length;
  }

  const partes = [
    `Importadas ${totalRecolecciones} recolecciones en ${rutasCreadas + rutasActualizadas} ruta(s).`,
  ];
  if (omitidas.length > 0) {
    partes.push(`Se omitieron ${omitidas.length} fila(s) (ruta finalizada o teléfono repetido).`);
  }

  return {
    ok: true,
    rutas_creadas: rutasCreadas,
    rutas_actualizadas: rutasActualizadas,
    rutas_omitidas: rutasOmitidas,
    filas_omitidas: omitidas.map((o) => o.fila),
    omitidas,
    recolecciones_count: totalRecolecciones,
    warnings,
    message: partes.join(" "),
  };
}

export async function fetchRecolectoresEmails(
  admin: SupabaseClient<Database>,
): Promise<{ email: string; nombre: string }[]> {
  const { data } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("role", "recolector")
    .order("full_name", { ascending: true });

  return (data ?? []).map((r) => ({
    email: r.email,
    nombre: r.full_name || r.email,
  }));
}
