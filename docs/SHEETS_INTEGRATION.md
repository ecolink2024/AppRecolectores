# Integración Google Sheets — Rutas y recolecciones

## Modelo de datos

### Ruta (se agrupa automáticamente)

Una **ruta** se identifica por:

| Clave | Origen en planilla |
|-------|-------------------|
| **Fecha** | Columna `Dia` (YYYY-MM-DD) |
| **Turno** | Derivado de `Hora`: **Mañana** si está entre 8:30 y 13:30; **Tarde** si está entre 14:30 y 20:30 |
| **Recolector** | Columna `Recolector` — **nombre** del recolector (desplegable desde la app; también acepta email) |

Si cambia la fecha, el turno o el recolector → es **otra ruta**.

### Recolección (cada fila de la planilla)

Cada fila es una recolección/cliente, único por **teléfono normalizado** dentro de la ruta.

## Columnas de la hoja `Rutas`

Fila 1 = encabezados exactos:

```
Zona | Nombre | Unidad | Tipo de servicio | Frecuencia | Barrio | Direccion | Depto | Telefono* | Observaciones | Dia | Hora | Nota encargado | Precio | Deuda | Recolector | Estado | MensajeSistema
```

### Obligatorios por fila (planilla y API)

- **Nombre**, **Direccion**, **Telefono**, **Dia**, **Hora**, **Recolector**

`Telefono` es obligatorio en ambos lados: la planilla no deja enviar la fila sin él y la API rechaza filas sin teléfono válido (formato argentino `+54...`, máx. 30 caracteres). Identifica al cliente dentro de la ruta.

### Enums

| Campo | Valores |
|-------|---------|
| Unidad | Hogar, Empresa, Puntos |
| Tipo de servicio / Tipo de cliente | Reciclaje, Mixto, Organico, **Punto** (con Unidad **Empresa** → cobro especial en app). No usar **Puntos** aquí: es valor de **Unidad**, no de tipo |
| Frecuencia | Mensual, Puntual, Semanal |

### Qué se persiste en Supabase al importar

Cada fila **Pendiente** enviada crea o actualiza una fila en `ruta_recolecciones`. Los encabezados de planilla se mapean así:

| Columna planilla | Columna DB | Notas |
|------------------|------------|--------|
| Unidad | `unidad` | Canónico: `Hogar` \| `Empresa` \| `Puntos` |
| Tipo de servicio / Tipo de cliente | `tipo_servicio` | Canónico: `Reciclaje` \| `Mixto` \| `Organico` \| `Punto` |
| Precio | `precio` | TEXT (ej. `"15000"`) |
| Observaciones | `observaciones` | Notas operario/planilla |
| Recolector | (ruta) | Agrupa en `rutas.asignado_a` por email resuelto |

Los contadores de retiro (`bolsas_llenas`, `bolsas_llenas_punto`, `bolsas_nuevas_vendidas`, `cestos`, etc.) y los montos de cobro **no** vienen de la planilla: los carga el recolector en campo y se guardan en las mismas columnas de `ruta_recolecciones`.

Ver detalle del modelo (incl. Empresa + Punto): [GUIA_DESARROLLADORES.md](./GUIA_DESARROLLADORES.md) § Almacenamiento en `ruta_recolecciones`.

### Estado (automático — no editar)

| Estado | Significado |
|--------|-------------|
| Pendiente | Lista para enviar (fondo amarillo) |
| Incompleto | Faltan datos (rojo suave) |
| Error | Datos inválidos (rojo suave + celda en rojo fuerte) |
| Enviada | Ya importada (verde, no se revalida) |

## Apps Script — instalación

1. Pegar `scripts/google-apps-script/ImportarRuta.gs` en Extensiones → Apps Script
2. **Configurar integración** → URL `https://app-recolectores.vercel.app` + secreto
3. **Actualizar desplegable recolectores** (trae nombres de la base; si hay nombres repetidos muestra `Nombre (email)`)
4. **Actualizar desplegable tipos de cliente** (Reciclaje, Mixto, Organico, Punto en columna Tipo de servicio / Tipo de cliente)
5. Completar filas de datos
6. **Validar todas las filas**
7. **Enviar pendientes a la app**

## API

- `GET /api/integrations/sheets/import-recolecciones` — lista recolectores
- `POST /api/integrations/sheets/import-recolecciones` — importa filas Pendiente

## Migraciones SQL (Supabase)

Operativas recientes (también en `supabase/apply-pending-operativo.sql`):

- `20260606120000_recoleccion_observaciones_recolector.sql` — `observaciones_recolector`
- `20260607120000_recoleccion_cesto_campo.sql` — `cestos`

Base histórica:

1. `20260521120000_rutas_sheets_import.sql`
2. `20260522120000_rutas_recolecciones_full.sql`

## Depto — evitar que Sheets lo convierta a fecha

Seleccioná la columna Depto → Formato → **Texto plano**.
