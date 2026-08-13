import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth/session";
import { parseRecoleccionFields } from "@/lib/domain/operario-crud";
import { puedeAgregarRecoleccion } from "@/lib/domain/ruta-estado-transiciones";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { id: rutaId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseRecoleccionFields(body);
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

  const { data: ruta, error: rutaError } = await admin
    .from("rutas")
    .select("id, fecha, estado")
    .eq("id", rutaId)
    .maybeSingle();

  if (rutaError) {
    return NextResponse.json({ ok: false, error: rutaError.message }, { status: 500 });
  }

  if (!ruta) {
    return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
  }

  if (!puedeAgregarRecoleccion(ruta.estado)) {
    return NextResponse.json(
      { ok: false, error: "No se puede agregar una recolección a una ruta finalizada" },
      { status: 409 },
    );
  }

  const { data: duplicate } = await admin
    .from("ruta_recolecciones")
    .select("id")
    .eq("ruta_id", rutaId)
    .eq("telefono_normalizado", parsed.data.telefono_normalizado)
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { ok: false, error: "Ya existe una recolección con ese teléfono en esta ruta" },
      { status: 409 },
    );
  }

  const { data: lastItem } = await admin
    .from("ruta_recolecciones")
    .select("orden")
    .eq("ruta_id", rutaId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orden = (lastItem?.orden ?? 0) + 1;

  const { data: inserted, error: insertError } = await admin
    .from("ruta_recolecciones")
    .insert({
      ruta_id: rutaId,
      orden,
      nombre: parsed.data.nombre,
      direccion: parsed.data.direccion,
      telefono: parsed.data.telefono,
      telefono_normalizado: parsed.data.telefono_normalizado,
      unidad: parsed.data.unidad,
      tipo_servicio: parsed.data.tipo_servicio,
      frecuencia: parsed.data.frecuencia,
      precio: parsed.data.precio,
      deuda: parsed.data.deuda,
      zona: parsed.data.zona,
      barrio: parsed.data.barrio,
      depto: parsed.data.depto,
      hora: parsed.data.hora,
      dia: ruta.fecha,
      estado_operativo: parsed.data.estado_operativo,
      observaciones: parsed.data.observaciones,
      sheet_estado: "Manual",
    })
    .select("id, orden")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { ok: false, error: insertError?.message ?? "No se pudo crear la recolección" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: inserted.id, orden: inserted.orden });
}
