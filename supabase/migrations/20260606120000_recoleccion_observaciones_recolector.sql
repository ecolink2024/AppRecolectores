-- Observaciones opcionales del recolector al cargar la parada en campo (distinto de observaciones de planilla/operario)

ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS observaciones_recolector TEXT;
