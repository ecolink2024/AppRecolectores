/**
 * App Recolectores — Planilla de rutas y recolecciones
 *
 * Hoja "Rutas" — fila 1 = encabezados (ver SHEETS_INTEGRATION.md)
 *
 * Menú: App Recolectores
 * - Validar todas las filas
 * - Enviar pendientes a la app
 * - Configurar integración
 * - Actualizar desplegable recolectores
 */

const CONFIG = {
  HOJA: "Rutas",
  COL: {
    ZONA: "Zona",
    NOMBRE: "Nombre",
    UNIDAD: "Unidad",
    TIPO_SERVICIO: "Tipo de servicio",
    FRECUENCIA: "Frecuencia",
    BARRIO: "Barrio",
    DIRECCION: "Direccion",
    DEPTO: "Depto",
    TELEFONO: "Telefono*",
    OBSERVACIONES: "Observaciones",
    DIA: "Dia",
    HORA: "Hora",
    NOTA_ENCARGADO: "Nota encargado",
    PRECIO: "Precio",
    DEUDA: "Deuda",
    RECOLECTOR: "Recolector",
    ESTADO: "Estado",
    MENSAJE: "MensajeSistema",
  },
  UNIDADES: ["Hogar", "Empresa", "Puntos"],
  TIPOS_SERVICIO: ["Reciclaje", "Mixto", "Organico", "Punto"],
  FRECUENCIAS: ["Mensual", "Puntual", "Semanal"],
  COLOR_PENDIENTE: "#FFF9C4",
  COLOR_INCOMPLETO: "#FFCDD2",
  COLOR_ERROR: "#FFCDD2",
  COLOR_ERROR_CELDA: "#EF5350",
  COLOR_ENVIADA: "#E8F5E9",
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("App Recolectores")
    .addItem("Validar todas las filas", "validarTodas")
    .addItem("Enviar pendientes a la app", "enviarPendientes")
    .addSeparator()
    .addItem("Configurar integración", "configurarIntegracion")
    .addItem("Actualizar desplegable recolectores", "actualizarDesplegableRecolectores")
    .addItem("Actualizar desplegable tipos de cliente", "actualizarDesplegableTiposCliente")
    .addToUi();
}

function configurarIntegracion() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const urlResponse = ui.prompt(
    "URL de la app",
    "https://app-recolectores.vercel.app",
    ui.ButtonSet.OK_CANCEL,
  );
  if (urlResponse.getSelectedButton() !== ui.Button.OK) return;

  const secretResponse = ui.prompt(
    "Secreto (SHEETS_IMPORT_SECRET)",
    "Mismo valor que en Vercel",
    ui.ButtonSet.OK_CANCEL,
  );
  if (secretResponse.getSelectedButton() !== ui.Button.OK) return;

  const apiUrl = normalizarApiUrl_(urlResponse.getResponseText());
  const apiSecret = secretResponse.getResponseText().trim();

  if (!apiUrl || !apiSecret) {
    ui.alert("Completá URL y secreto.");
    return;
  }

  props.setProperties({ API_URL: apiUrl, API_SECRET: apiSecret });
  ui.alert("Guardado.\nURL: " + apiUrl);
}

function normalizarApiUrl_(raw) {
  let url = String(raw || "").trim();
  if (!url) return "";
  if (url.indexOf("http") !== 0) url = "https://" + url;
  url = url.replace(/^http:\/\//i, "https://");
  return url.replace(/\/+$/, "").replace(/\/login$/i, "").replace(/\/panel.*/i, "");
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJA);
  if (!sheet) {
    throw new Error('Falta la hoja "' + CONFIG.HOJA + '"');
  }
  return sheet;
}

function getColumnMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach(function (h, i) {
    const key = normalizar_(String(h || ""));
    map[key] = i + 1;
  });
  return map;
}

function colIndex_(map, names) {
  for (let i = 0; i < names.length; i++) {
    const k = normalizar_(names[i]);
    if (map[k]) return map[k];
  }
  return 0;
}

function normalizar_(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*/g, "");
}

