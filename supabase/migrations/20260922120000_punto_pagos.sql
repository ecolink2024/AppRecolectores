-- Pagos cargados a mano para tipo Punto (Historial → Puntos).
-- Empareje con recolecciones por celular: pendiente (recoleccion_id queda null).

CREATE TABLE IF NOT EXISTS public.punto_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  nombre TEXT NOT NULL,
  celular TEXT NOT NULL,
  telefono_normalizado TEXT NOT NULL,
  servicio TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad >= 0),
  monto NUMERIC NOT NULL CHECK (monto >= 0),
  recoleccion_id UUID REFERENCES public.ruta_recolecciones (id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.punto_pagos
DROP CONSTRAINT IF EXISTS punto_pagos_servicio_check;

ALTER TABLE public.punto_pagos
ADD CONSTRAINT punto_pagos_servicio_check
CHECK (servicio IN ('bolsas_llenas_regalo', 'bolsa_nueva', 'propia_punto'));

CREATE INDEX IF NOT EXISTS punto_pagos_fecha_idx ON public.punto_pagos (fecha DESC);
CREATE INDEX IF NOT EXISTS punto_pagos_telefono_idx ON public.punto_pagos (telefono_normalizado);

ALTER TABLE public.punto_pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS punto_pagos_staff_select ON public.punto_pagos;
CREATE POLICY punto_pagos_staff_select ON public.punto_pagos
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS punto_pagos_staff_insert ON public.punto_pagos;
CREATE POLICY punto_pagos_staff_insert ON public.punto_pagos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

NOTIFY pgrst, 'reload schema';
