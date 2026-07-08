import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth/session";
import {
  fetchPrecioBolsaExtraActivo,
  fetchPrecioBolsaLlenaPuntoActivo,
  fetchPrecioBolsaPuntoActivo,
  fetchPrecioRetiroReciclableMixtoActivo,
} from "@/lib/data/sistema-parametros";
import {
  parsePrecioRetiro,
  parseRecoleccionCampoBody,
} from "@/lib/domain/recolector-recoleccion-campo";
import { puedeEditarCargaStaff } from "@/lib/domain/ruta-estado-transiciones";
import { uploadFirmaRecoleccionPng } from "@/lib/storage/firmas-recoleccion";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type RecoleccionUpdate = Database["public"]["Tables"]["ruta_recolecciones"]["Update"];

type Props = { params: Promise<{ id: string; recoleccionId: string }> };

/**
 * Edición por parte del staff de la carga de campo que llenó el recolector
 * (retiro, cobro, cancelación, firma y observaciones), disponible solo en
 * rutas Realizadas antes del cierre operario.
 */
export async function PATCH(request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { id: rutaId, recoleccionId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const { data: ruta, error: rutaError } = await admin
    .from("rutas")
    .select("id, estado")
    .eq("id", rutaId)
    .maybeSingle();

  if (rutaError) {
    return NextResponse.json({ ok: false, error: rutaError.message }, { status: 500 });
  }

  if (!ruta) {
    return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
  }

  if (!puedeEditarCargaStaff(ruta.estado)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Solo se puede editar la carga de una ruta Realizada, antes del cierre operario",
      },
      { status: 409 },
    );
  }

  const { data: recoleccion, error: fetchError } = await admin
    .from("ruta_recolecciones")
    .select("*")
    .eq("id", recoleccionId)
    .eq("ruta_id", rutaId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  if (!recoleccion) {
    return NextResponse.json({ ok: false, error: "Recolección no encontrada" }, { status: 404 });
  }

  const precioRetiro = parsePrecioRetiro(recoleccion.precio);
  const [precioBolsaExtra, precioRetiroReciclableMixto, precioBolsaPunto, precioBolsaLlenaPunto] =
    await Promise.all([
      fetchPrecioBolsaExtraActivo(),
      fetchPrecioRetiroReciclableMixtoActivo(),
      fetchPrecioBolsaPuntoActivo(),
      fetchPrecioBolsaLlenaPuntoActivo(),
    ]);

  // La firma se conserva salvo que el staff dibuje una nueva.
  const firmaPngRaw = typeof body.firma_png === "string" ? body.firma_png.trim() : "";
  let firmaDigital = recoleccion.firma_digital ?? "";

  if (firmaPngRaw.startsWith("data:")) {
    const uploaded = await uploadFirmaRecoleccionPng(admin, rutaId, recoleccionId, firmaPngRaw);
    if (!uploaded.ok) {
      return NextResponse.json({ ok: false, error: uploaded.error }, { status: 400 });
    }
    firmaDigital = uploaded.storageRef;
  }

  if (!firmaDigital) {
    return NextResponse.json(
      { ok: false, error: "Falta la firma del cliente. Dibujá una firma para guardar." },
      { status: 400 },
    );
  }

  const parsed = parseRecoleccionCampoBody(
    { ...body, firma_digital: firmaDigital },
    {
      unidad: recoleccion.unidad,
      tipoServicio: recoleccion.tipo_servicio,
      precioRetiro,
      precioBolsaExtra,
      precioRetiroReciclableMixto,
      precioBolsaPunto,
      precioBolsaLlenaPunto,
    },
  );
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updateRow: RecoleccionUpdate = {
    hora_real: recoleccion.hora_real ?? now,
    nombre_firmante: parsed.data.nombre_firmante,
    firma_digital: parsed.data.firma_digital,
    observaciones_recolector: parsed.data.observaciones_recolector,
    precio_total: parsed.data.precio_total,
    estado_operativo: parsed.data.cancelada ? "cancelada" : "visitada",
    motivo_cancelacion: parsed.data.motivo_cancelacion,
    detalle: parsed.data.motivo_cancelacion,
  };

  if (parsed.data.cancelada) {
    updateRow.monto_efectivo = null;
    updateRow.monto_transferencia = null;
    updateRow.monto_qr = null;
    updateRow.bolsas_llenas = null;
    updateRow.bolsas_llenas_punto = null;
    updateRow.bolsas_nuevas_vendidas = null;
    updateRow.biotachos_llenos = null;
    updateRow.bolsas_nuevas = null;
    updateRow.biotachos_nuevos = null;
    updateRow.cestos = null;
  } else {
    updateRow.bolsas_llenas = parsed.data.bolsas_llenas;
    updateRow.bolsas_llenas_punto = parsed.data.bolsas_llenas_punto;
    updateRow.bolsas_nuevas_vendidas = parsed.data.bolsas_nuevas_vendidas;
    updateRow.biotachos_llenos = parsed.data.biotachos_llenos;
    updateRow.bolsas_nuevas = parsed.data.bolsas_nuevas;
    updateRow.biotachos_nuevos = parsed.data.biotachos_nuevos;
    updateRow.cestos = parsed.data.cestos;
    updateRow.monto_efectivo = parsed.data.monto_efectivo;
    updateRow.monto_transferencia = parsed.data.monto_transferencia;
    updateRow.monto_qr = parsed.data.monto_qr;
    updateRow.motivo_cancelacion = null;
    updateRow.detalle = null;
  }

  const { error: updateError } = await admin
    .from("ruta_recolecciones")
    .update(updateRow)
    .eq("id", recoleccionId)
    .eq("ruta_id", rutaId);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  revalidatePath("/panel");
  revalidatePath("/panel/historial");
  revalidatePath("/panel/kpis");

  return NextResponse.json({ ok: true, estado_operativo: updateRow.estado_operativo });
}
