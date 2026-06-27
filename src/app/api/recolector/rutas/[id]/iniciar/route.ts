import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/session";
import { insumosOperarioCompletados, parseInicioRutaBody } from "@/lib/domain/ruta-insumos";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseInicioRutaBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
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
    .select("id, asignado_a, estado, metadata, insumos_operario, inicio_jornada_at")
    .eq("id", rutaId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  if (!ruta || ruta.asignado_a !== auth.user.id) {
    return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
  }

  if (ruta.estado === "en_curso") {
    return NextResponse.json(
      { ok: false, error: "La ruta ya fue iniciada" },
      { status: 409 },
    );
  }

  if (ruta.estado === "completada" || ruta.estado === "cerrada" || ruta.estado === "cancelada") {
    return NextResponse.json(
      { ok: false, error: "No se puede iniciar una ruta finalizada o cancelada" },
      { status: 400 },
    );
  }

  if (!insumosOperarioCompletados(ruta.insumos_operario)) {
    return NextResponse.json(
      {
        ok: false,
        error: "El operario debe completar la preparación de insumos antes de iniciar la ruta",
      },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();
  const existingMetadata =
    ruta.metadata && typeof ruta.metadata === "object" && !Array.isArray(ruta.metadata)
      ? (ruta.metadata as Record<string, unknown>)
      : {};

  const updatePayload: RutaUpdate = {
    estado: "en_curso",
    km_inicial: parsed.data.km_inicial,
    insumos_inicio: parsed.data.insumos as Json,
    inicio_jornada_at: now,
    metadata: { ...existingMetadata, inicio_jornada_at: now } as Json,
  };

  const { error: updateError } = await admin
    .from("rutas")
    .update(updatePayload)
    .eq("id", rutaId);

  if (updateError) {
    const message = updateError.message.includes("schema cache")
      ? "Faltan columnas en Supabase. Ejecutá el SQL de supabase/migrations/20260524140000_fix_missing_operativo_columns.sql en el SQL Editor."
      : updateError.message.includes("does not exist")
        ? "Faltan columnas en la base de datos. Ejecutá las migraciones pendientes en Supabase (ver scripts/apply-pending-migrations.mjs)."
        : updateError.message;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    inicio_jornada_at: now,
    km_inicial: parsed.data.km_inicial,
    insumos: parsed.data.insumos,
  });
}
