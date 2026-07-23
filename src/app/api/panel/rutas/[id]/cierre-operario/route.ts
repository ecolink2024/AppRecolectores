import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth/session";
import { puedeCierreOperario } from "@/lib/domain/ruta-estado-transiciones";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type RutaUpdate = Database["public"]["Tables"]["rutas"]["Update"];

type Props = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Props) {
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
    .select("id, estado")
    .eq("id", rutaId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  if (!ruta) {
    return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
  }

  if (!puedeCierreOperario(ruta.estado)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Solo se puede cerrar operariamente una ruta en estado Realizado (finalizada por el recolector)",
      },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const updatePayload: RutaUpdate = {
    estado: "cerrada",
    cierre_operario_at: now,
    cierre_operario_por: auth.user.id,
  };

  const { error: updateError } = await admin.from("rutas").update(updatePayload).eq("id", rutaId);

  if (updateError) {
    const message = updateError.message.includes("cerrada")
      ? "Falta el estado 'cerrada' en Supabase. Ejecutá la migración 20260601120000 o 20260602120000."
      : updateError.message;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  revalidatePath("/panel");
  revalidatePath("/panel/historial");
  revalidatePath("/panel/kpis");

  return NextResponse.json({ ok: true, estado: "cerrada", cierre_operario_at: now });
}
