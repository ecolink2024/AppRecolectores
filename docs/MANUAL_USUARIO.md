# Manual de uso — App Recolectores

Guía para usuarios de la app **sin conocimientos de programación**. Explica qué puede hacer cada rol y cómo usar las pantallas del día a día.

**¿Sos del equipo técnico?** Leé [GUIA_DESARROLLADORES.md](./GUIA_DESARROLLADORES.md).

**App en producción:** https://app-recolectores.vercel.app

---

## Índice

1. [Acceso a la app](#1-acceso-a-la-app)
2. [Roles: quién puede hacer qué](#2-roles-quién-puede-hacer-qué)
3. [Superadmin](#3-superadmin)
4. [Operario (admin)](#4-operario-admin)
5. [Recolector](#5-recolector)
6. [Planilla Google Sheets](#6-planilla-google-sheets)
7. [Problemas frecuentes](#7-problemas-frecuentes)

**Novedades recientes (junio 2026):** **Operativo vs Historial** (al finalizar el recolector la ruta pasa a Historial); **cierre operario** y **reactivar** solo en Historial; **editar la carga del recolector** desde Historial en rutas Realizadas (antes del cierre operario); KPIs **solo del historial** (Pendiente cierre, Realizadas, Cerradas, Canceladas); **Preparación de insumos**; tablas con scroll; **Ver detalle** de ruta/parada (cestos, firma digital); **dos montos** en rutas y KPIs; gráfico **Recaudación por mes**; **Obs. recolector**; tipo **Punto**; Maps con GPS; WhatsApp **Avisar**. Ya no existe suspender rutas.

---

## 1. Acceso a la app

### Ingresar

1. Abrí https://app-recolectores.vercel.app (o la URL que te haya dado el equipo)
2. Tocá **Iniciar sesión** o andá directo a `/login`
3. Escribí tu **correo** y **contraseña**
4. Al entrar, la app te lleva automáticamente a tu panel según tu rol:
   - **Recolector** → pantalla de rutas (mobile)
   - **Operario o Superadmin** → panel operativo (escritorio)

### Cambiar contraseña

- Si te crearon la cuenta con contraseña inicial, el superadmin puede enviarte un correo para cambiarla desde **Usuarios**
- El superadmin principal (`somos@ecolink.com.ar`) usa el flujo normal de “olvidé mi contraseña” de Supabase

### Salir

- En cualquier pantalla hay un botón **Salir** (arriba a la derecha)

---

## 2. Roles: quién puede hacer qué

| Función | Superadmin | Operario (admin) | Recolector |
|---------|:----------:|:----------------:|:----------:|
| Ver panel operativo (rutas, mapas, recolecciones) | ✅ | ✅ | ❌ |
| Ver **Historial** (rutas cerradas / canceladas) | ✅ | ✅ | ❌ |
| Ver **KPIs** (indicadores y exportación) | ✅ | ✅ | ❌ |
| Configurar **Parámetros** (precios del sistema) | ✅ | ✅ | ❌ |
| Reactivar / cierre operario en rutas (Historial) | ✅ | ✅ | ❌ |
| Descargar CSV (KPIs e Historial) | ✅ | ✅ | ❌ |
| Crear usuarios **operario** | ✅ | ❌ | ❌ |
| Crear usuarios **recolector** | ✅ | ✅ | ❌ |
| Cambiar contraseña de operarios | ✅ | ❌ | ❌ |
| Cambiar contraseña de recolectores | ✅ | ✅ | ❌ |
| Ver y ejecutar **mis rutas** en el celular | ❌ | ❌ | ✅ |
| Iniciar ruta, cargar paradas, cobrar, finalizar ruta | ❌ | ❌ | ✅ |

**Operario** y **Superadmin** comparten el mismo panel de seguimiento. La diferencia principal está en la **gestión de usuarios**.

---

## 3. Superadmin

El superadmin es la cuenta principal de administración (`somos@ecolink.com.ar`). Configura la app, crea operarios y recolectores, y supervisa todo el operativo.

### Menú superior (staff)

| Menú | Ruta | Para qué |
|------|------|----------|
| **Operativo** | `/panel` | Rutas pendientes o en proceso |
| **KPIs** | `/panel/kpis` | Indicadores y exportación |
| **Historial** | `/panel/historial` | Rutas realizadas (pendientes de cierre), cerradas o canceladas |
| **Parámetros** | `/panel/parametros` | Precios globales con historial |
| **Usuarios** | `/panel/usuarios` | Alta y gestión de cuentas |

### 3.1 Panel operativo

Al ingresar llegás a **Operativo** (menú superior). Muestra rutas **pendientes** o **en proceso**. Desde acá preparás insumos, editás rutas y paradas, y seguís el avance del recolector. Cuando el recolector **finaliza** la jornada, la ruta pasa automáticamente a **Historial**.

**Navegación en pantalla:** la tabla de **Rutas** y la de **Recolecciones (servicios)** (abajo, al seleccionar una ruta) tienen **altura fija con scroll interno**. Los encabezados de columna quedan visibles al bajar; al pie de cada tabla ves cuántas filas hay. Así podés ver rutas y paradas a la vez sin que la página crezca sin límite hacia abajo.

### 3.2 Historial

Menú **Historial** → `/panel/historial`

Incluye rutas **Realizadas** (finalizadas por el recolector, pendientes de cierre operario), **Cerradas** (con cierre operario) o **Canceladas**.

**Acciones por ruta (columna Acciones):**

| Estado | Botones disponibles |
|--------|---------------------|
| **Realizado** | **Editar**, **Reactivar**, **Cierre operario** |
| **Cerrada** o **Cancelada** | **Editar** (datos administrativos de la ruta) |

- **Reactivar** (solo Realizado): la ruta vuelve a **Operativo** en **En proceso**; se borran los datos de cierre del recolector para que pueda seguir operándola.
- **Cierre operario** (solo Realizado): la ruta pasa a **Cerrada** (sigue en Historial).

En rutas **Realizadas** podés **editar la carga que hizo el recolector** en cada parada (retiro, cobro, cancelación, firma y observaciones) con el botón **Editar carga** de la tabla de recolecciones — sin reactivar la ruta. Al guardar, se recalcula el total y se actualizan Historial y KPIs. En rutas **Cerradas** o **Canceladas** las paradas quedan de **solo consulta**. Para **agregar o quitar** paradas de una Realizada, primero **Reactivar** desde Historial.

**Descargar:** botón **Descargar historial (CSV)** (arriba a la derecha) exporta **todas** las rutas del historial y **todos** sus servicios en un archivo Excel-compatible.

#### Tabla de rutas (Historial)

Tabla amplia con **scroll vertical** (altura acotada, encabezado fijo al bajar) y **scroll horizontal**. Las primeras columnas quedan fijas al desplazarte a la derecha (Fecha, Recolector, Turno); el resto es desplazable:

| Columna | Contenido |
|---------|-----------|
| Fecha, Recolector, Turno | Identificación de la jornada |
| Duración recolección | Tiempo desde inicio de jornada hasta cierre del recolector |
| Operario, inicios/cierres | Quién cerró y timestamps de jornada |
| Km iniciales / finales / recorridos | Kilometraje |
| Observaciones | Recolector + operario |
| Estado | Cerrada, Cancelada, etc. |
| **Ver insumos** | Popup con bolsas, kit, cestos, biotachos, ropa, celular al inicio |
| Descarga, gastos | Combustible, descuento, otros |
| Recolecciones / exitosos / pendientes / canceladas | Resumen de paradas |
| **Monto a recaudar** | Suma de precios cargados en paradas visitadas (*monto total por servicios prestados*) |
| **Total recaudado** | Pagos reales cobrados en campo: efectivo + transferencia + QR (*monto real recaudado*) |
| Después de gastos / Total efectivo | Efectivo neto tras combustible, descuento y otros gastos de cierre |
| **Acciones** | Editar, Reactivar (Realizado), Cierre operario (Realizado) |

Seleccioná una fila para ver sus servicios abajo.

#### Tabla de recolecciones (Historial)

Misma ruta seleccionada arriba. Mismo criterio de **scroll vertical** (encabezado fijo) y horizontal que la tabla de rutas. Columnas (en este orden):

Horario · Recolector · Nombre cliente · Zona · **Biotachos llenos** · **Bolsas llenas** · Precio total · Montos (efectivo, transferencia, QR) · Estado · Motivo cancelación · Observaciones · Detalle · Firma · Firmante · **Unidad** · **Tipo de servicio** · **Editar carga** (solo en rutas Realizadas)

> **Editar carga (rutas Realizadas):** abre un formulario con los mismos campos que llena el recolector — retiro (bolsas/biotachos/cestos), cobro (efectivo/transferencia/QR), motivo de cancelación, observaciones y firma. La firma existente se conserva salvo que actives **Reemplazar firma**. El total a cobrar se recalcula con los precios vigentes. Disponible solo antes del **Cierre operario**.

**Horario programado**, **hora real** y **bolsas nuevas** de cada parada están en el popup **Info** (junto al nombre del cliente).

**Datos del cliente:** tocá el nombre del cliente, **Info** o la zona → se abre un popup con **horario programado**, **hora real**, **bolsas nuevas**, dirección, teléfono, tipo de servicio, frecuencia, retiro (bolsas llenas, biotachos llenos), cobros y más.

### 3.3 KPIs (indicadores)

Menú **KPIs** → `/panel/kpis`

Panel de métricas agregadas según el **período** elegido. Solo lectura.

> **Alcance:** los KPIs incluyen **solo rutas del historial** (`Realizado`, `Cerrada` o `Cancelada`) cuya **fecha de ruta** cae en el rango elegido. Las rutas que siguen en **Operativo** (pendientes o en curso) **no** entran en estos números. Una ruta **Cancelada** cuenta aunque el recolector no la haya finalizado.

**Filtros de fecha:**

| Opción | Uso |
|--------|-----|
| **Desde / Hasta** + **Aplicar** | Cualquier rango (días, meses, años) |
| Atajos (7 días, 30 días, mes en curso, 90 días) | Períodos frecuentes |

**Secciones principales:**

- Resumen del período: **Monto total por servicios prestados** y **Monto real recaudado**, servicios exitosos, índice de exitosas, cantidad de rutas del historial
- **Rutas** por estado en historial: **Pendiente cierre** (Realizado sin cierre operario), **Realizadas** (jornadas finalizadas por el recolector, incluye las ya cerradas), **Cerradas**, **Canceladas**
- **Recolecciones (servicios):** ingresadas (todas las paradas de esas rutas), exitosas, canceladas, omitidas, pendientes, índice de exitosas
- **Por zona:** servicios, tipo de servicio, frecuencia, **bolsas llenas** (solo llenas, sin contar nuevas), efectivo, transferencia, QR, ingreso total
- **Por recolector:** agendadas, realizadas, % éxito, ingresos (monto real recaudado)
- **Finanzas:** desglose por medio de pago + resumen de los dos montos + promedio por recolección exitosa
- Operación (km, duración, materiales)
- Gráfico **Recaudación por mes** (últimos 12 meses visibles; **no** usa el filtro Desde/Hasta de arriba; dos barras por mes: total precio vs recaudado; podés recorrer meses anteriores o siguientes)

#### Los dos montos (rutas y KPIs)

En tablas de rutas, resumen de KPIs y gráfico mensual se distinguen:

| Nombre en KPIs | En tablas de rutas | Qué incluye |
|----------------|-------------------|-------------|
| **Monto total por servicios prestados** | **Monto a recaudar** | Suma de los precios calculados en cada parada **visitada** de rutas del historial en el período |
| **Monto real recaudado** | **Total recaudado** | Suma de lo cobrado en campo: efectivo + transferencia + QR en paradas **visitadas** de esas rutas |

Si un cliente pagó de más o de menos respecto al precio, los dos montos pueden diferir.

> **Pendientes** en la sección de recolecciones = paradas aún no visitadas dentro de rutas del historial (no confundir con **Pendiente cierre**, que es una ruta Realizada esperando cierre operario).

**Descargar:** **Descargar KPIs (CSV)** exporta el resumen del período filtrado y la serie mensual (48 meses) con ambos montos.

> En toda esta sección, **Recolecciones (servicios)** = paradas de la planilla/campo (no confundir con otras entidades del negocio).

### 3.4 Estados de ruta (resumen)

| Estado en app | Dónde se ve | Significado |
|---------------|------------|-------------|
| Pendiente / En proceso | Operativo | Aún no finalizada por el recolector, o en curso |
| **Realizado** (`completada`) | **Historial** | Recolector finalizó; falta **Cierre operario** del staff |
| **Cerrada** | **Historial** | Cierre operario registrado |
| Cancelada | Historial | Ruta cancelada (puede estar ahí sin finalización del recolector) |

### 3.5 Tabla de rutas (Operativo)

Lista las rutas del contexto actual. El subtítulo indica cuántas rutas hay (ej. `12 rutas · Seleccioná una fila…`). Si hay muchas filas, **desplazá dentro de la tabla**; el encabezado permanece visible.

Cada fila incluye, entre otros:

| Columna | Qué muestra |
|---------|-------------|
| Fecha, Recolector, Estado, Turno | Identificación de la jornada |
| **Recolecciones** | Cantidad total de paradas |
| **Exitosas** | Paradas visitadas |
| **Bolsas recolectadas** | Total de bolsas (llenas + nuevas) en paradas visitadas; pasá el mouse para ver el detalle |
| **Biotachos** | Total de biotachos (llenos + nuevos) en visitadas; tooltip con detalle |
| Km, Inicio jornada | Kilometraje e inicio del recolector |
| **Ver insumos** | Popup con lo que declaró el recolector al iniciar (bolsas, kit, cestos, biotachos, ropa, celular) |
| **Preparación** | Formulario obligatorio del operario antes del inicio (mismos tipos de insumo que el recolector). **Completar** (ámbar) hasta guardar; **Ver prep.** (verde) cuando ya está listo |
| Cierre recolector / operario | Fechas de cierre |
| **Monto a recaudar** | Monto total por servicios prestados (suma de precios en visitadas) |
| **Total recaudado** | Monto real recaudado (efectivo + transferencia + QR en visitadas) |
| Observaciones | Notas del operario |

**Acciones por ruta:**

| Botón | Qué hace |
|-------|----------|
| Seleccionar fila | Muestra sus recolecciones abajo |
| **Ver detalle** | Popup con resumen, **desglose de paradas** y **recaudación** (ver abajo) |
| **Ver mapa** | Mapa con direcciones geocodificadas |
| **Ver insumos** | Insumos de inicio de jornada |
| **Completar** / **Ver prep.** | Preparación de insumos (obligatoria antes del inicio del recolector) |
| **Editar** | Cambiar nombre, fecha, turno, estado, recolector, observaciones |
| **Eliminar** | Borra la ruta y todas sus paradas |

> En **Operativo** solo **Editar** (más ver detalle, mapa, insumos, preparación). **Reactivar**, **Cierre operario** y **Editar** de rutas **Realizadas** están en **Historial**.

#### Ver detalle de una ruta (popup)

Al tocar **Ver detalle** en la tabla de rutas:

1. **Datos generales** — fecha, turno, recolector, estado
2. **Recolecciones exitosas** — total y, debajo, cuántas hay de cada combinación **Unidad · Tipo de cliente** (ej. Hogar · Orgánico: 3)
3. **Recolecciones pendientes** — mismo desglose (paradas aún no hechas o en camino)
4. **Recolecciones canceladas** — mismo desglose (canceladas u omitidas)
5. **Recaudación** — monto a recaudar, efectivo, transferencia, QR y total

Desde el popup solo consultás el resumen; las acciones sobre la ruta están en la columna **Acciones** de la tabla.

#### Preparación de insumos (operario, obligatoria)

Antes de que el recolector pueda **Inicio de ruta**, el operario debe:

1. Tocar **Completar** en la columna **Preparación** de la ruta
2. Agregar insumos (mismo desplegable que al iniciar: Bolsa Nueva, Cesto, Biotacho, Bolsa de Punto, Planilla Empresas, Planilla de Punto, Cartel Empresa)
3. Tocar **Guardar preparación**

Hasta que no se guarde, el recolector ve un aviso y el botón **Inicio de ruta** queda deshabilitado. Una vez guardada, en el detalle de ruta del recolector aparece **Insumos asignados** con el listado.

Podés editar la preparación mientras la ruta no haya sido iniciada por el recolector.

> **Maps y Avisar** no dependen de la preparación: el recolector puede ver la ruta y usar Maps antes del inicio. Solo **Inicio de ruta** queda bloqueado hasta que guardes la preparación.

#### Tabla **Recolecciones (servicios)** (Operativo)

Muestra las paradas de la **ruta seleccionada** arriba (fila resaltada en verde). La tabla tiene **scroll propio** para ver muchas paradas sin perder de vista la lista de rutas.

**Columnas principales:** #, Estado, **Detalle**, Zona, Dirección, Horario prog., Nombre, Hora real, Unidad, Tipo de cliente, Precio total, **Obs. recolector**, **Obs. operario**, Firma, Firmante, **Editar**.

Los tipos de cliente válidos al crear/editar una parada son: **Reciclaje**, **Mixto**, **Orgánico** y **Punto** (este último con Unidad **Empresa** activa reglas de cobro especiales; no confundir con Unidad **Puntos**).

**Ver detalle (por parada):** botón en la columna **Detalle** (tercera columna). Abrí el popup para ver:

- **Retiro:** bolsas (llenas/nuevas), biotachos (llenos/nuevos) y **cestos**
- **Recaudación:** efectivo, transferencia y QR

Si la parada está **pendiente**, el botón aparece deshabilitado (gris) hasta que el recolector la visite o cancele. Si está **cancelada**, el popup muestra el motivo.

> En **Historial** la tabla de paradas muestra **biotachos llenos** y **bolsas llenas**; **bolsas nuevas** está en el popup **Info**. Montos van en columnas aparte (no usa el popup de detalle de Operativo).

| Acción (Operativo) | Qué hace |
|--------------------|----------|
| **Ver detalle** | Retiro y cobro de la parada (si ya fue visitada o cancelada) |
| **Editar** | Modificar datos de la parada |
| **+ Agregar recolección** | Agregar una parada manual (no si la ruta está Realizada o Cerrada) |
| **Eliminar** | Quitar una parada |

Los campos **Unidad** y **Tipo de cliente** vienen de la planilla o del alta manual (desplegable en **Editar**); definen, entre otras cosas, **cómo se calcula el cobro** en campo (ver § 5.5).

> **Obs. operario** = notas de la planilla o las que cargás al editar la parada. **Obs. recolector** = notas opcionales que el recolector escribe al guardar la carga en campo (columnas angostas; pasá el mouse para leer el texto completo).

> **Antes:** las columnas Bolsas, Biotachos, Efectivo y Transferencia estaban sueltas en Operativo; ahora van dentro de **Ver detalle** para dejar la tabla más legible.

### 3.6 Cierre operario

Cuando el recolector **finalizó** la ruta, esta aparece en **Historial** con estado **Realizado**:

1. Menú **Historial** → en la fila de la ruta, tocá **Cierre operario**
2. Confirmá en dos pasos
3. La ruta pasa a **Cerrada** (sigue en Historial)

El recolector ya no puede editar paradas desde que finalizó; el staff cierra operariamente desde Historial.

### 3.7 Reactivar una ruta (Historial)

Si una ruta **Realizada** debe volver a operarse (corregir paradas, reabrir la jornada):

1. Menú **Historial** → tocá **Reactivar** en la fila (solo visible en estado **Realizado**)
2. Confirmá la acción
3. La ruta vuelve a **Operativo** en **En proceso**; se borran los datos de cierre del recolector

### 3.8 Mapa y reorden de paradas

1. Seleccioná una ruta
2. Tocá **Ver mapa**
3. La app geocodifica direcciones que aún no tienen coordenadas (puede tardar unos segundos)
4. En el panel lateral podés **arrastrar** las paradas para cambiar el orden de visita. Cada fila muestra la **hora programada** (ej. 09:30) junto al nombre del cliente.
5. Al soltar, el nuevo orden se **guarda automáticamente**

Los marcadores se colorean por **zona** cuando está disponible.

### 3.9 Parámetros de sistema

Menú **Parámetros** (arriba) → `/panel/parametros`

Desde acá configurás precios globales con historial de vigencia. Cada parámetro tiene su propia sección:

| Parámetro | Uso actual |
|-----------|------------|
| **Precio de bolsa extra** | Cobro en campo (regla estándar): a partir de la **3.ª bolsa llena** se suma por cada bolsa adicional |
| **Retiro reciclable mixto** | Cobro en campo **Mixto**: un solo precio que **incluye hasta 2 bolsas llenas** (1 o 2 → mismo total); desde la **3.ª**, bolsa extra |
| **Precio bolsa punto** | Cobro **Empresa + Punto**: × **bolsas nuevas vendidas** |
| **Precio bolsa llena hogar** (clave `bolsa_llena_punto`) | Cobro **Empresa + Punto**: × **bolsas llenas hogar** |

**Reglas de cobro en campo** (recolector), según datos de la parada:

| Unidad / tipo | Cómo se calcula el total |
|---------------|---------------------------|
| **Empresa** + tipo **Punto** | **(bolsas llenas hogar × bolsa llena hogar) + (bolsas nuevas vendidas × bolsa punto)**. **Bolsas llenas punto**: solo cantidad; el cobro en punto va en efectivo/transferencia/QR. Biotachos: registro |
| **Empresa** (otro tipo) | Siempre el **precio de retiro** de la planilla |
| **Mixto** (`tipo de servicio`) | **0 bolsas:** retiro de planilla · **1 o 2 bolsas:** precio **Retiro reciclable mixto** (mismo total con 1 o 2) · **3+:** ese precio + **bolsa extra** por cada bolsa desde la 3.ª |
| **Resto** (Hogar, Puntos, etc.) | Retiro de planilla; las **2 primeras** bolsas llenas incluidas; desde la **3.ª**, **bolsa extra** por bolsa |

En **todos** los parámetros de precio:

- Solo podés **agregar un precio nuevo** (no editar los anteriores)
- El anterior se cierra automáticamente al registrar uno nuevo
- Queda **historial** con fechas de vigencia y quién lo registró

#### Empresa + Punto: qué queda guardado

Para paradas con **Unidad = Empresa** y **Tipo de cliente = Punto** (en la app y en la base):

| Dónde | Qué se guarda |
|-------|----------------|
| Al importar / editar parada | Unidad, tipo, precio de planilla (`precio`), observaciones del operario |
| Al cargar en campo (recolector) | Bolsas llenas hogar, bolsas llenas punto (solo cantidad), bolsas nuevas vendidas, resto de retiro (biotachos, cestos…), total calculado, pagos, firma, **Tus observaciones** |
| Parámetros del sistema | Precio **bolsa llena hogar** y **bolsa punto** (historial global; no van en la fila del cliente) |

El **precio de la planilla** queda registrado pero el total a cobrar en Empresa + Punto se calcula con los parámetros y las cantidades que carga el recolector, no con ese precio fijo.

### 3.10 Gestión de usuarios

Menú **Usuarios** (arriba) → `/panel/usuarios`

**Crear un usuario:**

1. Completá correo, nombre, rol (Operario o Recolector) y contraseña inicial
2. Guardá
3. Compartí las credenciales de forma segura con la persona

**Cambiar contraseña de otro usuario:**

1. En la tabla de usuarios, tocá **Enviar correo para cambiar contraseña**
2. La persona recibe un enlace (si el correo está configurado) o copiá el enlace que muestra la app

**Límites del superadmin:**

- Puede crear operarios y recolectores
- Puede resetear contraseña de operarios y recolectores
- **No** puede cambiar la contraseña del superadmin desde este panel (usa recuperación por correo)

### 3.11 Tareas de configuración (una vez)

Estas tareas las hace normalmente el superadmin o alguien técnico al inicio:

| Tarea | Dónde |
|-------|-------|
| Crear cuenta superadmin en Supabase | Dashboard Supabase |
| Configurar planilla Google Sheets | Ver sección 6 |
| Configurar mapas de Google | Documentación técnica interna |
| Crear operarios y recolectores | Usuarios en la app |
| Definir precios del sistema | Parámetros en la app (bolsa extra, mixto, bolsa punto, etc.) |

---

## 4. Operario (admin)

El operario usa el **mismo panel operativo** que el superadmin para seguir rutas, editar paradas y ver mapas.

### 4.1 Día a día

1. **Ingresá** al panel operativo (`/panel` → menú **Operativo**)
2. Revisá la tabla de **Rutas** (scroll interno si hay muchas jornadas)
3. **Completar** la **Preparación de insumos** de cada ruta activa (obligatorio antes de que el recolector inicie)
4. **Seleccioná una ruta** para ver sus recolecciones abajo (también con scroll si hay muchas paradas)
5. **Ver detalle** (ruta): desglose por unidad/tipo + recaudación
6. **Ver detalle** (parada): retiro y cobro cuando ya fue visitada o cancelada
7. **Ver mapa** para reordenar paradas (cada fila muestra la hora programada)
8. Seguí el avance cuando el recolector carga en campo
9. Cuando finaliza, la ruta pasa a **Historial** → **Cierre operario** o **Reactivar** si hace falta
10. **Historial** o **KPIs** para reportes; exportá CSV si necesitás Excel
11. **Parámetros** cuando cambien precios

### 4.2 Historial y KPIs

- **Historial:** rutas realizadas, cerradas o canceladas; **Cierre operario** y **Reactivar** en la tabla; **Descargar historial (CSV)** incluye ambos montos por ruta
- **KPIs:** indicadores **solo del historial** en el período; usá **Desde/Hasta** para el rango; el gráfico mensual muestra siempre los últimos meses (sin depender del filtro); **Descargar KPIs (CSV)**

### 4.3 Cierre operario y reactivar

Ambas acciones están en **Historial** (columna **Acciones**), no en Operativo:

- **Cierre operario:** solo en rutas **Realizadas** (recolector ya finalizó)
- **Reactivar:** solo en rutas **Realizadas**; vuelven a **En proceso** en Operativo. Se borran los datos de cierre del recolector para que pueda volver a finalizar

### 4.4 Parámetros de precio

Menú **Parámetros** → cuatro bloques independientes (cada uno con precio vigente, formulario de alta e historial). Actualizá cuando cambien valores de negocio; el recolector usa automáticamente los vigentes en el cobro (bolsa extra y retiro mixto).

### 4.5 Editar una ruta

Desde **Editar** en la tabla de rutas podés modificar:

- Nombre de la ruta
- Fecha
- Turno (Mañana / Tarde)
- Estado
- Recolector asignado
- Observaciones del operario
- Kilómetros recorridos (cuando corresponda)

### 4.6 Editar o agregar una recolección (servicio)

Desde la tabla de recolecciones:

- **Editar:** cambiar dirección, cliente, hora, observaciones, teléfono, etc.
- **Agregar:** crear una parada nueva en la ruta seleccionada
- **Eliminar:** quitar una parada incorrecta

Al **crear** o **editar** una recolección manual, además de los datos básicos podés completar:

| Campo | Descripción |
|-------|-------------|
| **Tipo de cliente** | Desplegable: Reciclaje, Mixto, Orgánico, **Punto** (define reglas de cobro con Unidad) |
| **Unidad** | Hogar, Empresa o Puntos |
| **Frecuencia** | Frecuencia del servicio |
| **Precio** | Precio de retiro (base para el cobro en campo) |
| **Deuda** | Deuda pendiente del cliente, si aplica |

> **Rutas Realizadas o Cerradas:** no se pueden agregar recolecciones nuevas. El botón **+ Agregar recolección** queda deshabilitado y muestra el motivo.

### 4.7 Gestión de usuarios (solo recolectores)

El operario puede:

- ✅ Crear cuentas de **recolector**
- ✅ Enviar reset de contraseña a recolectores
- ❌ **No** puede crear otros operarios
- ❌ **No** puede resetear contraseñas de operarios

Menú **Usuarios** → mismo flujo que superadmin pero con rol Recolector únicamente.

---

## 5. Recolector

La interfaz del recolector está pensada para el **celular**: pantalla angosta, botones grandes, navegación inferior.

### 5.1 Navegación

Barra inferior con dos pestañas:

| Pestaña | Contenido |
|---------|-----------|
| **Inicio** | Saludo + rutas de **hoy** (Activas / Completadas) o, si no hay de hoy, la **Última jornada** |
| **Mis rutas** | Todas tus rutas, agrupadas en **Activas** y **Completadas** |

Dentro de cada sección, las rutas se ordenan por fecha (más recientes arriba). En cada tarjeta ves fecha, turno y estado.

### 5.2 Ver una ruta

1. Tocá una tarjeta de ruta
2. Entrás al **Detalle de ruta** con:
   - Turno, fecha, estado
   - **Insumos asignados** (preparación del operario), cuando ya está completa
   - Efectivo recaudado (si hay cargas)
   - Km iniciales e **Insumos declarados** (después de iniciar)
   - Botones **Maps** (recorrido), **Avisar** (WhatsApp, tras iniciar) e **Inicio de ruta**
   - Lista de **recolecciones** en orden (cada una con su botón **Maps**)

### 5.3 Iniciar la ruta (obligatorio antes de cargar paradas)

**Requisito previo:** el operario debe haber completado la **Preparación de insumos** en el panel operativo. Si falta, verás un aviso y **Inicio de ruta** estará deshabilitado; en el detalle aparecerán los **Insumos asignados** cuando el operario los cargue.

1. En el detalle, tocá **Inicio de ruta**
2. Completá:
   - **Kilómetros iniciales** del odómetro (número mayor a 0)
   - **Insumos** que llevás (al menos uno):
     - Tipos disponibles: Bolsa Nueva, Cesto, Biotacho, Bolsa de Punto, Planilla Empresas, Planilla de Punto, Cartel Empresa
     - Elegí tipo + cantidad → **Agregar** (podés agregar hasta 20 ítems)
3. Tocá **Confirmar inicio de ruta**
4. Volvés al detalle con la ruta en estado **En proceso**

> Hasta que no iniciés la ruta, las paradas solo se pueden **ver** (preview), no cargar.

### 5.4 Maps y avisos por WhatsApp

#### Maps — toda la ruta

En el detalle de ruta, tocá **Maps** (al lado de **Avisar**). Se abre Google Maps con un recorrido **desde tu ubicación actual** hacia las paradas que te faltan, **en el orden de la ruta**.

Google Maps pedirá permiso de ubicación si aún no lo diste; el primer punto del recorrido es **donde estás vos** (punto de partida del día).

Solo entran paradas **pendientes** o **en camino**. Las visitadas, canceladas u omitidas no se incluyen. Si visitaste paradas fuera de orden (por ejemplo la 1, 2 y 7), Maps sigue mostrando las que faltan en medio (3, 4, 5, 6) y cualquier otra abierta que venga después.

Si no queda ninguna parada abierta, el botón Maps queda deshabilitado.

No requiere configuración extra: usa la app de Maps del teléfono.

#### Maps — una parada

En cada fila de la lista hay un botón **Maps** que abre la navegación **desde tu ubicación actual** hasta **solo esa dirección** (coordenadas si están cargadas; si no, la dirección escrita). Sirve para ir a un cliente puntual sin armar el recorrido completo.

#### Avisar clientes (WhatsApp)

Después de **iniciar la ruta**, el botón verde **Avisar** abre WhatsApp con un mensaje prearmado para los clientes con teléfono (“Soy [tu nombre] tu recolector/a de hoy…”). Si hay varios, la app abre el primer chat y muestra **Siguiente** / **Terminar** para seguir con el resto.

El teléfono debe estar cargado en la parada (planilla o panel operario).

Si la ruta **aún no está iniciada**, al tocar una parada solo para verla (preview) podés usar **WhatsApp · teléfono** en el detalle deslizable para avisar a ese cliente.

### 5.5 Cargar una recolección (parada)

Con la ruta **iniciada**, tocá una parada de la lista → **Cargar en campo**.

#### Datos que no se pueden modificar (solo lectura)

- Dirección del cliente
- Cliente (nombre)
- Unidad y tipo de servicio (si están cargados; definen la regla de cobro)
- Hora programada
- **Obs. operario** (notas de planilla / operario; no las podés cambiar acá)

#### Tus observaciones (opcional)

Antes de firmar podés escribir **Tus observaciones** (ej. “cliente no estaba”, “portón trasero”). El operario las ve en la columna **Obs. recolector** de la tabla de paradas.

#### Dos caminos posibles

**A) Cancelación**

Si la parada no se pudo hacer:

1. Escribí el **Motivo de cancelación**
2. Completá **Nombre del firmante**
3. Pedile al cliente que **firme en el recuadro** (con el dedo)
4. Guardá → la parada queda como **Cancelada**

No hace falta completar bolsas ni pagos. Podés dejar **Tus observaciones** si querés.

**B) Recolección normal**

1. Completá los contadores de **Retiro** (podés poner **0** en cada uno):
   - Bolsas llenas (y, si aplica Empresa + Punto: bolsas llenas hogar, bolsas llenas punto, bolsas nuevas vendidas)
   - Biotachos llenos
   - Bolsas nuevas
   - Biotachos nuevos
   - **Cestos**
2. Revisá el **Precio total a cobrar** (el desglose cambia según unidad y tipo de servicio):
   - **Hogar / Puntos (estándar):** precio de retiro de la planilla; desde la **3.ª** bolsa llena, bolsa extra (Parámetros)
   - **Empresa + Punto:** el total mínimo sale de **bolsas llenas hogar** y **bolsas nuevas vendidas** (Parámetros). **Bolsas llenas punto** es solo cantidad; el monto en punto lo cargás en los pagos
   - **Empresa** (sin Punto): siempre el precio de retiro de la planilla
   - **Mixto:** con 0 bolsas, precio de retiro de la planilla; con **1 o 2** bolsas, **Retiro reciclable mixto** (mismo monto); desde la **3.ª**, se suma bolsa extra
3. Completá los **tres montos** (todos obligatorios; efectivo, transferencia y QR pueden ser **0**):
   - Monto efectivo
   - Monto transferencia
   - Monto QR
   - **La suma de los tres no puede ser menor al total a cobrar** (puede ser mayor)
4. **Nombre del firmante** (obligatorio)
5. Pedile al cliente que **firme en el recuadro** (con el dedo; podés usar **Limpiar** para repetir)
6. Tocá **Guardar recolección** → la parada queda como **Visitada**

#### Después de guardar una parada

Una vez que guardaste una parada como **Visitada** o **Cancelada**, la carga queda en **solo lectura** (no podés modificar bolsas, montos ni firma). El operario tampoco puede editarla desde el panel si la ruta ya está **Realizada** o **Cerrada**.

#### Editar una parada (solo si aún no quedó cerrada)

Mientras la ruta siga **en proceso** y la parada no fue guardada aún, podés cargar o corregir desde **Cargar en campo**.

### 5.6 Finalizar la ruta

Cuando terminaste todas las paradas del día:

1. Volvé al **Detalle de ruta**
2. Verificá que **todas** las recolecciones estén **Visitadas** o **Canceladas**
3. Tocá **Finalizar ruta** (si falta algo, el botón queda deshabilitado y aparece el **motivo** debajo)
4. Completá el **formulario de cierre**:
   - **Kilómetros finales** (obligatorio; deben ser **mayores o iguales** a los km iniciales)
   - **Descarga realizada** (casilla)
   - **Combustible**, **Descuento**, **Otros gastos** (opcionales; solo si hubo **efectivo recaudado**)
   - **Total efectivo** (se calcula automáticamente: efectivo recaudado − gastos)
   - **Observaciones** (opcional)
5. Tocá **Finalizar ruta** en el formulario

**Reglas del cierre:**

- Si la ruta **no recaudó efectivo**, no podés cargar gastos (combustible, descuento, otros)
- Los gastos **no pueden superar** el efectivo recaudado
- El **total efectivo** nunca puede quedar negativo

**Qué pasa al finalizar:**

- La ruta pasa a **Realizado** (completada en sistema)
- Ya no podés cargar ni editar paradas (solo consulta)
- La app te lleva al **Inicio** (dashboard)
- La ruta aparece en **Completadas** en Mis rutas y en **Historial** del staff (pendiente de **Cierre operario**)
- Después del cierre operario pasa a **Cerrada** en Historial

### 5.7 Resumen del flujo del recolector

```
Login
  → Mis rutas (Activas / Completadas)
    → Detalle de ruta
      → Inicio de ruta (km + insumos)     ← una vez por jornada
      → Maps (recorrido a paradas restantes)
      → Avisar (WhatsApp a clientes)      ← después de iniciar
      → Por cada parada:
          → Maps (solo esa parada)
          → Cargar en campo (retiro + cestos + cobro + firma + obs. opcional)
          → o Cancelar con motivo
      → Finalizar ruta                    ← formulario de cierre
        → Vuelta al Inicio
```

---

## 6. Planilla Google Sheets

Las rutas y paradas se cargan masivamente desde una planilla de Google. Esto lo usa normalmente el operario o superadmin, no el recolector en campo.

### Columnas principales (hoja `Rutas`)

Cada fila = una parada/cliente. Campos obligatorios:

- **Nombre**, **Direccion**, **Telefono**, **Dia** (fecha), **Hora**, **Recolector** (nombre del recolector en la app; el desplegable lo trae automáticamente)

**Valores habituales (opcionales pero recomendados):**

| Campo | Valores |
|-------|---------|
| Unidad | Hogar, Empresa, Puntos |
| Tipo de servicio / Tipo de cliente | Reciclaje, Mixto, Organico (Orgánico), **Punto** |

> **Punto** (tipo) ≠ **Puntos** (unidad). Para cobro Empresa + Punto: Unidad = **Empresa** y Tipo = **Punto**.

### Cómo se arma una ruta

La app agrupa filas automáticamente cuando comparten:

- Misma **fecha** (columna Dia)
- Mismo **turno** (Mañana si Hora entre **8:30 y 13:30**; Tarde si Hora entre **14:30 y 20:30**)
- Mismo **recolector** (nombre o email)

Si cambiás fecha, turno o recolector → es **otra ruta**.

### Estados en la planilla (automáticos)

| Estado | Significado |
|--------|-------------|
| **Pendiente** | Lista para enviar a la app |
| **Incompleto** | Faltan datos obligatorios |
| **Error** | Algún dato inválido |
| **Enviada** | Ya importada (fondo verde, no se reimporta) |

### Menú en Google Sheets

Desde el menú del script (instalado una vez):

1. **Configurar integración** — URL de la app + secreto compartido
2. **Actualizar desplegable recolectores** — trae **nombres** desde la base (si hay dos con el mismo nombre, muestra también el email)
3. **Actualizar desplegable tipos de cliente** — carga Reciclaje, Mixto, Organico, Punto en la columna Tipo de servicio / Tipo de cliente
4. **Validar todas las filas** — revisa antes de enviar
5. **Enviar pendientes a la app** — importa filas Pendiente

> El recolector **no** necesita usar la planilla: solo ve en la app lo que ya fue importado y asignado a su email.

Documentación técnica de la integración: [SHEETS_INTEGRATION.md](./SHEETS_INTEGRATION.md)

---

## 7. Problemas frecuentes

### No puedo iniciar sesión

- Verificá correo y contraseña (mayúsculas/minúsculas)
- Pedile al superadmin un **reset de contraseña**
- Si es cuenta nueva, puede que necesites confirmar el correo primero

### Soy recolector y no veo rutas

- Las rutas deben estar **asignadas a tu email** en la planilla (columna Recolector) o en el panel operario
- Verificá la **fecha** — en Inicio solo aparecen las **activas de hoy**; en Mis rutas están todas (Activas y Completadas)

### No aparece el botón Finalizar ruta / no puedo apretarlo

- Todas las paradas deben estar **Visitadas** o **Canceladas**
- La ruta debe estar **iniciada** (en proceso)
- Si el botón está deshabilitado, leé el **mensaje debajo** (ej: faltan paradas, ruta no iniciada)

### No puedo cargar gastos al finalizar

- Si la ruta **no recaudó efectivo**, los campos de gastos quedan bloqueados
- Los gastos no pueden superar el efectivo recaudado

### Kilómetros finales no me deja finalizar

- Son **obligatorios**
- Deben ser **mayores o iguales** a los km iniciales de la ruta

### No puedo agregar recolección (operario)

- Si la ruta está **Realizada** o **Cerrada**, no se pueden agregar paradas nuevas
- El botón **+ Agregar recolección** queda deshabilitado con el motivo visible

### No veo el botón Reactivar o Cierre operario

- Están en **Historial**, no en Operativo
- **Reactivar** y **Cierre operario** solo para rutas **Realizadas**

### El CSV de KPIs o Historial está vacío o incompleto

- Verificá el **rango de fechas** (KPIs) o que haya rutas en Historial
- KPIs filtra por **fecha de la ruta** y **solo incluye rutas del historial** (Realizado, Cerrada, Cancelada), no las que siguen en Operativo

### El total a cobrar no coincide con lo que esperaba (recolector / operario)

- Revisá **Unidad** (Empresa = precio fijo de planilla) y **Tipo de servicio** (Mixto = regla especial)
- Verificá que en **Parámetros** estén cargados los precios vigentes (bolsa extra, retiro reciclable mixto)
- Con **1 o 2 bolsas** en Mixto el total es el mismo; con **3+** se suma bolsa extra

### No puedo iniciar la ruta (recolector)

- El operario debe completar **Preparación de insumos** en el panel operativo (columna **Completar** → **Guardar preparación**)
- Hasta entonces verás un aviso y el botón **Inicio de ruta** dirá **Falta preparación**
- Cuando esté lista, en el detalle aparece **Insumos asignados**

### “Inicio de ruta” no guarda / error de columnas

- Avisá al equipo técnico: puede faltar la migración `insumos_operario` en Supabase (ejecutar `supabase/apply-pending-operativo.sql` en SQL Editor)
- Mientras tanto, probá cerrar sesión, volver a entrar y reintentar

### No puedo cargar una parada

- ¿Iniciaste la ruta? Sin inicio de ruta solo podés **ver** el detalle, no cargar
- Revisá que la suma de pagos **no sea menor** al total (puede ser mayor)
- Si cancelás, solo necesitás motivo + firmante + firma

### No veo retiro ni cobro en una parada (operario)

- En **Operativo**, usá el botón **Ver detalle** en la columna **Detalle** (no confundir con **Ver detalle** de la ruta)
- El botón solo se habilita cuando la parada está **Visitada** o **Cancelada**
- Si está **Pendiente**, el recolector aún no cargó la parada

### Maps me salta paradas que no visité (recolector)

- El recorrido incluye **todas** las paradas abiertas en el **orden de la ruta**, aunque hayas visitado otras más adelante
- Si falta una parada, recargá el detalle de la ruta (la lista se arma al abrir la pantalla)

### No veo todas las rutas o paradas en pantalla (operario)

- En **Operativo** e **Historial**, las tablas de rutas y recolecciones tienen **altura fija**: desplazate **dentro de la tabla** (rueda del mouse, trackpad o barra de scroll del recuadro)
- Los **encabezados** de columna quedan fijos al bajar; al pie ves cuántas filas hay
- En Historial, las columnas Fecha / Recolector / Turno quedan fijas al desplazarte **horizontalmente**

### El mapa del operario no carga

- Puede faltar configuración de Google Maps (tarea del equipo técnico)
- Sin mapa igual podés ver y editar recolecciones en las tablas

### La planilla no importa filas

- Ejecutá **Validar todas las filas** y corregí errores en rojo
- Verificá que el **nombre** (o email) del Recolector exista en la app — usá **Actualizar desplegable recolectores**
- Las filas **Enviada** (verde) no se reimportan — creá fila nueva si hace falta

### No veo el botón Completar / error al guardar preparación (operario)

- Ejecutá en Supabase el SQL de `supabase/apply-pending-operativo.sql` (o pedile al equipo técnico)
- No podés editar la preparación si el recolector **ya inició** la ruta

### Maps del recolector no abre direcciones

- Verificá que las paradas tengan **dirección** cargada
- El botón **Maps** de la ruta se deshabilita si no quedan paradas abiertas (todas visitadas, canceladas u omitidas)
- El recorrido incluye **todas** las paradas abiertas en orden de ruta, aunque hayas visitado otras más adelante
- Probá con conexión a internet activa

---

## Glosario rápido

| Término | Significado |
|---------|-------------|
| **Ruta** | Jornada de un recolector en una fecha y turno, con N paradas |
| **Recolección / servicio / parada** | Visita a un cliente en una ruta (misma cosa en la UI) |
| **Preparación de insumos** | Formulario del operario con los insumos que debe llevar el recolector; obligatorio antes del inicio |
| **Insumos asignados** | Lo que cargó el operario en la preparación (visible para el recolector) |
| **Insumos declarados** | Lo que el recolector confirma al **iniciar** la ruta (km + insumos) |
| **Ver detalle (ruta)** | Popup con desglose de paradas por unidad/tipo y recaudación |
| **Ver detalle (parada)** | Popup con retiro (bolsas/biotachos/**cestos**) y cobro (efectivo/transferencia/QR) |
| **Obs. recolector** | Notas opcionales que escribe el recolector al cargar la parada |
| **Obs. operario** | Notas de planilla o del operario al crear/editar la parada |
| **Turno** | Mañana (**8:30–13:30**) o Tarde (**14:30–20:30**); define en qué ruta cae cada parada |
| **Realizado** | Recolector finalizó; la ruta está en **Historial** hasta cierre operario |
| **Cerrada** | Cierre operario hecho; la ruta está en Historial |
| **Cierre operario** | Acción del staff en Historial que archiva una ruta Realizada |
| **Pendiente cierre** | KPI: ruta Realizada en historial sin cierre operario aún |
| **Inicio de ruta** | Registro de km y insumos al comenzar la jornada |
| **Finalizar ruta** | Cierre de la jornada con formulario (km finales, gastos, observaciones) |
| **Cierre del recolector** | Datos que el recolector completa al finalizar |
| **KPIs** | Indicadores agregados por período (staff); solo rutas del historial |
| **Monto a recaudar** | Monto total por servicios prestados (suma de precios en visitadas) |
| **Total recaudado** | Monto real recaudado (pagos en campo: efectivo + transferencia + QR) |
| **Unidad** | Hogar, Empresa o Puntos (planilla); en Empresa el cobro no varía por bolsas llenas |
| **Tipo de cliente** | Reciclaje, Mixto, Orgánico o **Punto** (desplegable al editar). **Punto** con Unidad Empresa → cobro especial |
| **Empresa + Punto** | En base: Unidad `Empresa` + Tipo `Punto`; retiro en campo con bolsas hogar / punto / vendidas |
| **Obs. operario** | Columna `observaciones` — planilla o panel operario |
| **Obs. recolector** | Columna `observaciones_recolector` — al guardar carga en campo |
| **Cestos** | Columna `cestos` — cantidad retirada en campo |
| **Bolsa extra** | Precio en Parámetros; desde la 3.ª bolsa llena (regla estándar o Mixto con 3+) |
| **Retiro reciclable mixto** | Precio en Parámetros; base del cobro Mixto con 1–2 bolsas llenas |
| **Bolsa punto / bolsa llena punto** | Precios en Parámetros (configurables; uso en app según se habilite) |
| **Carga en campo** | Datos que el recolector carga en cada parada |
| **Operario** | Persona de backoffice que supervisa y edita rutas |
| **Superadmin** | Administrador principal con acceso total |

---

*Manual actualizado a junio 2026. Para detalles técnicos, ver [GUIA_DESARROLLADORES.md](./GUIA_DESARROLLADORES.md).*
