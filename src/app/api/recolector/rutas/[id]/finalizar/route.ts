import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/session";
import { parseRecolectorCierreRutaBody } from "@/lib/domain/recolector-cierre-ruta";
import { validarFinalizarRutaEnServidor } from "@/lib/domain/recolector-finalizar-ruta";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type RutaUpdate = Database["public"]["Tables"]["rutas"]["Update"];

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  if (auth.profile.role !== "recolector") {
    return NextResponse.json({ ok: false, error: "Solo recolectores" }, { status: 403 });
  }

  const { id: rutaId } = await params;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const { data: ruta, error: fetchError } = await admin
    .from("rutas")
    .select("id, asignado_a, estado, km_inicial")
    .eq("id", rutaId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  if (!ruta || ruta.asignado_a !== auth.user.id) {
    return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
  }

  if (ruta.estado === "completada" || ruta.estado === "cerrada") {
    return NextResponse.json({ ok: false, error: "La ruta ya fue finalizada" }, { status: 409 });
  }

  if (ruta.estado !== "en_curso") {
    return NextResponse.json(
      { ok: false, error: "La ruta debe estar en curso para finalizarla" },
      { status: 400 },
    );
  }

  const { data: recolecciones, error: recError } = await admin
    .from("ruta_recolecciones")
    .select("estado_operativo")
    .eq("ruta_id", rutaId);

  if (recError) {
    return NextResponse.json({ ok: false, error: recError.message }, { status: 500 });
  }

  const parsed = validarFinalizarRutaEnServidor(recolecciones ?? []);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: recoleccionesMontos } = await admin
    .from("ruta_recolecciones")
    .select("monto_efectivo")
    .eq("ruta_id", rutaId);

  const montoEfectivo = (recoleccionesMontos ?? []).reduce((acc, item) => {
    const n = item.monto_efectivo != null ? Number(item.monto_efectivo) : 0;
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);

  const cierreParsed = parseRecolectorCierreRutaBody(body, {
    kmInicial: ruta.km_inicial != null ? Number(ruta.km_inicial) : null,
    efectivoRecaudado: montoEfectivo,
  });
  if (!cierreParsed.ok) {
    return NextResponse.json({ ok: false, error: cierreParsed.error }, { status: 400 });
  }

  const updatePayload: RutaUpdate = {
    estado: "completada",
    cierre_recolector_at: now,
    monto_efectivo: montoEfectivo > 0 ? montoEfectivo : null,
    km_final: cierreParsed.data.km_final,
    descarga: cierreParsed.data.descarga,
    combustible: cierreParsed.data.combustible,
    descuento: cierreParsed.data.descuento,
    otros_gastos: cierreParsed.data.otros_gastos,
    total_efectivo: cierreParsed.data.total_efectivo,
    observaciones_recolector: cierreParsed.data.observaciones_recolector,
  };

  const { error: updateError } = await admin.from("rutas").update(updatePayload).eq("id", rutaId);

  if (updateError) {
    if (updateError.message.includes("cierre_recolector_at")) {
      const { error: fallbackError } = await admin
        .from("rutas")
        .update({ estado: "completada", monto_efectivo: updatePayload.monto_efectivo })
        .eq("id", rutaId);

      if (fallbackError) {
        return NextResponse.json({ ok: false, error: fallbackError.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    estado: "completada",
    cierre_recolector_at: now,
    monto_efectivo: montoEfectivo,
    cierre: cierreParsed.data,
  });
}
