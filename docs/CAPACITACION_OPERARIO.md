# Capacitación operario — App Recolectores

Documento para el equipo operativo. Explica cómo usar la app y la planilla en el día a día, incluyendo las novedades recientes (paradas logísticas Proveedor/Cooperativa, KPIs e Historial).

**App en producción:** https://app-recolectores.vercel.app

---

## 1. Roles rápidos

| Rol | Qué hace |
|-----|----------|
| **Operario / Superadmin** | Planilla, Operativo, Historial, KPIs, preparación de insumos, cierre operario |
| **Recolector** | Carga en campo en el celular (retiro, cobro o logística, firma) |

---

## 2. Novedad: Proveedor y Cooperativa (paradas logísticas)

### Qué son
**No son clientes de cobro.** Son paradas de la ruta para registrar **cestos y biotachos que se dejan o se retiran**.

- Aparecen en la ruta del recolector (orden, mapa, historial de la visita).
- **No se cobran** (sin precio ni efectivo/transferencia/QR).
- **No entran** a los KPIs ni a los totales de servicios / recaudación.
- Sí piden **firma** y se pueden **cancelar** (con motivo).

### Frase para recordar
> “Proveedor y Cooperativa van en la ruta para registrar cestos y biotachos que se dejan o retiran, con firma. No se cobran y no entran a las métricas de clientes.”

### Cómo cargarlas en la planilla Google Sheets

Usá la **misma grilla de siempre**. No hay columnas nuevas.

1. En **Tipo de servicio** (o Tipo de cliente) elegí **Proveedor** o **Cooperativa**.
2. Completá como siempre: Nombre, Dirección, Teléfono, Día, Hora, Recolector.
3. Zona, Barrio, Depto, Observaciones: opcionales.
4. **Unidad, Precio y Deuda** pueden quedar **vacíos** (no hay cobro).
5. Menú **App Recolectores → Validar todas las filas**.
6. **Enviar pendientes a la app**.

Si no aparecen Proveedor/Cooperativa en el desplegable:  
**App Recolectores → Actualizar desplegable tipos de cliente**.

#### Ejemplo de fila

| Campo | Ejemplo |
|-------|---------|
| Nombre | Cooperativa Norte |
| Tipo de servicio | Cooperativa |
| Dirección | Av. Ejemplo 1234 |
| Teléfono | (formato argentino válido) |
| Día | 2026-09-16 |
| Hora | 10:00 |
| Recolector | el de esa ruta |
| Unidad / Precio / Deuda | vacío |

**Importante:** las cantidades (cuántos cestos/biotachos se dejaron o retiraron) **no se escriben en el Sheet**. Las carga el **recolector en la app**.

### Qué ve el recolector en esa parada

Formulario **Logística**:

- Cestos **dejados**
- Cestos **retirados**
- Biotachos **dejados**
- Biotachos **retirados** (puede poner 0)
- Firma del cliente / responsable
- Opción de cancelar con motivo

**No** aparecen: bolsas de cliente, precio, efectivo, transferencia, QR.

### Qué ve el operario en el panel

- En **Operativo** e **Historial** la parada figura con tipo Proveedor o Cooperativa.
- En Historial, las cantidades se muestran como **D n · R n** (dejó · retiró).
- Los montos aparecen como **—** (no hay cobro).
- **Ver detalle** y **Editar carga** (en rutas Realizadas) muestran solo logística.

### Qué NO debe esperar el operario

- Que sumen a “servicios exitosos”, tablas por unidad/tipo, por zona, CSV de KPIs o montos de la ruta.
- Que pidan precio o medios de pago.

Sí quedan registradas para saber **qué insumos se movieron** en la jornada.

---

## 3. Tipos de parada / cliente (resumen)

En planilla, la columna **Tipo de servicio / Tipo de cliente** admite:

| Valor | Qué es |
|-------|--------|
| **Reciclaje** | Cliente: retiro de reciclables (sin biotachos en el form) |
| **Mixto** | Cliente: bolsas y biotachos; cobro especial en Hogar |
| **Orgánico** (Organico) | Cliente: biotachos (sin bolsas ni cestos en el form) |
| **Punto** | Cliente; con Unidad **Empresa** tiene cobro especial |
| **Proveedor** | Logística (sin cobro, sin KPIs) |
| **Cooperativa** | Logística (sin cobro, sin KPIs) |

**No confundir:**

- **Punto** = tipo de servicio  
- **Puntos** = valor de la columna **Unidad** (Hogar / Empresa / Puntos)

---

## 4. Flujo diario del operario

