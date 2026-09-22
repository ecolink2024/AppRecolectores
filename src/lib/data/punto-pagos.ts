import { toPuntoPago, type PuntoPago } from "@/lib/domain/punto-pagos";
import { createAdminClient } from "@/lib/supabase/admin";

export async function fetchPuntoPagos(fechas: { desde: string; hasta: string }): Promise<{
  items: PuntoPago[];
  error: string | null;
}> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Cliente admin no disponible",
    };
  }

  const { data, error } = await admin
    .from("punto_pagos")
    .select(
      "id, fecha, nombre, celular, telefono_normalizado, servicio, cantidad, monto, recoleccion_id, created_at",
    )
    .gte("fecha", fechas.desde)
    .lte("fecha", fechas.hasta)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { items: [], error: error.message };
  }

  const items = (data ?? [])
    .map((row) => toPuntoPago(row))
    .filter((row): row is PuntoPago => row != null);

  return { items, error: null };
}
