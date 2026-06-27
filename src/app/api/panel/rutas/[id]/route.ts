import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth/session";
import { parseRutaUpdate } from "@/lib/domain/operario-crud";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
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

  const parsed = parseRutaUpdate(body);
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

  if (parsed.data.asignado_a) {
    const { data: recolector } = await admin
      .from("profiles")
      .select("id")
      .eq("id", parsed.data.asignado_a)
      .eq("role", "recolector")
      .maybeSingle();

    if (!recolector) {
      return NextResponse.json({ ok: false, error: "Recolector inválido" }, { status: 400 });
    }
  }

  const { error } = await admin
    .from("rutas")
    .update({
      nombre: parsed.data.nombre,
      fecha: parsed.data.fecha,
      turno: parsed.data.turno,
      estado: parsed.data.estado,
      asignado_a: parsed.data.asignado_a,
      observaciones_operario: parsed.data.observaciones_operario,
      km_recorridos: parsed.data.km_recorridos,
    })
    .eq("id", rutaId);

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

  const { id: rutaId } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const { error } = await admin.from("rutas").delete().eq("id", rutaId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  revalidatePath("/panel");
  revalidatePath("/panel/historial");
  revalidatePath("/panel/kpis");

  return NextResponse.json({ ok: true });
}