function validarTodas() {
  const sheet = getSheet_();
  const map = getColumnMap_(sheet);
  const recolectores = cargarRecolectoresLookup_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("No hay filas de datos.");
    return;
  }

  const cols = getCols_(map);
  for (let r = 2; r <= lastRow; r++) {
    const estadoActual = String(sheet.getRange(r, cols.estado).getValue() || "").trim();
    if (estadoActual === "Enviada") continue;

    const row = leerFila_(sheet, r, cols);
    if (filaVacia_(row)) continue;

    const result = validarFila_(row, recolectores);
    aplicarResultadoFila_(sheet, r, cols, result);
  }

  SpreadsheetApp.getUi().alert("Validación completada.");
}

function enviarPendientes() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty("API_URL");
  const apiSecret = props.getProperty("API_SECRET");
  if (!apiUrl || !apiSecret) {
    SpreadsheetApp.getUi().alert("Configurá la integración primero.");
    return;
  }

  validarTodas();

  const sheet = getSheet_();
  const map = getColumnMap_(sheet);
  const cols = getCols_(map);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recolectores = cargarRecolectoresLookup_();
  const pendientes = [];

  for (let r = 2; r <= sheet.getLastRow(); r++) {
    const estado = String(sheet.getRange(r, cols.estado).getValue() || "").trim();
    if (estado !== "Pendiente") continue;

    const row = leerFila_(sheet, r, cols);
    if (filaVacia_(row)) continue;

    const result = validarFila_(row, recolectores);
    if (result.estado !== "Pendiente" || !result.payload) continue;
    pendientes.push(result.payload);
  }

  if (pendientes.length === 0) {
    SpreadsheetApp.getUi().alert("No hay filas en estado Pendiente para enviar.");
    return;
  }

  const payload = {
    spreadsheet_id: ss.getId(),
    spreadsheet_url: ss.getUrl(),
    sheet_name: sheet.getName(),
    recolecciones: pendientes,
  };

  const response = UrlFetchApp.fetch(
    apiUrl + "/api/integrations/sheets/import-recolecciones",
    {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + apiSecret },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      followRedirects: false,
    },
  );

  const status = response.getResponseCode();
  const text = response.getContentText();
  let body;
  try {
    body = JSON.parse(text);
  } catch (e) {
    SpreadsheetApp.getUi().alert("Error " + status + ": respuesta inválida");
    return;
  }

  if (status >= 400 || body.ok === false) {
    let msg = body.error || "Error " + status;
    if (body.details) msg += "\n- " + body.details.join("\n- ");
    SpreadsheetApp.getUi().alert(msg);
    return;
  }

  for (let i = 0; i < pendientes.length; i++) {
    const fila = pendientes[i].fila;
    sheet.getRange(fila, cols.estado).setValue("Enviada");
    sheet.getRange(fila, cols.mensaje).setValue("");
    sheet.getRange(fila, 1, 1, sheet.getLastColumn()).setBackground(CONFIG.COLOR_ENVIADA);
  }

  let msg = body.message || "Importación OK";
  if (body.rejected && body.rejected.length) {
    msg += "\n\nRechazadas:\n- " + body.rejected.join("\n- ");
  }
  SpreadsheetApp.getUi().alert(msg);
}

function actualizarDesplegableRecolectores() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty("API_URL");
  const apiSecret = props.getProperty("API_SECRET");
  if (!apiUrl || !apiSecret) {
    SpreadsheetApp.getUi().alert("Configurá la integración primero.");
    return;
  }

  const response = UrlFetchApp.fetch(
    apiUrl + "/api/integrations/sheets/import-recolecciones",
    {
      method: "get",
      headers: { Authorization: "Bearer " + apiSecret },
      muteHttpExceptions: true,
    },
  );

  const body = JSON.parse(response.getContentText());
  if (response.getResponseCode() >= 400) {
    SpreadsheetApp.getUi().alert(body.error || "Error al cargar recolectores");
    return;
  }

  const lookup = buildRecolectoresLookup_(body.recolectores || []);
  const labels = lookup.labels;
  if (labels.length === 0) {
    SpreadsheetApp.getUi().alert("No hay recolectores en la base.");
    return;
  }

  const sheet = getSheet_();
  const map = getColumnMap_(sheet);
  const col = colIndex_(map, [CONFIG.COL.RECOLECTOR, "Recolector"]);
  if (!col) {
    SpreadsheetApp.getUi().alert('Falta columna "Recolector"');
    return;
  }

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(labels, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, col, Math.max(sheet.getLastRow(), 100), 1).setDataValidation(rule);
  SpreadsheetApp.getUi().alert("Desplegable actualizado (" + labels.length + " recolectores por nombre).");
}

