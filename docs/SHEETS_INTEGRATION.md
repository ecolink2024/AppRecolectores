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
| Tipo de servicio / Tipo de cliente | Reciclaje, Mixto, Organico, **Punto**, **Proveedor**, **Cooperativa**. Punto + Unidad Empresa → cobro especial. Proveedor/Cooperativa = paradas **logísticas** (sin cobro; la app deriva `categoria_parada = logistica`). No usar **Puntos** aquí: es valor de **Unidad**, no de tipo |
| Frecuencia | Mensual, Puntual, Semanal, Quincenal |

### Qué se persiste en Supabase al importar

Cada fila **Pendiente** enviada **crea** una parada en `ruta_recolecciones` (si la ruta ya existe, se **agrega**; nunca se pisa una parada existente). Los encabezados de planilla se mapean así:

| Columna planilla | Columna DB | Notas |
|------------------|------------|--------|
| Unidad | `unidad` | Canónico: `Hogar` \| `Empresa` \| `Puntos` |
| Tipo de servicio / Tipo de cliente | `tipo_servicio` | Canónico: `Reciclaje` \| `Mixto` \| `Organico` \| `Punto` \| `Proveedor` \| `Cooperativa`. Al importar Proveedor/Cooperativa se setea `categoria_parada = logistica` |
| Precio | `precio` | TEXT (ej. `"15000"`) |
| Observaciones | `observaciones` | Notas operario/planilla |
| Recolector | (ruta) | Agrupa en `rutas.asignado_a` por email resuelto |

Los contadores de retiro (`bolsas_llenas`, `bolsas_llenas_punto`, `bolsas_nuevas_vendidas`, `cestos`, etc.) y los montos de cobro **no** vienen de la planilla: los carga el recolector en campo. Qué contadores se muestran depende del tipo: Reciclaje sin biotachos; Orgánico sin bolsas ni cestos; Mixto todo; **Empresa + Punto** bolsas (hogar/punto/vendidas/nuevas) sin biotachos ni cestos; **Proveedor/Cooperativa** solo cestos/biotachos dejó/retiró (sin cobro). No hace falta columna nueva en Sheets para logística: solo el valor en Tipo de servicio.

### Cómo enviar Empresa + Punto

Una fila de `Rutas` con **ambas** columnas:

| Columna | Valor canónico |
|---------|----------------|
| Unidad | `Empresa` |
| Tipo de servicio | `Punto` |

El resto igual que cualquier parada (Nombre, Direccion, Telefono, Dia, Hora, Recolector). `Precio` se persiste pero **no** entra al total de la regla `empresa_punto`. No hay columnas de bolsas/pagos en el sheet.

**No** uses Unidad `Puntos` ni Tipo `Puntos` para este flujo. Alias de tipo `puntos` / `punto` se normalizan a `Punto` al importar (`parseTipoServicio`).

Los **pagos de punto** del panel (Historial → Puntos → Agregar pago) **no** se importan por Sheets: viven en `punto_pagos`.

Ver detalle del modelo (incl. Empresa + Punto e Historial Puntos): [GUIA_DESARROLLADORES.md](./GUIA_DESARROLLADORES.md) § Almacenamiento en `ruta_recolecciones` y § Historial Puntos.

### Cómo se suma a una ruta existente

Si ya hay una ruta con la misma **fecha + turno + recolector**:

- La ruta **no está** Realizada ni Cerrada → las filas nuevas se **agregan** (no se borran paradas existentes ni su carga de campo).
- El **teléfono** ya está en esa ruta → esa fila no entra (Error en la planilla). El resto sí.
- La ruta **ya está finalizada** (Realizada o Cerrada) → no se agrega nada. Hay que reactivarla para sumar paradas.

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
4. **Actualizar desplegable tipos de cliente** (Reciclaje, Mixto, Organico, Punto, Proveedor, Cooperativa)
5. Completar filas de datos
6. **Validar todas las filas**
7. **Enviar pendientes a la app**

## Ledger de deudas (otra planilla)

No es la hoja `Rutas`. Es [este spreadsheet](https://docs.google.com/spreadsheets/d/1mWYWFdoU3e2yeVIwi2Z90fr5ds-Jx0dEARJ5wR-WOvw/edit?gid=47039710#gid=47039710) (misma cuenta Google).

Al **cierre operario** (Historial, rutas Realizadas), la app escribe ahí:

- Columna **H**: teléfono (busca la fila)
- Columna **L**: deuda nueva = deuda que ya estaba en la app + transferencia + QR (el efectivo no suma)

La app **no** muestra esa deuda nueva.

### Cómo activarlo

1. Reemplazá el Apps Script de la planilla `Rutas` con `scripts/google-apps-script/ImportarRuta.gs` (incluye `doPost`).
2. En el editor: **Implementar → Nueva implementación → Tipo: Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquiera** (Vercel llama sin sesión de Google; el secreto va en el body)
3. Copiá la URL que termina en `/exec`.
4. En Vercel y `.env.local`: `SHEETS_DEUDA_WEBAPP_URL=` esa URL. El secreto es el mismo `SHEETS_IMPORT_SECRET` / **Configurar integración**.
5. Redeploy. La cuenta dueña del script tiene que poder **editar** el ledger.

Si falta la URL, el cierre operario funciona igual y no se escribe el ledger.

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
