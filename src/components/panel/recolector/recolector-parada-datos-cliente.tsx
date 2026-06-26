export type RecolectorParadaDatosCliente = {
  direccion: string;
  depto: string | null;
  barrio: string | null;
  zona: string | null;
  horario: string;
  servicio: string | null;
  unidad: string | null;
  frecuencia: string | null;
  precio: string | null;
  deuda: string | null;
  notaEncargado: string | null;
  telefono: string | null;
};

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function RecolectorParadaDatosClienteRows({
  datos,
  className = "mt-3 space-y-2 text-sm",
  whatsappHref,
}: {
  datos: RecolectorParadaDatosCliente;
  className?: string;
  /** Si hay teléfono, enlace wa.me junto al número */
  whatsappHref?: string | null;
}) {
  const telefonoDisplay = displayValue(datos.telefono);
  const showWhatsapp = Boolean(whatsappHref && datos.telefono?.trim());

  return (
    <dl className={className}>
      <Row label="Dirección" value={displayValue(datos.direccion)} />
      <Row label="Depto" value={displayValue(datos.depto)} />
      <Row label="Barrio" value={displayValue(datos.barrio)} />
      <Row label="Zona" value={displayValue(datos.zona)} />
      <Row label="Horario" value={displayValue(datos.horario)} />
      <Row label="Servicio" value={displayValue(datos.servicio)} />
      <Row label="Unidad" value={displayValue(datos.unidad)} />
      <Row label="Frecuencia" value={displayValue(datos.frecuencia)} />
      <Row label="Precio" value={displayValue(datos.precio)} />
      <Row label="Deuda" value={displayValue(datos.deuda)} />
      <Row label="Nota encargado" value={displayValue(datos.notaEncargado)} multiline />
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-500">Teléfono</dt>
        <dd className="flex items-center justify-end gap-2 font-medium text-zinc-900 dark:text-zinc-50">
          <span>{telefonoDisplay}</span>
          {showWhatsapp && (
            <a
              href={whatsappHref!}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir WhatsApp con ${datos.telefono}`}
              className="inline-flex shrink-0 items-center rounded-full bg-[#25D366] px-2.5 py-1 text-[11px] font-semibold text-white active:bg-[#1da851]"
            >
              WhatsApp
            </a>
          )}
        </dd>
      </div>
    </dl>
  );
}

function Row({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  if (multiline) {
    return (
      <div className="space-y-1">
        <dt className="text-zinc-500">{label}</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-50">{value}</dd>
      </div>
    );
  }

  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">{value}</dd>
    </div>
  );
}
