/* =========================================================
   Trayecto · Calendario académico
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;

  function eventsForDate(dateISO) {
    return App.state.events
      .filter(function (event) {
        return event.date === dateISO;
      })
      .sort(function (a, b) {
        return (a.time || "00:00").localeCompare(b.time || "00:00");
      });
  }

  function calendarDay(date, month, todayISO) {
    var iso = App.toISO(date);
    var events = eventsForDate(iso);
    var outside = date.getMonth() !== month.getMonth();
    var isToday = iso === todayISO;
    var visible = events.slice(0, 3);
    var hidden = events.length - visible.length;

    return (
      '<div class="calendar-day' +
      (outside ? " is-outside" : "") +
      (isToday ? " is-today" : "") +
      '" data-action="new-event-day" data-date="' +
      iso +
      '">' +
      '<div class="calendar-day-top"><span class="day-number">' +
      date.getDate() +
      '</span><button class="day-add" type="button" data-action="new-event-day" data-date="' +
      iso +
      '" aria-label="Agregar un evento el ' +
      App.dateLong(date) +
      '">' +
      App.icon("plus", "icon--tiny") +
      "</button></div>" +
      '<div class="day-events">' +
      visible
        .map(function (event) {
          return (
            '<button class="calendar-event calendar-event--' +
            App.eventTypeClass(event.type) +
            (event.done ? " is-done" : "") +
            '" type="button" data-action="open-event" data-id="' +
            App.esc(event.id) +
            '" title="' +
            App.esc(event.title) +
            '">' +
            (event.time ? "<span>" + App.esc(event.time) + "</span>" : "") +
            '<span class="event-chip-title">' +
            App.esc(event.title) +
            "</span></button>"
          );
        })
        .join("") +
      (hidden > 0 ? '<span class="more-events">+' + hidden + " más</span>" : "") +
      "</div></div>"
    );
  }

  App.renderCalendar = function () {
    var root = App.$("#page-calendario");
    if (!App.ui.calendar.month) {
      var now = new Date();
      App.ui.calendar.month = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    var month = App.ui.calendar.month;
    var year = month.getFullYear();
    var monthIndex = month.getMonth();
    var first = new Date(year, monthIndex, 1);
    var offset = (first.getDay() + 6) % 7;
    var gridStart = new Date(year, monthIndex, 1 - offset);
    var todayISO = App.todayISO();
    var monthPrefix =
      year + "-" + App.pad2(monthIndex + 1);
    var monthEvents = App.state.events.filter(function (event) {
      return event.date.indexOf(monthPrefix) === 0;
    });

    var days = [];
    for (var i = 0; i < 42; i += 1) {
      var date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      days.push(calendarDay(date, month, todayISO));
    }

    var upcoming = App.getUpcomingEvents(6);
    var agenda = upcoming.length
      ? '<div class="agenda-list">' +
        upcoming
          .map(function (event) {
            var date = App.parseISO(event.date);
            var subject = event.subjectId ? App.subjectById(event.subjectId) : null;
            return (
              '<button class="agenda-item" type="button" data-action="open-event" data-id="' +
              App.esc(event.id) +
              '">' +
              '<span class="agenda-date"><strong>' +
              App.pad2(date.getDate()) +
              "</strong><span>" +
              App.monthShort(date) +
              "</span></span>" +
              '<span class="agenda-copy"><strong>' +
              App.esc(event.title) +
              "</strong><span>" +
              (subject ? App.esc(subject.name) : "Sin materia") +
              (event.time ? " · " + App.esc(event.time) : " · Todo el día") +
              "</span></span>" +
              "</button>"
            );
          })
          .join("") +
        "</div>"
      : '<div class="agenda-empty">No hay fechas próximas.<br>Cargá tu primer parcial o final.</div>';

    root.innerHTML =
      '<div class="calendar-layout">' +
      '<section class="card calendar-panel" aria-label="Calendario mensual">' +
      '<div class="calendar-header">' +
      "<div>" +
      '<span class="section-kicker">Calendario académico</span>' +
      '<div class="calendar-month"><h2>' +
      App.monthYear(month) +
      "</h2><span>" +
      monthEvents.length +
      " " +
      App.plural(monthEvents.length, "fecha", "fechas") +
      "</span></div>" +
      "</div>" +
      '<div class="calendar-controls">' +
      '<button class="icon-button" type="button" data-action="calendar-prev" aria-label="Mes anterior">' +
      App.icon("chevron-left", "icon--small") +
      "</button>" +
      '<button class="calendar-today-btn" type="button" data-action="calendar-today">Hoy</button>' +
      '<button class="icon-button" type="button" data-action="calendar-next" aria-label="Mes siguiente">' +
      App.icon("chevron-right", "icon--small") +
      "</button>" +
      "</div>" +
      "</div>" +
      '<div class="calendar-weekdays" aria-hidden="true">' +
      "<span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>" +
      "</div>" +
      '<div class="calendar-grid">' +
      days.join("") +
      "</div>" +
      '<div class="calendar-legend">' +
      '<span><span class="legend-dot legend-dot--parcial"></span>Parcial</span>' +
      '<span><span class="legend-dot legend-dot--final"></span>Final</span>' +
      '<span><span class="legend-dot legend-dot--tp"></span>Trabajo práctico</span>' +
      '<span><span class="legend-dot legend-dot--otro"></span>Otro</span>' +
      "</div>" +
      "</section>" +
      '<aside class="calendar-side">' +
      '<section class="card agenda-panel">' +
      '<div class="panel-header"><div><span class="section-kicker">Lo que viene</span><h2 class="panel-title">Próximas fechas</h2></div>' +
      '<button class="button button--secondary button--compact" type="button" data-action="new-event">' +
      App.icon("plus", "icon--small") +
      " Nueva</button></div>" +
      agenda +
      "</section>" +
      '<section class="calendar-tip">' +
      '<span class="section-kicker section-kicker--coral">Para tener en cuenta</span>' +
      "<strong>Cada fecha, en su lugar.</strong>" +
      "<p>Anotá también los finales cuando te inscribís y las entregas de trabajos. Podés asociar cada evento a una materia.</p>" +
      '<button class="button button--secondary button--compact" type="button" data-action="new-event" style="margin-top:12px">' +
      App.icon("calendar", "icon--small") +
      " Agregar al calendario</button>" +
      "</section>" +
      "</aside>" +
      "</div>";
  };
})();
