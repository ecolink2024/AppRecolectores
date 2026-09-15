import { NextResponse } from "next/server";

import { compactRecoleccionOrden } from "@/lib/data/ruta-recolecciones-orden";
import { requireStaff } from "@/lib/auth/session";
import { parseRecoleccionUpdate } from "@/lib/domain/operario-crud";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type RecoleccionUpdate = Database["public"]["Tables"]["ruta_recolecciones"]["Update"];

type Props = { params: Promise<{ id: string; recoleccionId: string }> };

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

  const { data: existing, error: fetchError } = await admin
    .from("ruta_recolecciones")
    .select("id, ruta_id, direccion, telefono_normalizado")
    .eq("id", recoleccionId)
    .eq("ruta_id", rutaId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Recolección no encontrada" }, { status: 404 });
  }

  const parsed = parseRecoleccionUpdate(body, existing.direccion);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  if (parsed.data.telefono_normalizado !== existing.telefono_normalizado) {
    const { data: duplicate } = await admin
      .from("ruta_recolecciones")
      .select("id")
      .eq("ruta_id", rutaId)
      .eq("telefono_normalizado", parsed.data.telefono_normalizado)
      .neq("id", recoleccionId)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { ok: false, error: "Ya existe otra recolección con ese teléfono en la ruta" },
        { status: 409 },
      );
    }
  }

  const updateRow: RecoleccionUpdate = {
    nombre: parsed.data.nombre,
    direccion: parsed.data.direccion,
    telefono: parsed.data.telefono,
    telefono_normalizado: parsed.data.telefono_normalizado,
    unidad: parsed.data.unidad,
    tipo_servicio: parsed.data.tipo_servicio,
    categoria_parada: parsed.data.categoria_parada,
    frecuencia: parsed.data.frecuencia,
    precio: parsed.data.precio,
    deuda: parsed.data.deuda,
    zona: parsed.data.zona,
    barrio: parsed.data.barrio,
    depto: parsed.data.depto,
    hora: parsed.data.hora,
    estado_operativo: parsed.data.estado_operativo,
    observaciones: parsed.data.observaciones,
  };

  if (parsed.data.clearGeocoding) {
    updateRow.latitud = null;
    updateRow.longitud = null;
    updateRow.coordenadas_dms = null;
    updateRow.direccion_google = null;
  }

  const { error } = await admin
    .from("ruta_recolecciones")
    .update(updateRow)
    .eq("id", recoleccionId)
    .eq("ruta_id", rutaId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { id: rutaId, recoleccionId } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const { error: deleteError } = await admin
    .from("ruta_recolecciones")
    .delete()
    .eq("id", recoleccionId)
    .eq("ruta_id", rutaId);

  if (deleteError) {
    return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
  }

  const compact = await compactRecoleccionOrden(admin, rutaId);
  if (!compact.ok) {
    return NextResponse.json({ ok: false, error: compact.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
