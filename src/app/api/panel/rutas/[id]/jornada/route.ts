import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth/session";
import { calcTotalEfectivo } from "@/lib/domain/recolector-cierre-ruta";
import { parseInicioRutaBody } from "@/lib/domain/ruta-insumos";
import { puedeEditarCargaStaff } from "@/lib/domain/ruta-estado-transiciones";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type RutaUpdate = Database["public"]["Tables"]["rutas"]["Update"];

type Props = { params: Promise<{ id: string }> };

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Edición por parte del staff de los datos de la jornada del recolector
 * (km iniciales, insumos declarados, km finales, descarga y gastos), disponible
 * solo en rutas Realizadas antes del cierre operario.
 */
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

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const { data: ruta, error: rutaError } = await admin
    .from("rutas")
    .select("id, estado, descuento")
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
        error: "Solo se pueden editar los datos de una ruta Realizada, antes del cierre operario",
      },
      { status: 409 },
    );
  }

  // km inicial + insumos (mismas reglas que el inicio del recolector).
  const inicio = parseInicioRutaBody({ km_inicial: body.km_inicial, insumos: body.insumos });
  if (!inicio.ok) {
    return NextResponse.json({ ok: false, error: inicio.error }, { status: 400 });
  }

  const kmFinal = asNumber(body.km_final);
  if (kmFinal === null || kmFinal < 0) {
    return NextResponse.json({ ok: false, error: "Kilómetros finales inválidos" }, { status: 400 });
  }
  if (kmFinal < inicio.data.km_inicial) {
    return NextResponse.json(
      { ok: false, error: "Los kilómetros finales no pueden ser menores a los iniciales" },
      { status: 400 },
    );
  }

  const descarga = Boolean(body.descarga);
  const combustible = asNumber(body.combustible) ?? 0;
  const otrosGastos = asNumber(body.otros_gastos) ?? 0;
  if (combustible < 0 || otrosGastos < 0) {
    return NextResponse.json({ ok: false, error: "Los gastos no pueden ser negativos" }, { status: 400 });
  }

  const descuento = typeof ruta.descuento === "number" ? ruta.descuento : Number(ruta.descuento ?? 0) || 0;

  // Efectivo recaudado en campo (paradas visitadas) para recomputar el total.
  const { data: recs, error: recsError } = await admin
    .from("ruta_recolecciones")
    .select("estado_operativo, monto_efectivo")
    .eq("ruta_id", rutaId);

  if (recsError) {
    return NextResponse.json({ ok: false, error: recsError.message }, { status: 500 });
  }

  const efectivoRecaudado = (recs ?? []).reduce((acc, r) => {
    if (r.estado_operativo !== "visitada") return acc;
    const n = typeof r.monto_efectivo === "number" ? r.monto_efectivo : Number(r.monto_efectivo ?? 0);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);

  const gastos = combustible + descuento + otrosGastos;
  if (efectivoRecaudado <= 0 && gastos > 0) {
    return NextResponse.json(
      { ok: false, error: "No podés cargar gastos si la ruta no recaudó efectivo" },
      { status: 400 },
    );
  }
  if (efectivoRecaudado > 0 && gastos > efectivoRecaudado) {
    return NextResponse.json(
      { ok: false, error: "Los gastos no pueden superar el efectivo recaudado" },
      { status: 400 },
    );
  }

  const totalEfectivo = calcTotalEfectivo(efectivoRecaudado, combustible, descuento, otrosGastos);
  if (totalEfectivo < 0) {
    return NextResponse.json({ ok: false, error: "El total efectivo no puede ser negativo" }, { status: 400 });
  }

  const updateRow: RutaUpdate = {
    km_inicial: inicio.data.km_inicial,
    insumos_inicio: inicio.data.insumos as unknown as Json,
    km_final: kmFinal,
    descarga,
    combustible,
    otros_gastos: otrosGastos,
    total_efectivo: totalEfectivo,
  };

  const { error: updateError } = await admin.from("rutas").update(updateRow).eq("id", rutaId);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  revalidatePath("/panel");
  revalidatePath("/panel/historial");
  revalidatePath("/panel/kpis");

  return NextResponse.json({ ok: true });
}
