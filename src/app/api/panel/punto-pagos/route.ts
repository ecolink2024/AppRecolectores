import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth/session";
import { parsePuntoPagoBody, toPuntoPago } from "@/lib/domain/punto-pagos";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parsePuntoPagoBody(body);
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

  const { data, error } = await admin
    .from("punto_pagos")
    .insert({
      fecha: parsed.data.fecha,
      nombre: parsed.data.nombre,
      celular: parsed.data.celular,
      telefono_normalizado: parsed.data.telefono_normalizado,
      servicio: parsed.data.servicio,
      cantidad: parsed.data.cantidad,
      monto: parsed.data.monto,
      created_by: auth.profile.id,
    })
    .select(
      "id, fecha, nombre, celular, telefono_normalizado, servicio, cantidad, monto, recoleccion_id, created_at",
    )
    .single();

  if (error) {
    const missingTable =
      error.message.includes("punto_pagos") || error.code === "42P01" || error.code === "PGRST205";
    return NextResponse.json(
      {
        ok: false,
        error: missingTable
          ? "Falta la tabla de pagos de punto. Ejecutá en Supabase SQL Editor el archivo supabase/apply-pending-operativo.sql (incluye 20260922120000_punto_pagos.sql)."
          : error.message,
      },
      { status: 500 },
    );
  }

  const item = data ? toPuntoPago(data) : null;
  if (!item) {
    return NextResponse.json({ ok: false, error: "No se pudo guardar el pago" }, { status: 500 });
  }

  revalidatePath("/panel/historial/puntos");
  return NextResponse.json({ ok: true, item });
}
