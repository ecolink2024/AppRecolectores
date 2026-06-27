import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth/session";
import {
  estadoTrasReactivar,
  limpiezaTrasReactivar,
  puedeReactivarRuta,
} from "@/lib/domain/ruta-estado-transiciones";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type RutaUpdate = Database["public"]["Tables"]["rutas"]["Update"];

type Props = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { id: rutaId } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const { data: ruta, error: fetchError } = await admin
    .from("rutas")
    .select("id, estado, inicio_jornada_at, metadata")
    .eq("id", rutaId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  if (!ruta) {
    return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
  }

  if (!puedeReactivarRuta(ruta.estado)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Solo se pueden reactivar rutas realizadas sin cierre operario",
      },
      { status: 400 },
    );
  }

  const nuevoEstado = estadoTrasReactivar();
  const updatePayload: RutaUpdate = {
    estado: nuevoEstado,
    ...limpiezaTrasReactivar(ruta.estado),
  };

  const { error: updateError } = await admin.from("rutas").update(updatePayload).eq("id", rutaId);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, estado: nuevoEstado });
}