1. Completar / revisar la **planilla** (clientes y, si aplica, Proveedor/Cooperativa).
2. **Enviar pendientes** a la app.
3. En **Operativo**: preparación de insumos de la ruta.
4. El recolector hace la jornada en el celular.
5. Cuando finaliza, la ruta pasa a **Historial** como **Realizada**.
6. El operario revisa, puede **Editar** datos de jornada o **Editar carga** de paradas.
7. **Cierre operario** → la ruta queda **Cerrada** y recién ahí impacta fuerte en **KPIs** (montos y servicios de clientes).

---

## 5. Historial (tips útiles)

- Se filtra por **fecha de la ruta** (columna Día de la planilla), no por el día en que el recolector finalizó.
- Por defecto: últimos 30 días.
- Al elegir una ruta, la tabla de abajo muestra **todas** las paradas de **esa** ruta. Si hay muchas, desplazá hacia abajo dentro de la tabla.
- Un mismo día puede tener **varias rutas** (mañana/tarde, distintos recolectores). Cada tabla es de una sola ruta.
- Botones en rutas **Realizadas**: Editar, Reactivar, Cierre operario.

---

## 6. KPIs (lo que el operario debe saber)

- Los KPIs miran rutas del **Historial** en el rango de fechas.
- **Montos, materiales y “Rutas en el período”** cuentan sobre todo rutas **Cerradas** (después del Cierre operario).
- Una ruta **Pendiente de cierre** (Realizada) se ve, pero **no** mueve recaudación hasta cerrarla.
- Hay tablas **Por unidad de negocio** y **Por tipo de servicio**.
- **Mixto** no tiene columna/fila propia:
  - **Visitada:** se reparte a Reciclaje y/o Orgánico según bolsas/biotachos en campo (+1 por tipo si hubo retiro).
  - **Cancelada:** suma siempre en **Orgánico (Canc.)** y en cancelados totales de la unidad; **no** en Reciclaje.
- **Proveedor y Cooperativa no entran** a esas métricas.

---

## 7. Contadores de campo según tipo (clientes)

| Tipo | Bolsas | Biotachos | Cestos | Cobro |
|------|--------|-----------|--------|-------|
| Reciclaje | Sí | No | Sí | Sí |
| Orgánico | No | Sí | No | Sí |
| Mixto | Sí | Sí | Sí | Sí (regla Mixto) |
| Punto (otra unidad) | Sí | Sí | Sí | Sí |
| Empresa + Punto | Sí | No | No | Sí (regla Empresa + Punto) |
| Proveedor / Cooperativa | No | Dejó/retiró | Dejó/retiró | **No** |

---

## 8. Checklist rápido — parada logística

- [ ] Tipo = Proveedor o Cooperativa en la planilla  
- [ ] Nombre, dirección, teléfono, día, hora, recolector  
- [ ] Unidad/Precio vacíos OK  
- [ ] Validar y enviar  
- [ ] Recolector carga dejó/retiró + firma  
- [ ] Operario revisa en Historial (cantidades, sin montos)  
- [ ] No buscar esa parada en KPIs de servicios  

---

## 9. Problemas frecuentes

### “Tipo de servicio inválido: Cooperativa”
- El desplegable o la app no estaban actualizados. Pedile al equipo técnico confirmar deploy y Apps Script.
- Después de actualizar: **Actualizar desplegable tipos de cliente** y volver a validar/enviar.

### No veo la ruta en Historial
- Revisá el filtro de fechas (fecha de la ruta, no del cierre).
- Rutas con fecha futura no aparecen hasta ese día.

### Veo menos paradas de las esperadas
- Confirmá que estás en la **ruta correcta** (mañana vs tarde / otro recolector).
- Mirá el pie de la tabla (`N paradas`) y desplazá hacia abajo.

### El recolector no puede iniciar la ruta
- Falta **Preparación de insumos** del operario en Operativo.

---

## 10. Glosario breve

| Término | Significado |
|---------|-------------|
| **Parada logística** | Proveedor o Cooperativa: insumos dejó/retiró, sin cobro |
| **Realizada** | El recolector finalizó; falta Cierre operario |
| **Cerrada** | Cierre operario hecho; impacta KPIs de montos/servicios |
| **D n · R n** | Dejó n · Retiró n (cestos o biotachos) |
| **Tipo de servicio** | Reciclaje, Mixto, Orgánico, Punto, Proveedor, Cooperativa |
| **Unidad** | Hogar, Empresa o Puntos |

---

*Documento de capacitación operativa — App Recolectores. Para dudas técnicas, consultar al equipo de desarrollo.*