function actualizarDesplegableTiposCliente() {
  const sheet = getSheet_();
  const map = getColumnMap_(sheet);
  const col = colIndex_(map, [CONFIG.COL.TIPO_SERVICIO, "Tipo de servicio", "Tipo de cliente"]);
  if (!col) {
    SpreadsheetApp.getUi().alert('Falta columna "Tipo de servicio" o "Tipo de cliente"');
    return;
  }

  aplicarDesplegableLista_(sheet, col, CONFIG.TIPOS_SERVICIO);
  SpreadsheetApp.getUi().alert(
    "Desplegable de tipos de cliente actualizado: " + CONFIG.TIPOS_SERVICIO.join(", "),
  );
}

function aplicarDesplegableLista_(sheet, col, values) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, col, Math.max(sheet.getLastRow(), 100), 1).setDataValidation(rule);
}

/** Índice nombre/email → email canónico (misma lógica que la API). */
function buildRecolectoresLookup_(recolectores) {
  var byKey = {};
  var emails = {};
  var labels = [];
  var nameCounts = {};
  var items = recolectores || [];

  items.forEach(function (r) {
    var email = String(r.email || "").trim().toLowerCase();
    var nombre = String(r.nombre || r.email || "").trim();
    if (!email) return;
    emails[email] = true;
    var nameKey = normalizar_(nombre);
    nameCounts[nameKey] = (nameCounts[nameKey] || 0) + 1;
    r._email = email;
    r._nombre = nombre;
  });

  items.forEach(function (r) {
    var email = r._email;
    var nombre = r._nombre;
    if (!email) return;
    byKey[normalizar_(email)] = email;
    var nameKey = normalizar_(nombre);
    var label = nameCounts[nameKey] > 1 ? nombre + " (" + email + ")" : nombre;
    byKey[normalizar_(label)] = email;
    if (nameCounts[nameKey] === 1) {
      byKey[nameKey] = email;
    }
    labels.push(label);
  });

  return {
    labels: labels,
    resolve: function (raw) {
      var s = String(raw || "").trim();
      if (!s) return null;
      var key = normalizar_(s);
      if (byKey[key]) return byKey[key];
      var lower = s.toLowerCase();
      if (emails[lower]) return lower;
      return null;
    },
  };
}

function cargarRecolectoresLookup_() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty("API_URL");
  const apiSecret = props.getProperty("API_SECRET");
  if (!apiUrl || !apiSecret) return {};

  try {
    const response = UrlFetchApp.fetch(
      apiUrl + "/api/integrations/sheets/import-recolecciones",
      {
        method: "get",
        headers: { Authorization: "Bearer " + apiSecret },
        muteHttpExceptions: true,
      },
    );
    const body = JSON.parse(response.getContentText());
    return buildRecolectoresLookup_(body.recolectores || []);
  } catch (e) {
    return buildRecolectoresLookup_([]);
  }
}

