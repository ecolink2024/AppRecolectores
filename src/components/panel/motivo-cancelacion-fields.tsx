"use client";

import {
  MOTIVOS_CANCELACION,
  esMotivoCancelacionValido,
} from "@/lib/domain/recolector-recoleccion-campo";

type Props = {
  cancelada: boolean;
  onCanceladaChange: (value: boolean) => void;
  motivo: string;
  onMotivoChange: (value: string) => void;
  selectClassName: string;
  compact?: boolean;
};

export function MotivoCancelacionFields({
  cancelada,
  onCanceladaChange,
  motivo,
  onMotivoChange,
  selectClassName,
  compact = false,
}: Props) {
  const motivoEnLista = esMotivoCancelacionValido(motivo);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <label
        className={
          compact
            ? "flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50"
            : "flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-900 dark:bg-zinc-800/60 dark:text-zinc-50"
        }
      >
        <input
          type="checkbox"
          checked={cancelada}
          onChange={(e) => {
            const checked = e.target.checked;
            onCanceladaChange(checked);
            if (!checked) onMotivoChange("");
          }}
          className="h-4 w-4"
        />
        Cancelar recolección
      </label>
      {cancelada && (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Motivo de cancelación *
          </span>
          <select
            required
            value={motivoEnLista ? motivo : ""}
            onChange={(e) => onMotivoChange(e.target.value)}
            className={selectClassName}
          >
            <option value="">Elegí un motivo</option>
            {MOTIVOS_CANCELACION.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
          {motivo && !motivoEnLista && (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Motivo anterior (texto libre): {motivo}. Elegí una opción de la lista.
            </p>
          )}
        </label>
      )}
    </div>
  );
}
