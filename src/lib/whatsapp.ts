/** Mensaje al cliente antes de iniciar la ruta (con nombre del recolector). */
export function buildWhatsAppAvisoRecoleccion(recolectorNombre: string): string {
  const nombre = recolectorNombre.trim() || "tu recolector/a";
  return [
    "Hola! Cómo estás?",
    `Soy ${nombre} tu recolector/a de hoy! ♻️ 🚛`,
    "Estoy empezando el recorrido, te voy a estar avisando cuando este camino a tu domicilio!",
    "Cualquier cosa nos escribimos por aca!",
  ].join("\n");
}

/** Enlace wa.me para avisar al cliente (mismo mensaje que «Avisar» en la ruta). */
export function buildWhatsAppHrefRecoleccion(
  telefono: string | null | undefined,
  recolectorNombre: string,
): string {
  const phone = telefono?.trim();
  if (!phone) return "";
  return buildWhatsAppUrl(phone, buildWhatsAppAvisoRecoleccion(recolectorNombre));
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?${new URLSearchParams({ text }).toString()}`;
}

export type WhatsAppAvisoRecoleccion = {
  recoleccionId: string;
  orden: number;
  nombre: string;
  telefonoDisplay: string;
  url: string;
};

type RecoleccionConTelefono = {
  id: string;
  orden: number;
  nombre: string;
  telefono: string | null;
  telefonoNormalizado: string | null;
};

/** Paradas con teléfono válido y enlace wa.me con el aviso de inicio de ruta. */
export function buildWhatsAppAvisosRecolecciones(
  recolecciones: RecoleccionConTelefono[],
  recolectorNombre: string,
): WhatsAppAvisoRecoleccion[] {
  const text = buildWhatsAppAvisoRecoleccion(recolectorNombre);
  const result: WhatsAppAvisoRecoleccion[] = [];

  for (const item of recolecciones) {
    const phone = item.telefonoNormalizado || item.telefono;
    if (!phone) continue;
    const url = buildWhatsAppUrl(phone, text);
    if (!url) continue;
    result.push({
      recoleccionId: item.id,
      orden: item.orden,
      nombre: item.nombre,
      telefonoDisplay: item.telefono?.trim() || phone,
      url,
    });
  }

  return result;
}
