-- Cantidad de cestos retirados (carga en campo del recolector)

ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS cestos INT;
