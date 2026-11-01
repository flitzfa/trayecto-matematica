/* =========================================================
   Trayecto · Bitácora / observaciones
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;

  function noteCard(subject) {
    return (
      '<button class="note-card" type="button" data-action="open-subject" data-id="' +
      App.esc(subject.id) +
      '" data-focus-notes="1">' +
      '<span class="note-card-top">' +
      '<span class="note-card-number">' +
      App.pad2(subject.number) +
      "</span>" +
      App.statusPill(subject.status) +
      App.typeTag(subject.code) +
      "</span>" +
      '<span class="note-card-title">' +
      App.esc(subject.name) +
      "</span>" +
      '<span class="note-card-body">' +
      App.esc(subject.notes) +
      "</span>" +
      '<span class="note-card-footer"><span>' +
      App.yearLabel(subject.year) +
      " · " +
      App.relativeDate(subject.notesUpdatedAt || subject.updatedAt) +
      '</span><span class="panel-link">Abrir ' +
      App.icon("arrow-right", "icon--tiny") +
      "</span></span>" +
      "</button>"
    );
  }

  App.renderNotes = function () {
    var root = App.$("#page-bitacora");
    var noted = App.state.subjects
      .filter(function (subject) {
        return subject.notes && subject.notes.trim();
      })
      .sort(function (a, b) {
        return String(b.notesUpdatedAt || b.updatedAt || "").localeCompare(
          String(a.notesUpdatedAt || a.updatedAt || "")
        );
      });
    var query = App.normalizeText(App.ui.notesQuery);
    var filtered = noted.filter(function (subject) {
      return (
        !query ||
        App.normalizeText(subject.name + " " + subject.notes).indexOf(query) >= 0
      );
    });
    var words = noted.reduce(function (total, subject) {
      return total + App.countWords(subject.notes);
    }, 0);
    var activeNotes = noted.filter(function (subject) {
      return subject.status === "cursando" || subject.status === "regular";
    }).length;
    var savedLabel = App.state.generalNoteUpdatedAt
      ? "Guardado " + App.relativeDate(App.state.generalNoteUpdatedAt)
      : "Se guarda automáticamente";

    var cards = filtered.length
      ? filtered.map(noteCard).join("")
      : App.emptyState({
          icon: query ? "search" : "note",
          title: query ? "No encontramos observaciones" : "Todavía no hay observaciones",
          text: query
            ? "Probá con otra palabra o limpiá la búsqueda."
            : "Elegí una materia y escribí lo que quieras recordar: dudas, materiales, acuerdos o ideas.",
          action: query
            ? '<button class="button button--secondary" type="button" data-action="clear-notes-search">Limpiar búsqueda</button>'
            : '<a class="button button--primary" href="#/plan">Ir al plan de estudios</a>'
        });

    root.innerHTML =
      '<div class="journal-layout">' +
      '<section class="card journal-main">' +
      '<div class="journal-main-header">' +
      "<div><span class=\"section-kicker section-kicker--coral\">Bitácora general</span>" +
      "<h2>Tus notas al margen</h2>" +
      "<p>Un espacio libre para el recorrido completo: objetivos del año, trámites, ideas sueltas o lo que no querés olvidar.</p></div>" +
      '<span class="journal-save-state" id="journalSaveState">' +
      App.icon("check", "icon--tiny") +
      savedLabel +
      "</span>" +
      "</div>" +
      '<textarea class="journal-textarea" id="generalNote" maxlength="6000" placeholder="Ej. Este cuatrimestre quiero sostener el ritmo de estudio y consultar antes de los parciales…">' +
      App.esc(App.state.generalNote) +
      "</textarea>" +
      "</section>" +
      '<aside class="journal-side">' +
      '<section class="card journal-stat">' +
      '<span class="section-kicker">Tu bitácora</span>' +
      '<div class="journal-stat-number">' +
      noted.length +
      "</div>" +
      "<p>" +
      App.plural(noted.length, "materia con observaciones", "materias con observaciones") +
      " de " +
      App.state.subjects.length +
      ".</p>" +
      '<div class="journal-note-counts">' +
      "<span>Palabras escritas<strong>" +
      words +
      "</strong></span>" +
      "<span>En materias activas<strong>" +
      activeNotes +
      "</strong></span>" +
      "<span>Sin observaciones<strong>" +
      (App.state.subjects.length - noted.length) +
      "</strong></span>" +
      "</div>" +
      "</section>" +
      '<section class="calendar-tip">' +
      '<span class="section-kicker section-kicker--coral">Sugerencia</span>' +
      "<strong>Una nota por materia.</strong>" +
      "<p>Las observaciones que escribas en cada materia también aparecen acá, ordenadas por última edición.</p>" +
      '<a class="button button--secondary button--compact" href="#/plan" style="margin-top:12px">Elegir materia ' +
      App.icon("arrow-right", "icon--small") +
      "</a>" +
      "</section>" +
      "</aside>" +
      "</div>" +
      '<div class="notes-toolbar">' +
      '<div><h2>Observaciones por materia</h2><p>' +
      noted.length +
      " " +
      App.plural(noted.length, "materia con notas", "materias con notas") +
      "</p></div>" +
      '<select class="toolbar-select" id="noteSubjectPicker" aria-label="Elegir materia para escribir una observación">' +
      '<option value="">Elegir materia…</option>' +
      App.subjectOptions("", false) +
      "</select>" +
      '<button class="button button--primary button--compact" type="button" data-action="write-note">Escribir</button>' +
      '<div class="search-field"><span>' +
      App.icon("search") +
      '</span><input id="notesSearch" type="search" value="' +
      App.esc(App.ui.notesQuery) +
      '" placeholder="Buscar en tus notas…" aria-label="Buscar en observaciones"></div>' +
      "</div>" +
      '<div class="notes-grid">' +
      cards +
      "</div>";
  };
})();
