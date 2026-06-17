-- Bucket privado para firmas de clientes (PNG desde app recolector)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firmas-recoleccion',
  'firmas-recoleccion',
  false,
  524288,
  ARRAY['image/png', 'image/jpeg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura: staff (superadmin / admin — panel operativo e historial)
DROP POLICY IF EXISTS firmas_recoleccion_select_staff ON storage.objects;
CREATE POLICY firmas_recoleccion_select_staff
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'firmas-recoleccion'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('superadmin', 'admin')
  )
);

-- Lectura: recolector asignado a la ruta (path = {ruta_id}/{recoleccion_id}.png)
DROP POLICY IF EXISTS firmas_recoleccion_select_recolector ON storage.objects;
CREATE POLICY firmas_recoleccion_select_recolector
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'firmas-recoleccion'
  AND EXISTS (
    SELECT 1
    FROM public.rutas r
    WHERE r.id = (split_part(name, '/', 1))::uuid
      AND r.asignado_a = auth.uid()
  )
);

-- Escritura vía service role (API); política opcional para upload autenticado directo
DROP POLICY IF EXISTS firmas_recoleccion_insert_recolector ON storage.objects;
CREATE POLICY firmas_recoleccion_insert_recolector
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'firmas-recoleccion'
  AND EXISTS (
    SELECT 1
    FROM public.rutas r
    WHERE r.id = (split_part(name, '/', 1))::uuid
      AND r.asignado_a = auth.uid()
  )
);

DROP POLICY IF EXISTS firmas_recoleccion_update_recolector ON storage.objects;
CREATE POLICY firmas_recoleccion_update_recolector
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'firmas-recoleccion'
  AND EXISTS (
    SELECT 1
    FROM public.rutas r
    WHERE r.id = (split_part(name, '/', 1))::uuid
      AND r.asignado_a = auth.uid()
  )
);
