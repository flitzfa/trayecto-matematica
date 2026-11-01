/* =========================================================
   Trayecto · Ajustes e información del plan
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;

  App.renderPlanInfo = function () {
    var body = App.$("#planInfoBody");
    var counts = { M: 0, T: 0, S: 0 };
    var withCorrelations = 0;
    App.PLAN.subjects.forEach(function (subject) {
      counts[subject.code] = (counts[subject.code] || 0) + 1;
      if (
        ["cursarRegular", "cursarPromocion", "finalRegular", "finalPromocion"].some(
          function (key) {
            var rule = subject.correlations[key] || {};
            return (rule.subjects || []).length || (rule.years || []).length;
          }
        )
      ) {
        withCorrelations += 1;
      }
    });

    body.innerHTML =
      '<div class="plan-info-hero">' +
      "<h3>" +
      App.esc(App.PLAN.career) +
      "</h3>" +
      "<p>" +
      App.esc(App.PLAN.institution) +
      "</p>" +
      "</div>" +
      '<div class="plan-info-grid">' +
      '<div class="plan-info-item"><span>Duración</span><strong>4 años · 8 cuatrimestres</strong></div>' +
      '<div class="plan-info-item"><span>Espacios curriculares</span><strong>' +
      App.PLAN.subjects.length +
      " en total</strong></div>" +
      '<div class="plan-info-item"><span>Materias</span><strong>' +
      counts.M +
      "</strong></div>" +
      '<div class="plan-info-item"><span>Talleres</span><strong>' +
      counts.T +
      "</strong></div>" +
      '<div class="plan-info-item"><span>Seminarios</span><strong>' +
      counts.S +
      "</strong></div>" +
      '<div class="plan-info-item"><span>Con correlatividades</span><strong>' +
      withCorrelations +
      " espacios</strong></div>" +
      "</div>" +
      '<div class="plan-info-item"><span>Cuatrimestres y carga horaria</span><strong>El documento no asigna materias a cuatrimestres ni informa cargas horarias. Esos campos quedan sin completar y son editables.</strong></div>' +
      '<div><span class="section-kicker">Condiciones del plan</span>' +
      '<ul class="plan-info-list">' +
      "<li><strong>Regular:</strong> rendir final.</li>" +
      "<li><strong>Promoción:</strong> aprobada.</li>" +
      "<li><strong>Libre:</strong> recursar.</li>" +
      "<li><strong>Talleres:</strong> 2 mesas y 4 oportunidades. Si no se promociona, se recursa el taller.</li>" +
      "<li><strong>Materias:</strong> 9 mesas y 18 oportunidades. Si no se promociona, se recursa la materia.</li>" +
      "<li><strong>Para graduarse:</strong> todos los talleres, materias y seminarios aprobados, más el trabajo final de carrera aprobado.</li>" +
      "</ul></div>" +
      '<p class="plan-info-source">Fuente: ' +
      App.esc(App.PLAN.sourceNote) +
      ' <a class="text-button" href="' +
      App.SOURCE_URL +
      '" target="_blank" rel="noopener">Abrir PDF original</a></p>';
  };

  App.renderSettings = function () {
    var root = App.$("#page-ajustes");
    var stats = App.getStats();
    var typeCounts = { M: 0, T: 0, S: 0 };
    App.state.subjects.forEach(function (subject) {
      typeCounts[subject.code] = (typeCounts[subject.code] || 0) + 1;
    });
    var profile = App.state.profile;
    var startYear = profile.startYear || "";
    var generalNoteWords = App.countWords(App.state.generalNote);

    root.innerHTML =
      '<div class="settings-layout">' +
      '<div class="settings-column">' +
      '<section class="card settings-card">' +
      '<div class="settings-card-header"><span class="section-kicker section-kicker--coral">Identidad</span><h2>Tu perfil</h2><p>Estos datos personalizan el panel y el saludo. Se guardan únicamente en este navegador.</p></div>' +
      '<form id="profileForm">' +
      '<div class="profile-form-grid">' +
      '<div class="field field--full"><label for="profileName">Nombre y apellido</label><input class="input" id="profileName" name="name" type="text" autocomplete="name" maxlength="80" value="' +
      App.esc(profile.name) +
      '" placeholder="Ej. María López"></div>' +
      '<div class="field"><label for="profileStartYear">Año de inicio <span class="label-optional">(opcional)</span></label><input class="input" id="profileStartYear" name="startYear" type="number" min="1900" max="2200" step="1" value="' +
      App.esc(startYear) +
      '" placeholder="Ej. 2025"></div>' +
      '<div class="field"><label for="profileInstitution">Institución</label><input class="input" id="profileInstitution" name="institution" type="text" maxlength="160" value="' +
      App.esc(profile.institution) +
      '"></div>' +
      '<div class="field field--full"><label for="profileCareer">Carrera</label><input class="input" id="profileCareer" type="text" value="' +
      App.esc(profile.career) +
      '" disabled></div>' +
      "</div>" +
      '<div class="settings-info-strip">' +
      '<div class="info-mini"><span>Plan cargado</span><strong>' +
      App.PLAN.subjects.length +
      " espacios · 4 años</strong></div>" +
      '<div class="info-mini"><span>Avance actual</span><strong>' +
      stats.approved +
      " de " +
      stats.total +
      " aprobadas</strong></div>" +
      "</div>" +
      '<div class="settings-submit-row"><span class="field-hint">Los cambios se aplican al guardar.</span><button class="button button--primary" type="submit">Guardar perfil</button></div>' +
      "</form>" +
      "</section>" +
      '<section class="card settings-card">' +
      '<div class="settings-card-header"><span class="section-kicker">Respaldo</span><h2>Tus datos</h2><p>Exportá un respaldo antes de cambiar de dispositivo o de navegador. El archivo incluye materias, estados, observaciones y calendario.</p></div>' +
      '<div class="data-action"><span class="data-action-icon">' +
      App.icon("download", "icon--small") +
      '</span><span class="data-action-copy"><strong>Exportar respaldo</strong><span>Descargá un archivo JSON con toda tu información.</span></span><button class="button button--secondary button--compact" type="button" data-action="export-json">Exportar</button></div>' +
      '<div class="data-action"><span class="data-action-icon">' +
      App.icon("upload", "icon--small") +
      '</span><span class="data-action-copy"><strong>Importar respaldo</strong><span>Restaurá un archivo exportado desde Trayecto.</span></span><button class="button button--secondary button--compact" type="button" data-action="import-json">Importar</button></div>' +
      '<div class="data-action"><span class="data-action-icon">' +
      App.icon("calendar", "icon--small") +
      '</span><span class="data-action-copy"><strong>Exportar calendario</strong><span>Descargá las fechas en formato .ics para tu agenda.</span></span><button class="button button--secondary button--compact" type="button" data-action="export-ics">Exportar .ics</button></div>' +
      '<div class="data-action"><span class="data-action-icon">' +
      App.icon("refresh", "icon--small") +
      '</span><span class="data-action-copy"><strong>Restaurar estructura oficial</strong><span>Recupera las 40 materias y sus correlatividades. Conserva estados y notas de las materias oficiales.</span></span><button class="button button--secondary button--compact" type="button" data-action="restore-plan">Restaurar</button></div>' +
      "</section>" +
      '<section class="card settings-card danger-zone">' +
      '<div class="settings-card-header"><span class="section-kicker">Zona sensible</span><h2>Empezar de cero</h2><p>Borra el perfil, todos los estados, las observaciones y el calendario de este navegador. Esta acción no se puede deshacer.</p></div>' +
      '<button class="button button--ghost button--danger" type="button" data-action="reset-all">' +
      App.icon("trash", "icon--small") +
      " Borrar todos los datos</button>" +
      "</section>" +
      "</div>" +
      '<aside class="settings-column settings-column--side">' +
      '<section class="plan-meta-card">' +
      '<span class="section-kicker">Plan de estudios</span>' +
      "<h2>Profesorado de Matemática</h2>" +
      "<p>" +
      App.esc(App.state.profile.institution) +
      "</p>" +
      '<div class="plan-meta-stats">' +
      '<div class="plan-meta-stat"><strong>' +
      App.PLAN.subjects.length +
      "</strong><span>Espacios</span></div>" +
      '<div class="plan-meta-stat"><strong>4</strong><span>Años</span></div>' +
      '<div class="plan-meta-stat"><strong>' +
      typeCounts.T +
      "</strong><span>Talleres</span></div>" +
      '<div class="plan-meta-stat"><strong>' +
      typeCounts.S +
      "</strong><span>Seminarios</span></div>" +
      "</div>" +
      '<button class="button button--light" type="button" data-action="open-plan-info">' +
      App.icon("info", "icon--small") +
      " Ver detalles y condiciones</button>" +
      "</section>" +
      '<section class="card settings-card">' +
      '<div class="settings-card-header"><span class="section-kicker">Cómo funciona</span><h2>Un avance simple y transparente</h2></div>' +
      '<ul class="plan-info-list">' +
      "<li>El porcentaje se calcula sobre espacios <strong>aprobados</strong>.</li>" +
      "<li>“Regular” significa cursada aprobada con final pendiente.</li>" +
      "<li>Las correlatividades se muestran según el plan oficial y podés editarlas.</li>" +
      "<li>Los datos viven en el almacenamiento local de este navegador. No se envían a ningún servidor.</li>" +
      "</ul>" +
      '<p class="field-hint" style="margin-top:12px">Bitácora general: ' +
      generalNoteWords +
      " " +
      App.plural(generalNoteWords, "palabra", "palabras") +
      ".</p>" +
      "</section>" +
      "</aside>" +
      "</div>";
  };
})();
