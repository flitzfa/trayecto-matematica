/* =========================================================
   Trayecto · Shell y panel principal
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;

  App.renderShell = function () {
    var meta = App.ROUTES[App.ui.route] || App.ROUTES.panel;
    var stats = App.getStats();
    var upcoming = App.getUpcomingEvents();
    var profileName = (App.state.profile.name || "").trim();
    var displayName = profileName || "Estudiante";
    var initials = App.initials(profileName);

    App.$("#pageEyebrow").textContent = meta.eyebrow;
    App.$("#pageTitle").textContent = meta.title;
    document.title = meta.title + " · Trayecto";

    var today = new Date();
    App.$("#todayLabel").textContent = App.capitalize(
      new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long"
      }).format(today)
    );

    App.$$(".nav-item").forEach(function (item) {
      var active = item.dataset.route === App.ui.route;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });

    App.$("#navSubjectCount").textContent = stats.total;
    var eventCounter = App.$("#navEventCount");
    eventCounter.textContent = upcoming.length > 99 ? "99+" : String(upcoming.length);
    eventCounter.hidden = upcoming.length === 0;

    App.$("#sidebarName").textContent = displayName;
    App.$("#sidebarAvatar").textContent = initials;
    App.$("#topbarAvatar").textContent = initials;
    App.$("#sidebarApproved").textContent = stats.approved + " de " + stats.total;
    App.$("#sidebarPercent").textContent = stats.percent + "%";

    var circle = App.$("#sidebarRing .mini-ring-value");
    var circumference = 2 * Math.PI * 18;
    if (circle) {
      circle.style.strokeDashoffset = (
        circumference *
        (1 - stats.percent / 100)
      ).toFixed(2);
    }

    var institution = App.$(".sidebar-career .career-meta");
    if (institution) {
      institution.textContent = App.state.profile.institution || App.PLAN.institution;
    }
  };

  App.renderPage = function () {
    var route = App.ui.route || "panel";
    var renderers = {
      panel: App.renderDashboard,
      plan: App.renderPlan,
      calendario: App.renderCalendar,
      bitacora: App.renderNotes,
      ajustes: App.renderSettings
    };

    App.$$(".page").forEach(function (page) {
      var active = page.dataset.page === route;
      page.classList.toggle("is-active", active);
      page.setAttribute("aria-hidden", active ? "false" : "true");
    });

    var renderer = renderers[route];
    if (typeof renderer === "function") renderer();
  };

  function renderHero(stats) {
    var missing = stats.total - stats.approved;
    var title;
    var text;

    if (stats.total > 0 && stats.approved === stats.total) {
      title = "Plan completo. <em>Felicitaciones.</em>";
      text =
        "Aprobaste los " +
        stats.total +
        " espacios curriculares del plan. Ahora solo queda el trabajo final de carrera.";
    } else if (stats.approved === 0) {
      title = "El primer paso es <em>empezar</em>.";
      text =
        "Tenés " +
        stats.total +
        " espacios por recorrer. Marcá una materia como cursando cuando arranques y tu avance va a empezar a tomar forma.";
    } else {
      title = "Cada final, <em>un paso más</em>.";
      text =
        "Aprobaste " +
        stats.approved +
        " de " +
        stats.total +
        " espacios. Te faltan " +
        missing +
        " para completar el plan de estudios.";
    }

    return (
      '<article class="hero-card">' +
      '<svg class="hero-art" viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 252 C 105 252, 140 205, 210 205 S 300 266, 365 190 S 465 78, 600 42" fill="none" stroke="#f7f1e3" stroke-width="1.2"/>' +
      '<path d="M0 282 C 120 282, 160 242, 236 242 S 327 294, 396 226 S 485 128, 600 100" fill="none" stroke="#f7f1e3" stroke-width=".7" stroke-dasharray="5 7"/>' +
      '<circle cx="365" cy="190" r="4.5" fill="#ec775d"/>' +
      '<circle cx="600" cy="42" r="3" fill="#f7f1e3"/>' +
      "</svg>" +
      '<div class="hero-top">' +
      '<span class="hero-kicker">Avance de la carrera</span>' +
      '<button class="hero-info" type="button" data-action="open-plan-info" aria-label="Cómo se calcula el avance">' +
      App.icon("info", "icon--small") +
      "</button>" +
      "</div>" +
      '<div class="hero-main">' +
      App.ringSVG(stats.percent) +
      '<div class="hero-copy">' +
      "<h2>" +
      title +
      "</h2>" +
      "<p>" +
      text +
      "</p>" +
      '<div class="hero-legend">' +
      '<span class="hero-legend-item"><span class="hero-legend-dot" style="background:#8fbe9e"></span><strong>' +
      stats.approved +
      "</strong> aprobadas</span>" +
      '<span class="hero-legend-item"><span class="hero-legend-dot" style="background:#e9ae6e"></span><strong>' +
      stats.active +
      "</strong> en curso</span>" +
      '<span class="hero-legend-item"><span class="hero-legend-dot" style="background:rgba(248,242,228,.35)"></span><strong>' +
      stats.pending +
      "</strong> pendientes</span>" +
      (stats.average !== null
        ? '<span class="hero-legend-item" title="Sobre ' +
          stats.graded +
          " " +
          App.plural(stats.graded, "materia aprobada con nota", "materias aprobadas con nota") +
          '">Promedio <strong>' +
          App.formatGrade(stats.average) +
          "</strong></span>"
        : "") +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="hero-footer">' +
      "<p>El avance se mide por <strong>espacios aprobados</strong>, no por notas ni carga horaria.</p>" +
      '<a class="button button--light" href="#/plan">Abrir el plan ' +
      App.icon("arrow-right", "icon--small") +
      "</a>" +
      "</div>" +
      "</article>"
    );
  }

  function renderNextEventCard(event) {
    var header =
      '<div class="panel-header">' +
      '<div><span class="section-kicker">Agenda</span><h2 class="panel-title">' +
      (event && (event.type === "Parcial" || event.type === "Final")
        ? "Próximo examen"
        : "Próxima fecha") +
      "</h2></div>" +
      '<a class="panel-link" href="#/calendario">Calendario ' +
      App.icon("arrow-right", "icon--small") +
      "</a>" +
      "</div>";

    if (!event) {
      return (
        '<article class="card next-exam-card">' +
        header +
        App.emptyState({
          compact: true,
          icon: "calendar",
          title: "Tu agenda está libre",
          text: "Cargá parciales, finales y entregas para no perder ninguna fecha.",
          action:
            '<button class="button button--secondary button--compact" type="button" data-action="new-event">' +
            App.icon("plus", "icon--small") +
            " Agregar fecha</button>"
        }) +
        "</article>"
      );
    }

    var subject = event.subjectId ? App.subjectById(event.subjectId) : null;
    var date = App.parseISO(event.date);
    return (
      '<article class="card next-exam-card">' +
      header +
      '<div class="next-exam-content">' +
      '<div class="date-tile">' +
      '<span class="date-tile-month">' +
      App.monthShort(date) +
      "</span>" +
      '<span class="date-tile-day">' +
      App.pad2(date.getDate()) +
      "</span>" +
      '<span class="date-tile-weekday">' +
      App.weekdayShort(date) +
      "</span>" +
      "</div>" +
      '<div class="next-exam-copy">' +
      "<h3>" +
      App.esc(event.title) +
      "</h3>" +
      '<p class="next-exam-subject">' +
      (subject ? App.esc(subject.name) : "Sin materia asociada") +
      "</p>" +
      '<div class="next-exam-meta">' +
      App.eventTypeBadge(event.type) +
      '<span class="countdown">' +
      App.icon("clock", "icon--tiny") +
      App.countdownLabel(event.date) +
      "</span>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="next-exam-footer">' +
      "<span>" +
      (event.time ? "A las " + App.esc(event.time) : "Todo el día") +
      " · " +
      App.dateLong(event.date) +
      "</span>" +
      '<a class="panel-link" href="#/calendario">Ver agenda ' +
      App.icon("arrow-right", "icon--small") +
      "</a>" +
      "</div>" +
      "</article>"
    );
  }

  function renderDashboard() {
    var root = App.$("#page-panel");
    var stats = App.getStats();
    var upcoming = App.getUpcomingEvents(4);
    var nextEvent = upcoming[0] || null;
    var focus = App.getFocus();
    var recent = App.recentNotes(3);
    var profileName = (App.state.profile.name || "").trim();
    var firstName = profileName ? profileName.split(/\s+/)[0] : "";
    var now = new Date();
    var greeting =
      now.getHours() < 12
        ? "Buen día"
        : now.getHours() < 20
          ? "Buenas tardes"
          : "Buenas noches";
    var readyPending = App.state.subjects.filter(function (subject) {
      return subject.status === "pendiente" && App.isReadyToCourse(subject);
    }).length;

    var html = '<div class="dashboard">';

    if (!profileName) {
      html +=
        '<div class="onboarding-banner">' +
        '<span class="onboarding-icon">' +
        App.icon("spark", "icon--small") +
        "</span>" +
        '<span class="onboarding-copy"><strong>Hacé tuyo este espacio</strong>' +
        "<span>Agregá tu nombre y el año de inicio para personalizar tu panel.</span></span>" +
        '<a class="button button--secondary" href="#/ajustes">Completar perfil</a>' +
        "</div>";
    }

    html +=
      '<div class="dash-greeting">' +
      "<div>" +
      '<span class="section-kicker section-kicker--coral">Tu recorrido</span>' +
      "<h2>" +
      greeting +
      (firstName ? ", <em>" + App.esc(firstName) + "</em>" : "") +
      ".</h2>" +
      "<p>Un solo lugar para saber dónde estás, qué te falta y qué viene después.</p>" +
      "</div>" +
      '<span class="dash-greeting-aside"><span class="pill-dot"></span>Datos guardados en este dispositivo</span>' +
      "</div>";

    html +=
      '<div class="dashboard-grid">' +
      renderHero(stats) +
      renderNextEventCard(nextEvent) +
      "</div>";

    html +=
      '<div class="stats-grid">' +
      '<article class="stat-card">' +
      '<div class="stat-top"><span class="stat-kicker">Aprobadas</span><span class="stat-icon stat-icon--green">' +
      App.icon("check", "icon--small") +
      "</span></div>" +
      '<div class="stat-value-row"><span class="stat-value">' +
      stats.approved +
      "</span><small>de " +
      stats.total +
      "</small></div>" +
      '<span class="stat-label">Espacios completados</span>' +
      '<span class="stat-foot">' +
      stats.percent +
      "% del plan aprobado</span>" +
      "</article>" +
      '<article class="stat-card">' +
      '<div class="stat-top"><span class="stat-kicker">En curso</span><span class="stat-icon stat-icon--amber">' +
      App.icon("clock", "icon--small") +
      "</span></div>" +
      '<div class="stat-value-row"><span class="stat-value">' +
      stats.active +
      "</span><small>" +
      App.plural(stats.active, "materia", "materias") +
      "</small></div>" +
      '<span class="stat-label">Cursando o con final pendiente</span>' +
      '<span class="stat-foot">' +
      (stats.active
        ? stats.regular + " regulares · " + stats.cursando + " cursando"
        : "Todavía no hay materias activas") +
      "</span>" +
      "</article>" +
      '<article class="stat-card">' +
      '<div class="stat-top"><span class="stat-kicker">Pendientes</span><span class="stat-icon stat-icon--blue">' +
      App.icon("bookmark", "icon--small") +
      "</span></div>" +
      '<div class="stat-value-row"><span class="stat-value">' +
      stats.pending +
      "</span><small>" +
      App.plural(stats.pending, "materia", "materias") +
      "</small></div>" +
      '<span class="stat-label">Por cursar o aprobar</span>' +
      '<span class="stat-foot">' +
      (readyPending
        ? readyPending +
          " " +
          App.plural(readyPending, "materia habilitada", "materias habilitadas") +
          " para cursar"
        : "Revisá las correlatividades del plan") +
      "</span>" +
      "</article>" +
      '<article class="stat-card">' +
      '<div class="stat-top"><span class="stat-kicker">Próximas fechas</span><span class="stat-icon stat-icon--coral">' +
      App.icon("calendar", "icon--small") +
      "</span></div>" +
      '<div class="stat-value-row"><span class="stat-value">' +
      upcoming.length +
      "</span><small>" +
      App.plural(upcoming.length, "fecha", "fechas") +
      "</small></div>" +
      '<span class="stat-label">Parciales, finales y entregas</span>' +
      '<span class="stat-foot">' +
      (nextEvent
        ? App.dateShort(nextEvent.date) +
          " · " +
          App.esc(nextEvent.title)
        : "No hay fechas cargadas") +
      "</span>" +
      "</article>" +
      "</div>";

    var yearRows = [1, 2, 3, 4]
      .map(function (year) {
        var list = App.getYearSubjects(year);
        var yearStats = App.getStats(list);
        var full = yearStats.total > 0 && yearStats.approved === yearStats.total;
        var fillClass = full
          ? "year-bar-fill year-bar-fill--complete"
          : "year-bar-fill year-bar-fill--started";
        var metaRight = yearStats.active
          ? yearStats.active + " en curso"
          : full
            ? "Completo"
            : "Sin iniciar";
        return (
          '<button class="year-row" type="button" data-action="open-year" data-year="' +
          year +
          '">' +
          '<span class="year-row-label"><strong>' +
          App.pad2(year) +
          "</strong><span>" +
          App.yearWord(year) +
          "</span></span>" +
          '<span class="year-bar-wrap"><span class="year-bar"><span class="' +
          fillClass +
          '" style="width:' +
          yearStats.percent +
          '%"></span></span><span class="year-bar-meta"><span>' +
          yearStats.percent +
          "%</span><span>" +
          metaRight +
          "</span></span></span>" +
          '<span class="year-row-count"><strong>' +
          yearStats.approved +
          "</strong>/" +
          yearStats.total +
          (full
            ? '<span class="year-complete-badge">' +
              App.icon("check", "icon--tiny") +
              " Completo</span>"
            : "") +
          "</span>" +
          "</button>"
        );
      })
      .join("");

    var focusTitle =
      focus.mode === "active"
        ? "En foco"
        : focus.mode === "ready"
          ? "Para empezar"
          : "En foco";
    var focusKicker =
      focus.mode === "active"
        ? "Cursando ahora"
        : focus.mode === "ready"
          ? "Sin correlativas pendientes"
          : "Sin materias activas";
    var focusBody = "";

    if (focus.mode === "none") {
      focusBody = App.emptyState({
        compact: true,
        icon: "bookmark",
        title: "No hay materias habilitadas",
        text: "Las correlatividades del plan todavía no están completas. Revisá las materias que estás cursando.",
        action: '<a class="button button--secondary button--compact" href="#/plan">Revisar el plan</a>'
      });
    } else {
      focusBody =
        '<div class="focus-list">' +
        focus.items
          .map(function (subject) {
            return (
              '<button class="focus-item" type="button" data-action="open-subject" data-id="' +
              App.esc(subject.id) +
              '"' +
              (focus.mode === "ready" ? ' data-start="1"' : "") +
              ">" +
              '<span class="focus-number">' +
              App.pad2(subject.number) +
              "</span>" +
              '<span class="focus-copy"><strong>' +
              App.esc(subject.name) +
              "</strong><span>" +
              App.yearLabel(subject.year) +
              " · " +
              App.esc(App.typeMeta(subject.code).label) +
              "</span></span>" +
              (focus.mode === "active"
                ? App.statusPill(subject.status)
                : '<span class="focus-action">Empezar ' +
                  App.icon("arrow-right") +
                  "</span>") +
              "</button>"
            );
          })
          .join("") +
        "</div>";
    }

    html +=
      '<div class="split-grid">' +
      '<article class="card panel">' +
      '<div class="panel-header"><div><span class="section-kicker">Recorrido</span><h2 class="panel-title">Avance por año</h2></div>' +
      '<a class="panel-link" href="#/plan">Plan completo ' +
      App.icon("arrow-right", "icon--small") +
      "</a></div>" +
      '<div class="year-progress-list">' +
      yearRows +
      "</div>" +
      "</article>" +
      '<article class="card panel">' +
      '<div class="panel-header"><div><span class="section-kicker">' +
      focusKicker +
      '</span><h2 class="panel-title">' +
      focusTitle +
      "</h2></div>" +
      '<a class="panel-link" href="#/plan">' +
      (focus.count > 4 ? focus.count + " materias " : "") +
      "Ver plan " +
      App.icon("arrow-right", "icon--small") +
      "</a></div>" +
      focusBody +
      "</article>" +
      "</div>";

    var eventRows = upcoming.length
      ? '<div class="events-list">' +
        upcoming
          .map(function (event) {
            var subject = event.subjectId ? App.subjectById(event.subjectId) : null;
            var date = App.parseISO(event.date);
            return (
              '<button class="event-row" type="button" data-action="open-event" data-id="' +
              App.esc(event.id) +
              '">' +
              '<span class="mini-date"><span class="mini-date-month">' +
              App.monthShort(date) +
              '</span><span class="mini-date-day">' +
              App.pad2(date.getDate()) +
              "</span></span>" +
              '<span class="event-copy"><strong>' +
              App.esc(event.title) +
              "</strong><span>" +
              (subject ? App.esc(subject.name) : "Sin materia") +
              (event.time ? " · " + App.esc(event.time) : " · Todo el día") +
              "</span></span>" +
              App.eventTypeBadge(event.type) +
              "</button>"
            );
          })
          .join("") +
        "</div>"
      : App.emptyState({
          compact: true,
          icon: "calendar",
          title: "Sin fechas próximas",
          text: "Cuando cargues un parcial, un final o una entrega, va a aparecer acá.",
          action:
            '<button class="button button--secondary button--compact" type="button" data-action="new-event">Agregar fecha</button>'
        });

    var noteRows = recent.length
      ? '<div class="notes-list">' +
        recent
          .map(function (subject) {
            return (
              '<button class="note-preview" type="button" data-action="open-subject" data-id="' +
              App.esc(subject.id) +
              '" data-focus-notes="1">' +
              '<span class="note-preview-head"><strong>' +
              App.esc(subject.name) +
              "</strong><span>" +
              App.relativeDate(subject.notesUpdatedAt || subject.updatedAt) +
              "</span></span>" +
              "<p>" +
              App.esc(subject.notes) +
              "</p></button>"
            );
          })
          .join("") +
        "</div>"
      : App.emptyState({
          compact: true,
          icon: "note",
          title: "Tu bitácora está en blanco",
          text: "Guardá ideas, dudas o acuerdos de cada materia para tenerlos siempre a mano.",
          action: '<a class="button button--secondary button--compact" href="#/bitacora">Abrir bitácora</a>'
        });

    html +=
      '<div class="split-grid">' +
      '<article class="card panel">' +
      '<div class="panel-header"><div><span class="section-kicker">Agenda</span><h2 class="panel-title">Próximas fechas</h2></div>' +
      '<a class="panel-link" href="#/calendario">Ver calendario ' +
      App.icon("arrow-right", "icon--small") +
      "</a></div>" +
      eventRows +
      "</article>" +
      '<article class="card panel">' +
      '<div class="panel-header"><div><span class="section-kicker">Bitácora</span><h2 class="panel-title">Últimas observaciones</h2></div>' +
      '<a class="panel-link" href="#/bitacora">Abrir bitácora ' +
      App.icon("arrow-right", "icon--small") +
      "</a></div>" +
      noteRows +
      "</article>" +
      "</div>";

    html += "</div>";
    root.innerHTML = html;
  }

  App.renderDashboard = renderDashboard;
})();