function getCols_(map) {
  return {
    zona: colIndex_(map, [CONFIG.COL.ZONA]),
    nombre: colIndex_(map, [CONFIG.COL.NOMBRE]),
    unidad: colIndex_(map, [CONFIG.COL.UNIDAD]),
    tipo: colIndex_(map, [CONFIG.COL.TIPO_SERVICIO, "Tipo de servicio", "Tipo de cliente"]),
    frecuencia: colIndex_(map, [CONFIG.COL.FRECUENCIA]),
    barrio: colIndex_(map, [CONFIG.COL.BARRIO]),
    direccion: colIndex_(map, [CONFIG.COL.DIRECCION, "Dirección"]),
    depto: colIndex_(map, [CONFIG.COL.DEPTO]),
    telefono: colIndex_(map, [CONFIG.COL.TELEFONO, "Telefono", "Teléfono"]),
    observaciones: colIndex_(map, [CONFIG.COL.OBSERVACIONES]),
    dia: colIndex_(map, [CONFIG.COL.DIA, "Día"]),
    hora: colIndex_(map, [CONFIG.COL.HORA]),
    nota: colIndex_(map, [CONFIG.COL.NOTA_ENCARGADO, "Nota encargado"]),
    precio: colIndex_(map, [CONFIG.COL.PRECIO]),
    deuda: colIndex_(map, [CONFIG.COL.DEUDA]),
    recolector: colIndex_(map, [CONFIG.COL.RECOLECTOR]),
    estado: colIndex_(map, [CONFIG.COL.ESTADO]),
    mensaje: colIndex_(map, [CONFIG.COL.MENSAJE, "Mensaje Sistema"]),
  };
}

function leerFila_(sheet, row, cols) {
  function cell(c) {
    if (!c) return "";
    const v = sheet.getRange(row, c).getValue();
    if (cols.depto === c && v instanceof Date) {
      return String(v);
    }
    return v;
  }
  return {
    fila: row,
    zona: cell(cols.zona),
    nombre: cell(cols.nombre),
    unidad: cell(cols.unidad),
    tipo_servicio: cell(cols.tipo),
    frecuencia: cell(cols.frecuencia),
    barrio: cell(cols.barrio),
    direccion: cell(cols.direccion),
    depto: cell(cols.depto),
    telefono: cell(cols.telefono),
    observaciones: cell(cols.observaciones),
    dia: cell(cols.dia),
    hora: cell(cols.hora),
    nota_encargado: cell(cols.nota),
    precio: cell(cols.precio),
    deuda: cell(cols.deuda),
    recolector: cell(cols.recolector),
  };
}

function filaVacia_(row) {
  return (
    !String(row.nombre || "").trim() &&
    !String(row.direccion || "").trim() &&
    !String(row.recolector || "").trim()
  );
}

