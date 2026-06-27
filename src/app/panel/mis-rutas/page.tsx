import { MisRutasCards } from "@/components/panel/recolector/mis-rutas-cards";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MisRutasPage() {
  const auth = await requireAuth();
  if (!auth.ok) {
    redirect("/login?next=/panel/mis-rutas");
  }

  if (auth.profile.role !== "recolector") {
    redirect("/panel");
  }

  const supabase = await createClient();
  const { data: rutas, error } = await supabase
    .from("rutas")
    .select("*")
    .eq("asignado_a", auth.user.id)
    .order("fecha", { ascending: false })
    .order("turno", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Mis rutas
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Activas y completadas.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          No se pudieron cargar las rutas: {error.message}
        </p>
      )}

      <MisRutasCards rutas={rutas ?? []} groupByCategoria />
    </div>
  );
}
