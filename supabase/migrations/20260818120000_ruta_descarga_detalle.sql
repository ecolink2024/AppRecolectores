-- Texto opcional al marcar descarga en el cierre de ruta.
ALTER TABLE public.rutas
ADD COLUMN IF NOT EXISTS descarga_detalle TEXT;

NOTIFY pgrst, 'reload schema';