function validarFila_(row, recolectoresLookup) {
  const errors = [];
  const missing = [];
  const errorFields = {};

  const nombre = String(row.nombre || "").trim();
  const direccion = String(row.direccion || "").trim();
  const recolectorRaw = String(row.recolector || "").trim();
  const recolectorEmail = recolectoresLookup.resolve(recolectorRaw);

  if (!nombre) missing.push("Nombre");
  else if (nombre.length > 150) addErr_(errors, errorFields, "nombre", "Nombre (muy largo (>150))");

  if (!direccion) missing.push("Direccion");
  else if (direccion.length > 255) addErr_(errors, errorFields, "direccion", "Direccion (muy largo (>255))");

  const zona = String(row.zona || "").trim();
  if (zona && zona.length > 10) addErr_(errors, errorFields, "zona", "Zona (muy largo (>10))");

  validarEnum_(row.unidad, CONFIG.UNIDADES, 100, "Unidad", errors, errorFields, "unidad");
  validarTipoServicio_(row.tipo_servicio, errors, errorFields);
  validarEnum_(row.frecuencia, CONFIG.FRECUENCIAS, 50, "Frecuencia", errors, errorFields, "frecuencia");

  const barrio = String(row.barrio || "").trim();
  if (barrio && barrio.length > 100) addErr_(errors, errorFields, "barrio", "Barrio (muy largo (>100))");

  const depto = String(row.depto || "").trim();
  if (depto && depto.length > 50) addErr_(errors, errorFields, "depto", "Depto (muy largo (>50))");

  let telefonoNorm = "";
  const telRaw = String(row.telefono || "").trim();
  if (!telRaw) missing.push("Telefono");
  else {
    const tel = normalizarTelefono_(telRaw);
    if (!tel.ok) addErr_(errors, errorFields, "telefono", tel.error);
    else telefonoNorm = tel.value;
  }

  const dia = parseDia_(row.dia);
  if (!dia.ok) {
    if (!String(row.dia || "").trim()) missing.push("Dia");
    else addErr_(errors, errorFields, "dia", dia.error);
  }

  const hora = parseHora_(row.hora);
  if (!hora.ok) {
    if (!String(row.hora || "").trim()) missing.push("Hora");
    else addErr_(errors, errorFields, "hora", hora.error);
  }

  if (!recolectorRaw) missing.push("Recolector");
  else if (!recolectorEmail) addErr_(errors, errorFields, "recolector", "Recolector (no existe en la base)");

  const precio = parsePrecio_(row.precio);
  if (!precio.ok) addErr_(errors, errorFields, "precio", precio.error);

  let estado = "Pendiente";
  const parts = [];
  if (errors.length) {
    estado = "Error";
    parts.push(errors.map(function (e) { return "❌ Error: " + e; }).join(" · "));
  }
  if (missing.length) {
    if (estado !== "Error") estado = "Incompleto";
    parts.push("⚠️ Falta: " + missing.join(", "));
  }

  let payload = null;
  if (estado === "Pendiente") {
    payload = {
      fila: row.fila,
      zona: zona || null,
      nombre: nombre,
      unidad: matchEnum_(String(row.unidad || "").trim(), CONFIG.UNIDADES),
      tipo_servicio: parseTipoServicio_(String(row.tipo_servicio || "").trim()),
      frecuencia: matchEnum_(String(row.frecuencia || "").trim(), CONFIG.FRECUENCIAS),
      barrio: barrio || null,
      direccion: direccion,
      depto: depto || null,
      telefono: telRaw || null,
      telefono_normalizado: telefonoNorm,
      observaciones: String(row.observaciones || "").trim() || null,
      dia: dia.value,
      hora: hora.value,
      nota_encargado: String(row.nota_encargado || "").trim() || null,
      precio: precio.value,
      deuda: String(row.deuda || "").trim() || null,
      recolector_email: recolectorEmail,
      turno: hora.turno,
    };
  }

  return {
    estado: estado,
    mensaje: parts.join(" · "),
    errorFields: errorFields,
    payload: payload,
  };
}

function addErr_(errors, errorFields, field, msg) {
  errors.push(msg);
  errorFields[field] = true;
}

function validarEnum_(value, allowed, maxLen, label, errors, errorFields, field) {
  const v = String(value || "").trim();
  if (!v) return;
  if (v.length > maxLen) addErr_(errors, errorFields, field, label + " (muy largo (>" + maxLen + "))");
  if (!matchEnum_(v, allowed)) addErr_(errors, errorFields, field, label + " (valor inválido)");
}

/** Unidad = Puntos; tipo de servicio = Punto (no confundir). */
function validarTipoServicio_(value, errors, errorFields) {
  const raw = String(value || "").trim();
  if (!raw) return;
  if (raw.length > 50) addErr_(errors, errorFields, "tipo", "Tipo de servicio (muy largo (>50))");
  if (!parseTipoServicio_(raw)) {
    addErr_(
      errors,
      errorFields,
      "tipo",
      'Tipo de servicio (valor inválido: "' +
        raw +
        '"; use Reciclaje, Mixto, Organico o Punto)',
    );
  }
}

function parseTipoServicio_(value) {
  const v = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!v) return null;
  const lower = v.toLowerCase();
  if (lower === "punto" || lower === "puntos") return "Punto";
  return matchEnum_(v, CONFIG.TIPOS_SERVICIO);
}

function matchEnum_(value, allowed) {
  if (!value) return null;
  for (let i = 0; i < allowed.length; i++) {
    if (allowed[i].toLowerCase() === value.toLowerCase()) return allowed[i];
  }
  return null;
}

function normalizarTelefono_(raw) {
  let v = String(raw || "").trim().replace(/[\s\-().]/g, "");
  if (!v) return { ok: false, error: "Telefono (vacío)" };
  if (v.indexOf("00") === 0) v = "+" + v.slice(2);
  if (v.indexOf("54") === 0 && v.indexOf("+") !== 0) v = "+" + v;
  if (/^\d{10,11}$/.test(v)) v = "+54" + v;
  if (v.length > 30) return { ok: false, error: "Telefono (muy largo (>30))" };
  if (!/^\+54/.test(v)) return { ok: false, error: "Telefono (formato argentino inválido)" };
  return { ok: true, value: v };
}

