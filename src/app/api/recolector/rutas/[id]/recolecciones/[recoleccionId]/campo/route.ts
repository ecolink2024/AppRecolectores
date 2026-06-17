import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/session";
import {
  fetchPrecioBolsaExtraActivo,
  fetchPrecioBolsaLlenaPuntoActivo,
  fetchPrecioBolsaPuntoActivo,
  fetchPrecioRetiroReciclableMixtoActivo,
} from "@/lib/data/sistema-parametros";
import {
  parsePrecioRetiro,
  parseRecoleccionCampoBody,
  recoleccionCerradaParaRecolector,
} from "@/lib/domain/recolector-recoleccion-campo";
import { getInicioJornadaAt } from "@/lib/domain/recolector-ruta";
import { uploadFirmaRecoleccionPng } from "@/lib/storage/firmas-recoleccion";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type RecoleccionUpdate = Database["public"]["Tables"]["ruta_recolecciones"]["Update"];

type Props = { params: Promise<{ id: string; recoleccionId: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  if (auth.profile.role !== "recolector") {
    return NextResponse.json({ ok: false, error: "Solo recolectores" }, { status: 403 });
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
    .select("id, asignado_a, estado, inicio_jornada_at, metadata")
    .eq("id", rutaId)
    .maybeSingle();

  if (rutaError) {
    return NextResponse.json({ ok: false, error: rutaError.message }, { status: 500 });
  }

  if (!ruta || ruta.asignado_a !== auth.user.id) {
    return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
  }

  if (ruta.estado === "suspendida") {
    return NextResponse.json(
      { ok: false, error: "Esta ruta está suspendida" },
      { status: 403 },
    );
  }

  if (ruta.estado === "completada" || ruta.estado === "cerrada" || ruta.estado === "cancelada") {
    return NextResponse.json(
      { ok: false, error: "No se puede cargar una ruta finalizada o cancelada" },
      { status: 400 },
    );
  }

  const inicioJornadaAt = getInicioJornadaAt(ruta);
  const rutaIniciada = ruta.estado === "en_curso" || inicioJornadaAt != null;

  if (!rutaIniciada) {
    return NextResponse.json(
      { ok: false, error: "La ruta debe estar iniciada para cargar recolecciones" },
      { status: 400 },
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

  if (recoleccionCerradaParaRecolector(recoleccion.estado_operativo)) {
    return NextResponse.json(
      { ok: false, error: "Esta recolección ya fue guardada y no se puede modificar" },
      { status: 400 },
    );
  }

  const precioRetiro = parsePrecioRetiro(recoleccion.precio);
  const [precioBolsaExtra, precioRetiroReciclableMixto, precioBolsaPunto, precioBolsaLlenaPunto] =
    await Promise.all([
      fetchPrecioBolsaExtraActivo(),
      fetchPrecioRetiroReciclableMixtoActivo(),
      fetchPrecioBolsaPuntoActivo(),
      fetchPrecioBolsaLlenaPuntoActivo(),
    ]);

  const firmaPng = typeof body.firma_png === "string" ? body.firma_png.trim() : "";
  if (!firmaPng) {
    return NextResponse.json(
      { ok: false, error: "Debés capturar la firma del cliente en el recuadro" },
      { status: 400 },
    );
  }

  const uploaded = await uploadFirmaRecoleccionPng(admin, rutaId, recoleccionId, firmaPng);
  if (!uploaded.ok) {
    return NextResponse.json({ ok: false, error: uploaded.error }, { status: 400 });
  }

  const parsed = parseRecoleccionCampoBody(
    { ...body, firma_digital: uploaded.storageRef },
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
    hora_real: now,
    nombre_firmante: parsed.data.nombre_firmante,
    firma_digital: parsed.data.firma_digital,
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
  } else {
    updateRow.bolsas_llenas = parsed.data.bolsas_llenas;
    updateRow.bolsas_llenas_punto = parsed.data.bolsas_llenas_punto;
    updateRow.bolsas_nuevas_vendidas = parsed.data.bolsas_nuevas_vendidas;
    updateRow.biotachos_llenos = parsed.data.biotachos_llenos;
    updateRow.bolsas_nuevas = parsed.data.bolsas_nuevas;
    updateRow.biotachos_nuevos = parsed.data.biotachos_nuevos;
    updateRow.monto_efectivo = parsed.data.monto_efectivo;
    updateRow.monto_transferencia = parsed.data.monto_transferencia;
    updateRow.monto_qr = parsed.data.monto_qr;
    updateRow.motivo_cancelacion = null;
  }

  const { error: updateError } = await admin
    .from("ruta_recolecciones")
    .update(updateRow)
    .eq("id", recoleccionId)
    .eq("ruta_id", rutaId);

  if (updateError) {
    const message = updateError.message.includes("schema cache") ||
      updateError.message.includes("does not exist")
      ? "Faltan columnas en Supabase. Ejecutá: node scripts/apply-pending-migrations.mjs (con SUPABASE_DB_URL) o pegá el SQL que imprime en Supabase → SQL Editor. Incluye migraciones hasta 20260603120000_recoleccion_empresa_punto_campos.sql."
      : updateError.message;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, estado_operativo: updateRow.estado_operativo });
}
