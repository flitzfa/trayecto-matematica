/* =========================================================
   Trayecto · Núcleo: constantes, utilidades y componentes
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp = window.TrayectoApp || {};

  App.PLAN = window.TRAYECTO_PLAN;
  App.STORAGE_KEY = "trayecto.academico.v1";
  App.SOURCE_FILE = "PROFESORADO MATEMATICA - PLAN DE ESTUDIOS_261031_191846.pdf";
  App.SOURCE_URL = encodeURI(App.SOURCE_FILE);

  App.STATUS_META = {
    pendiente: { label: "Pendiente", order: 0 },
    cursando: { label: "Cursando", order: 1 },
    regular: { label: "Regular", order: 2 },
    aprobada: { label: "Aprobada", order: 3 }
  };

  App.TYPE_META = {
    M: { label: "Materia", className: "materia" },
    T: { label: "Taller", className: "taller" },
    S: { label: "Seminario", className: "seminario" }
  };

  App.PERIOD_META = {
    "": "Sin período",
    "1c": "1.er cuatrimestre",
    "2c": "2.º cuatrimestre",
    anual: "Anual"
  };

  App.CORR_GROUPS = [
    {
      key: "cursarRegular",
      label: "Para cursar · regular",
      tab: "Cursar · regular",
      level: "regular",
      hint: "Materias que necesitás tener regulares o aprobadas para cursar."
    },
    {
      key: "cursarPromocion",
      label: "Para cursar · promoción",
      tab: "Cursar · promoción",
      level: "promotion",
      hint: "Materias que necesitás tener aprobadas para cursar con promoción."
    },
    {
      key: "finalRegular",
      label: "Rendir final · regular",
      tab: "Final · regular",
      level: "regular",
      hint: "Materias que necesitás tener regulares o aprobadas para rendir el final."
    },
    {
      key: "finalPromocion",
      label: "Rendir final · promoción",
      tab: "Final · promoción",
      level: "promotion",
      hint: "Materias que necesitás tener aprobadas para rendir el final."
    }
  ];

  App.ROUTES = {
    panel: { eyebrow: "Resumen", title: "Panel académico" },
    plan: { eyebrow: "Plan oficial", title: "Plan de estudios" },
    calendario: { eyebrow: "Fechas y exámenes", title: "Calendario" },
    bitacora: { eyebrow: "Notas personales", title: "Observaciones" },
    ajustes: { eyebrow: "Tu espacio", title: "Ajustes" }
  };

  App.ui = {
    route: null,
    plan: { query: "", year: "all", status: "all", type: "all" },
    calendar: { month: null },
    notesQuery: ""
  };

  App.state = null;
  App.currentSubjectId = null;
  App.currentCorrelationTab = "cursarRegular";
  App.confirmResolver = null;
  App.storageWarned = false;
  App.saveNoteTimer = null;
  App.searchTimer = null;
  App.notesTimer = null;

  /* ---------------------------------------------------------
     Utilidades básicas
     --------------------------------------------------------- */

  App.$ = function (selector, context) {
    return (context || document).querySelector(selector);
  };

  App.$$ = function (selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  };

  App.esc = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  };

  App.icon = function (name, sizeClass) {
    return (
      '<svg class="icon ' + (sizeClass || "") + '" aria-hidden="true"><use href="#icon-' +
      name + '"></use></svg>'
    );
  };

  App.uid = function (prefix) {
    var random;
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      random = window.crypto.randomUUID();
    } else {
      random = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    }
    return (prefix || "id") + "-" + random;
  };

  App.pad2 = function (number) {
    number = Number(number) || 0;
    return number < 10 ? "0" + number : String(number);
  };

  App.todayISO = function () {
    return App.toISO(new Date());
  };

  App.toISO = function (date) {
    return (
      date.getFullYear() +
      "-" +
      App.pad2(date.getMonth() + 1) +
      "-" +
      App.pad2(date.getDate())
    );
  };

  App.parseISO = function (value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    var parts = value.split("-").map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    if (
      date.getFullYear() !== parts[0] ||
      date.getMonth() !== parts[1] - 1 ||
      date.getDate() !== parts[2]
    ) {
      return null;
    }
    return date;
  };

  App.startOfDay = function (date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  App.daysBetween = function (fromISO, toISO) {
    var from = App.parseISO(fromISO);
    var to = App.parseISO(toISO);
    if (!from || !to) return 0;
    return Math.round((App.startOfDay(to) - App.startOfDay(from)) / 86400000);
  };

  App.capitalize = function (value) {
    value = String(value || "");
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  App.normalizeText = function (value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  App.plural = function (count, singular, plural) {
    return Number(count) === 1 ? singular : plural || singular + "s";
  };

  App.clamp = function (value, min, max) {
    return Math.min(max, Math.max(min, value));
  };

  App.initials = function (name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "E";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  App.yearLabel = function (year) {
    var labels = {
      1: "1.er año",
      2: "2.º año",
      3: "3.er año",
      4: "4.º año"
    };
    return labels[year] || year + ".º año";
  };

  App.yearWord = function (year) {
    var labels = {
      1: "Primer año",
      2: "Segundo año",
      3: "Tercer año",
      4: "Cuarto año"
    };
    return labels[year] || "Año " + year;
  };

  App.periodLabel = function (period) {
    return App.PERIOD_META[period] || "Sin período";
  };

  App.typeMeta = function (code) {
    return App.TYPE_META[code] || App.TYPE_META.M;
  };

  App.statusLabel = function (status) {
    return (App.STATUS_META[status] || App.STATUS_META.pendiente).label;
  };

  App.dateLong = function (value) {
    var date = typeof value === "string" ? App.parseISO(value) : value;
    if (!date || isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  App.dateShort = function (value) {
    var date = typeof value === "string" ? App.parseISO(value) : value;
    if (!date || isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "short"
    })
      .format(date)
      .replace(".", "");
  };

  App.monthShort = function (value) {
    var date = typeof value === "string" ? App.parseISO(value) : value;
    if (!date || isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-AR", { month: "short" })
      .format(date)
      .replace(".", "")
      .toUpperCase();
  };

  App.monthYear = function (date) {
    return App.capitalize(
      new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(date)
    );
  };

  App.weekdayShort = function (value) {
    var date = typeof value === "string" ? App.parseISO(value) : value;
    if (!date || isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-AR", { weekday: "short" })
      .format(date)
      .replace(".", "");
  };

  App.relativeDate = function (iso) {
    if (!iso) return "";
    var date = iso.indexOf("T") >= 0 ? new Date(iso) : App.parseISO(iso);
    if (!date || isNaN(date.getTime())) return "";
    var today = App.startOfDay(new Date());
    var day = App.startOfDay(date);
    var diff = Math.round((today - day) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    if (diff > 1 && diff < 7) return "Hace " + diff + " días";
    return App.dateShort(date);
  };

  App.countdownLabel = function (dateISO) {
    var days = App.daysBetween(App.todayISO(), dateISO);
    if (days === 0) return "Es hoy";
    if (days === 1) return "Mañana";
    if (days > 1) return "En " + days + " días";
    return "Vencido";
  };

  App.formatGrade = function (grade) {
    if (grade === null || grade === undefined || grade === "") return "—";
    var number = Number(grade);
    if (isNaN(number)) return String(grade);
    return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0$/, "");
  };

  App.typeTag = function (code) {
    var meta = App.typeMeta(code);
    return '<span class="tag tag--' + meta.className + '">' + App.esc(meta.label) + "</span>";
  };

  App.statusPill = function (status) {
    return (
      '<span class="pill pill--' + status + '"><span class="pill-dot"></span>' +
      App.esc(App.statusLabel(status)) +
      "</span>"
    );
  };

  App.eventTypeClass = function (type) {
    if (type === "Parcial") return "parcial";
    if (type === "Final") return "final";
    if (type === "Trabajo práctico") return "tp";
    return "otro";
  };

  App.eventTypeBadge = function (type) {
    return (
      '<span class="event-type event-type--' +
      App.eventTypeClass(type) +
      '">' +
      App.esc(type) +
      "</span>"
    );
  };

  App.emptyState = function (options) {
    return (
      '<div class="empty-state ' + (options.compact ? "empty-state--compact" : "") + '">' +
      '<span class="empty-icon">' + App.icon(options.icon || "spark") + "</span>" +
      "<h3>" + App.esc(options.title) + "</h3>" +
      "<p>" + App.esc(options.text) + "</p>" +
      (options.action || "") +
      "</div>"
    );
  };

  App.ringSVG = function (percent, sizeClass) {
    var circumference = 2 * Math.PI * 68;
    var offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
    return (
      '<div class="progress-ring ' + (sizeClass || "") + '">' +
      '<svg viewBox="0 0 170 170" aria-hidden="true">' +
      '<circle class="ring-track" cx="85" cy="85" r="68"></circle>' +
      '<circle class="ring-ticks" cx="85" cy="85" r="59"></circle>' +
      '<circle class="ring-value" cx="85" cy="85" r="68" style="stroke-dashoffset:' +
      offset.toFixed(2) +
      '"></circle>' +
      "</svg>" +
      '<div class="ring-center">' +
      '<span class="ring-number">' +
      Math.round(percent) +
      "<span>%</span></span>" +
      '<span class="ring-caption">del plan</span>' +
      "</div>" +
      "</div>"
    );
  };

  App.downloadFile = function (filename, content, mime) {
    var blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  };
})();