function parseDia_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return { ok: true, value: Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd") };
  }
  const s = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { ok: false, error: "Dia (formato YYYY-MM-DD)" };
  return { ok: true, value: s };
}

function parseHora_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    const h = value.getHours();
    const m = value.getMinutes();
    const s = value.getSeconds();
    const fmt = pad2_(h) + ":" + pad2_(m) + ":" + pad2_(s);
    const turno = turnoFromHoraParts_(h, m);
    if (!turno) return { ok: false, error: "Hora fuera de turno (mañana 8:30–13:30, tarde 14:30–20:30)" };
    return { ok: true, value: fmt, turno: turno };
  }
  const raw = String(value || "").trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return { ok: false, error: "Hora (formato hora inválido)" };
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3] || 0);
  if (hh > 23 || mm > 59 || ss > 59) return { ok: false, error: "Hora (formato hora inválido)" };
  const fmt = pad2_(hh) + ":" + pad2_(mm) + ":" + pad2_(ss);
  const turno = turnoFromHoraParts_(hh, mm);
  if (!turno) return { ok: false, error: "Hora fuera de turno (mañana 8:30–13:30, tarde 14:30–20:30)" };
  return { ok: true, value: fmt, turno: turno };
}

/** Mañana 8:30–13:30; tarde 14:30–20:30 (hora local). */
function turnoFromHoraParts_(hh, mm) {
  const min = hh * 60 + mm;
  if (min >= 8 * 60 + 30 && min <= 13 * 60 + 30) return "manana";
  if (min >= 14 * 60 + 30 && min <= 20 * 60 + 30) return "tarde";
  return null;
}

function pad2_(n) {
  return n < 10 ? "0" + n : String(n);
}

function parsePrecio_(value) {
  if (value === "" || value === null || value === undefined) return { ok: true, value: null };
  if (typeof value === "number") {
    if (value < 0) return { ok: false, error: "Precio (negativo)" };
    return { ok: true, value: String(value) };
  }
  const s = String(value).trim();
  if (s.length > 50) return { ok: false, error: "Precio (muy largo (>50))" };
  const n = Number(s.replace(",", "."));
  if (!isNaN(n) && n < 0) return { ok: false, error: "Precio (negativo)" };
  return { ok: true, value: s };
}

function aplicarResultadoFila_(sheet, row, cols, result) {
  const lastCol = sheet.getLastColumn();
  const range = sheet.getRange(row, 1, 1, lastCol);

  if (result.estado === "Pendiente") {
    range.setBackground(CONFIG.COLOR_PENDIENTE);
  } else if (result.estado === "Incompleto") {
    range.setBackground(CONFIG.COLOR_INCOMPLETO);
  } else {
    range.setBackground(CONFIG.COLOR_ERROR);
  }

  if (cols.estado) sheet.getRange(row, cols.estado).setValue(result.estado);
  if (cols.mensaje) sheet.getRange(row, cols.mensaje).setValue(result.mensaje);

  const fieldCol = {
    zona: cols.zona,
    nombre: cols.nombre,
    unidad: cols.unidad,
    tipo: cols.tipo,
    frecuencia: cols.frecuencia,
    barrio: cols.barrio,
    direccion: cols.direccion,
    depto: cols.depto,
    telefono: cols.telefono,
    dia: cols.dia,
    hora: cols.hora,
    precio: cols.precio,
    recolector: cols.recolector,
  };

  Object.keys(fieldCol).forEach(function (key) {
    const c = fieldCol[key];
    if (c && result.errorFields && result.errorFields[key]) {
      sheet.getRange(row, c).setBackground(CONFIG.COLOR_ERROR_CELDA);
    }
  });
}

/** Compatibilidad con botones viejos */
function importarRutas() {
  enviarPendientes();
}

function importarRutaActiva() {
  enviarPendientes();
}
