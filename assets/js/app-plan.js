/* =========================================================
   Trayecto · Plan de estudios
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;

  function filteredSubjects() {
    var query = App.normalizeText(App.ui.plan.query);
    return App.state.subjects
      .filter(function (subject) {
        if (App.ui.plan.year !== "all" && String(subject.year) !== String(App.ui.plan.year)) {
          return false;
        }
        if (App.ui.plan.type !== "all" && subject.code !== App.ui.plan.type) return false;
        if (App.ui.plan.status === "encurso") {
          if (subject.status !== "cursando" && subject.status !== "regular") return false;
        } else if (
          App.ui.plan.status !== "all" &&
          subject.status !== App.ui.plan.status
        ) {
          return false;
        }
        if (query) {
          var haystack = App.normalizeText(
            [
              subject.name,
              subject.number,
              App.yearLabel(subject.year),
              App.typeMeta(subject.code).label,
              App.periodLabel(subject.period)
            ].join(" ")
          );
          if (haystack.indexOf(query) === -1) return false;
        }
        return true;
      })
      .sort(function (a, b) {
        if (a.year !== b.year) return a.year - b.year;
        return a.number - b.number;
      });
  }

  function statusMenu(subject) {
    var options = ["pendiente", "cursando", "regular", "aprobada"]
      .map(function (status) {
        return (
          '<button type="button" data-action="set-status" data-id="' +
          App.esc(subject.id) +
          '" data-status="' +
          status +
          '" class="' +
          (subject.status === status ? "is-current" : "") +
          '">' +
          '<span class="pill-dot" style="background:var(--status-' +
          status +
          ')"></span>' +
          App.statusLabel(status) +
          (subject.status === status ? App.icon("check", "icon--tiny") : "") +
          "</button>"
        );
      })
      .join("");

    return (
      '<details class="subject-menu status-menu">' +
      '<summary aria-label="Cambiar estado de ' +
      App.esc(subject.name) +
      '">' +
      App.icon("dots", "icon--small") +
      "</summary>" +
      '<div class="status-menu-popover">' +
      options +
      "</div>" +
      "</details>"
    );
  }

  function subjectCard(subject) {
    var corrCount = App.correlationCount(subject);
    var corrText = corrCount
      ? corrCount + " " + App.plural(corrCount, "correlativa", "correlativas")
      : "Sin correlativas";
    var yearTotal = App.getYearSubjects(subject.year).length;

    return (
      '<article class="subject-card" data-status="' +
      subject.status +
      '">' +
      '<button class="subject-card-hit" type="button" data-action="open-subject" data-id="' +
      App.esc(subject.id) +
      '" aria-label="Abrir ' +
      App.esc(subject.name) +
      '"></button>' +
      '<div class="subject-card-top">' +
      '<span class="subject-number">' +
      App.pad2(subject.number) +
      "</span>" +
      App.typeTag(subject.code) +
      (subject.official ? "" : '<span class="tag">Personalizada</span>') +
      "</div>" +
      "<h3>" +
      App.esc(subject.name) +
      "</h3>" +
      '<div class="subject-meta"><span>' +
      App.yearLabel(subject.year) +
      '</span><span class="dot-sep"></span><span>' +
      App.esc(App.periodLabel(subject.period)) +
      "</span>" +
      (subject.official
        ? ""
        : '<span class="dot-sep"></span><span>de ' + yearTotal + " espacios</span>") +
      "</div>" +
      '<div class="subject-footer">' +
      App.statusPill(subject.status) +
      '<span class="subject-correlatives">' +
      App.icon("bookmark") +
      App.esc(corrText) +
      "</span>" +
      "</div>" +
      statusMenu(subject) +
      "</article>"
    );
  }

  function yearSection(year, subjects, filtersActive) {
    var allYear = App.getYearSubjects(year);
    var stats = App.getStats(allYear);
    var countLabel = filtersActive
      ? subjects.length + " de " + allYear.length + " visibles"
      : allYear.length + " " + App.plural(allYear.length, "espacio", "espacios");

    return (
      '<section class="plan-year-section" aria-labelledby="planYear' +
      year +
      '">' +
      '<div class="plan-year-header">' +
      '<div class="plan-year-heading"><span class="plan-year-number">0' +
      year +
      "</span><h2 id=\"planYear" +
      year +
      '">' +
      App.yearWord(year) +
      "</h2></div>" +
      '<div class="plan-year-meta"><span>' +
      countLabel +
      '</span><span class="plan-year-mini-bar"><span style="width:' +
      stats.percent +
      '%"></span></span><span><strong>' +
      stats.approved +
      "</strong>/" +
      stats.total +
      " aprobadas</span></div>" +
      "</div>" +
      '<div class="subject-grid">' +
      subjects.map(subjectCard).join("") +
      "</div>" +
      "</section>"
    );
  }

  App.renderPlan = function () {
    var root = App.$("#page-plan");
    var stats = App.getStats();
    var subjects = filteredSubjects();
    var filtersActive =
      App.ui.plan.query ||
      App.ui.plan.year !== "all" ||
      App.ui.plan.status !== "all" ||
      App.ui.plan.type !== "all";

    var yearChips =
      '<button class="filter-pill ' +
      (App.ui.plan.year === "all" ? "is-active" : "") +
      '" type="button" data-action="filter-year" data-year="all">Todos · ' +
      stats.total +
      "</button>" +
      [1, 2, 3, 4]
        .map(function (year) {
          var yearStats = App.getStats(App.getYearSubjects(year));
          return (
            '<button class="filter-pill ' +
            (String(App.ui.plan.year) === String(year) ? "is-active" : "") +
            '" type="button" data-action="filter-year" data-year="' +
            year +
            '">' +
            App.yearLabel(year) +
            " · " +
            yearStats.total +
            "</button>"
          );
        })
        .join("");

    var sections = "";
    if (subjects.length) {
      var years = [1, 2, 3, 4].filter(function (year) {
        return subjects.some(function (subject) {
          return subject.year === year;
        });
      });
      sections = years
        .map(function (year) {
          return yearSection(
            year,
            subjects.filter(function (subject) {
              return subject.year === year;
            }),
            !!filtersActive
          );
        })
        .join("");
    } else {
      sections = App.emptyState({
        icon: "search",
        title: "No encontramos materias",
        text: "Probá con otro término o quitá los filtros para volver a ver el plan completo.",
        action:
          '<button class="button button--secondary" type="button" data-action="clear-plan-filters">Limpiar filtros</button>'
      });
    }

    root.innerHTML =
      '<div class="plan-intro">' +
      "<div>" +
      '<span class="section-kicker section-kicker--coral">Plan oficial · ' +
      stats.total +
      " espacios</span>" +
      "<h2>Tu mapa de materias</h2>" +
      "<p>Cuatro años para recorrer. Marcá tu estado, registrá fechas y guardá observaciones. Los períodos quedan editables porque el documento fuente no los asigna.</p>" +
      "</div>" +
      '<div class="plan-intro-actions">' +
      '<button class="button button--secondary" type="button" data-action="open-plan-info">' +
      App.icon("info", "icon--small") +
      " Sobre el plan</button>" +
      '<button class="button button--primary" type="button" data-action="add-subject">' +
      App.icon("plus", "icon--small") +
      " Agregar materia</button>" +
      "</div>" +
      "</div>" +
      '<div class="plan-toolbar">' +
      '<div class="search-field"><span>' +
      App.icon("search") +
      '</span><input id="planSearch" type="search" placeholder="Buscar por materia, número o tipo…" value="' +
      App.esc(App.ui.plan.query) +
      '" aria-label="Buscar materias"></div>' +
      '<select class="toolbar-select" id="planStatus" aria-label="Filtrar por estado">' +
      '<option value="all"' +
      (App.ui.plan.status === "all" ? " selected" : "") +
      ">Todos los estados</option>" +
      '<option value="pendiente"' +
      (App.ui.plan.status === "pendiente" ? " selected" : "") +
      ">Pendientes</option>" +
      '<option value="encurso"' +
      (App.ui.plan.status === "encurso" ? " selected" : "") +
      ">En curso</option>" +
      '<option value="regular"' +
      (App.ui.plan.status === "regular" ? " selected" : "") +
      ">Regulares</option>" +
      '<option value="aprobada"' +
      (App.ui.plan.status === "aprobada" ? " selected" : "") +
      ">Aprobadas</option>" +
      "</select>" +
      '<select class="toolbar-select" id="planType" aria-label="Filtrar por tipo">' +
      '<option value="all"' +
      (App.ui.plan.type === "all" ? " selected" : "") +
      ">Todos los tipos</option>" +
      '<option value="M"' +
      (App.ui.plan.type === "M" ? " selected" : "") +
      ">Materias</option>" +
      '<option value="T"' +
      (App.ui.plan.type === "T" ? " selected" : "") +
      ">Talleres</option>" +
      '<option value="S"' +
      (App.ui.plan.type === "S" ? " selected" : "") +
      ">Seminarios</option>" +
      "</select>" +
      (filtersActive
        ? '<button class="button button--ghost button--compact" type="button" data-action="clear-plan-filters">Limpiar</button>'
        : "") +
      "</div>" +
      '<div class="filter-pills">' +
      yearChips +
      "</div>" +
      '<div class="plan-summary">' +
      '<span class="summary-chip"><span class="summary-swatch" style="background:var(--status-aprobada)"></span>Aprobadas<strong>' +
      stats.approved +
      "</strong></span>" +
      '<span class="summary-chip"><span class="summary-swatch" style="background:var(--status-cursando)"></span>Cursando<strong>' +
      stats.cursando +
      "</strong></span>" +
      '<span class="summary-chip"><span class="summary-swatch" style="background:var(--status-regular)"></span>Regulares<strong>' +
      stats.regular +
      "</strong></span>" +
      '<span class="summary-chip"><span class="summary-swatch" style="background:var(--status-pendiente)"></span>Pendientes<strong>' +
      stats.pending +
      "</strong></span>" +
      "</div>" +
      '<div class="plan-empty">' +
      sections +
      "</div>";
  };
})();
