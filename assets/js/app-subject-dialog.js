/* =========================================================
   Trayecto · Diálogo de materia y correlatividades
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;

  App.syncSubjectStatusFields = function (status, applyDefaults) {
    var showCursada = status === "cursando" || status === "regular" || status === "aprobada";
    var showApproved = status === "aprobada";
    App.$$("#subjectForm [data-date-for]").forEach(function (field) {
      var allowed = field.dataset.dateFor.split(" ");
      field.hidden = allowed.indexOf(status) === -1;
    });
    if (applyDefaults) {
      if (showCursada && !App.$("#subjectCursadaDate").value) {
        App.$("#subjectCursadaDate").value = App.todayISO();
      }
      if (showApproved && !App.$("#subjectApprovedDate").value) {
        App.$("#subjectApprovedDate").value = App.todayISO();
      }
    }
  };

  function ruleItems(rule, level) {
    var items = [];
    (rule.subjects || []).forEach(function (number) {
      var subject = App.subjectByNumber(number);
      var met = false;
      if (subject) {
        met =
          level === "promotion"
            ? subject.status === "aprobada"
            : subject.status === "regular" || subject.status === "aprobada";
      }
      items.push({
        label: subject
          ? App.pad2(number) + " · " + subject.name
          : "Materia " + number + " (no disponible)",
        met: met
      });
    });
    (rule.years || []).forEach(function (year) {
      var subjects = App.getYearSubjects(year);
      var met =
        subjects.length > 0 &&
        subjects.every(function (subject) {
          return level === "promotion"
            ? subject.status === "aprobada"
            : subject.status === "regular" || subject.status === "aprobada";
        });
      items.push({
        label: App.yearLabel(year) + " completo",
        met: met
      });
    });
    return items;
  }

  function renderCorrelationDisplay(correlations) {
    var container = App.$("#subjectCorrelations");
    var summary = App.$("#subjectCorrelationSummary");
    var total = 0;
    var met = 0;

    container.innerHTML = App.CORR_GROUPS.map(function (group) {
      var items = ruleItems(correlations[group.key] || {}, group.level);
      total += items.length;
      met += items.filter(function (item) {
        return item.met;
      }).length;
      var chips = items.length
        ? items
            .map(function (item) {
              return (
                '<span class="correlation-chip ' +
                (item.met ? "is-met" : "is-missing") +
                '">' +
                App.icon(item.met ? "check" : "alert", "icon--tiny") +
                App.esc(item.label) +
                "</span>"
              );
            })
            .join("")
        : '<span class="correlation-empty">Sin correlativas</span>';
      return (
        '<div class="correlation-group"><div class="correlation-group-label">' +
        App.esc(group.label) +
        '</div><div class="correlation-chips">' +
        chips +
        "</div></div>"
      );
    }).join("");

    summary.className = "correlation-summary";
    if (!total) {
      summary.textContent = "Sin correlativas";
    } else if (met === total) {
      summary.textContent = "Todo cumplido";
      summary.classList.add("is-met");
    } else {
      summary.textContent = met + " de " + total + " cumplidas";
      summary.classList.add("is-missing");
    }
  }

  function renderCorrelationEditor(correlations, subject) {
    var tabs = App.$("#correlationTabs");
    var editor = App.$("#correlationEditor");
    var activeTab = App.currentCorrelationTab || "cursarRegular";
    if (!App.CORR_GROUPS.some(function (group) { return group.key === activeTab; })) {
      activeTab = "cursarRegular";
    }

    tabs.innerHTML = App.CORR_GROUPS.map(function (group) {
      return (
        '<button class="correlation-tab ' +
        (group.key === activeTab ? "is-active" : "") +
        '" type="button" role="tab" aria-selected="' +
        (group.key === activeTab) +
        '" data-corr-tab="' +
        group.key +
        '">' +
        App.esc(group.tab) +
        "</button>"
      );
    }).join("");

    var subjects = App.state.subjects
      .filter(function (item) {
        return !subject || item.id !== subject.id;
      })
      .sort(function (a, b) {
        if (a.year !== b.year) return a.year - b.year;
        return a.number - b.number;
      });

    editor.innerHTML = App.CORR_GROUPS.map(function (group) {
      var rule = correlations[group.key] || { subjects: [], years: [] };
      var yearTokens = [1, 2, 3, 4]
        .map(function (year) {
          return (
            '<label class="token-check"><input type="checkbox" value="' +
            year +
            '" data-year-check' +
            ((rule.years || []).indexOf(year) >= 0 ? " checked" : "") +
            "><span>" +
            App.yearLabel(year) +
            "</span></label>"
          );
        })
        .join("");
      var checks = subjects
        .map(function (item) {
          return (
            '<label class="subject-check"><input type="checkbox" value="' +
            item.number +
            '" data-subject-check' +
            ((rule.subjects || []).indexOf(Number(item.number)) >= 0 ? " checked" : "") +
            '><span class="check-label"><span class="check-number">' +
            App.pad2(item.number) +
            "</span>" +
            App.esc(item.name) +
            "</span></label>"
          );
        })
        .join("");

      return (
        '<div class="correlation-panel ' +
        (group.key === activeTab ? "is-active" : "") +
        '" data-corr-panel="' +
        group.key +
        '">' +
        '<div class="correlation-panel-head"><span>' +
        App.esc(group.hint) +
        "</span></div>" +
        '<div class="year-token-row">' +
        yearTokens +
        "</div>" +
        '<div class="subject-checks">' +
        (checks || '<span class="correlation-empty">No hay otras materias.</span>') +
        "</div></div>"
      );
    }).join("");
  }

  function readCorrelations() {
    var result = {};
    App.CORR_GROUPS.forEach(function (group) {
      var panel = App.$('[data-corr-panel="' + group.key + '"]');
      if (!panel) {
        result[group.key] = { subjects: [], years: [] };
        return;
      }
      result[group.key] = {
        subjects: App.$$("[data-subject-check]:checked", panel).map(function (input) {
          return Number(input.value);
        }),
        years: App.$$("[data-year-check]:checked", panel).map(function (input) {
          return Number(input.value);
        })
      };
    });
    return result;
  }

  App.renderSubjectEvents = function (subjectId) {
    var container = App.$("#subjectEvents");
    if (!container) return;
    var subject = App.subjectById(subjectId);
    if (!subject) {
      container.innerHTML = "";
      return;
    }
    var events = App.getSubjectEvents(subject.id);
    var list = events.length
      ? '<div class="subject-event-list">' +
        events
          .map(function (event) {
            return (
              '<button class="subject-event-chip" type="button" data-action="open-event" data-id="' +
              App.esc(event.id) +
              '"><strong>' +
              App.dateShort(event.date) +
              "</strong>" +
              App.esc(event.type) +
              (event.done ? " · rendido" : "") +
              "</button>"
            );
          })
          .join("") +
        "</div>"
      : '<p class="subject-events-empty">Todavía no hay fechas asociadas a esta materia.</p>';

    container.innerHTML =
      '<div class="subject-events-header"><h3>Fechas de esta materia</h3>' +
      '<button class="panel-link" type="button" data-action="new-event" data-subject="' +
      App.esc(subject.id) +
      '">Agregar fecha ' +
      App.icon("plus", "icon--tiny") +
      "</button></div>" +
      list;
  };

  App.openSubjectDialog = function (id, options) {
    options = options || {};
    var subject = id ? App.subjectById(id) : null;
    if (id && !subject) {
      App.toast("No encontramos la materia", "Puede que se haya eliminado.", "error");
      return;
    }

    App.currentSubjectId = subject ? subject.id : null;
    App.currentCorrelationTab = "cursarRegular";
    var isNew = !subject;
    var status = options.status || (subject ? subject.status : "pendiente");
    var correlations = subject
      ? App.cloneCorrelations(subject.correlations)
      : App.emptyCorrelations();

    App.$("#subjectId").value = subject ? subject.id : "";
    App.$("#subjectMode").value = isNew ? "create" : "edit";
    App.$("#subjectDialogKicker").textContent = isNew
      ? "Nuevo espacio curricular"
      : "Espacio curricular · N.º " + App.pad2(subject.number);
    App.$("#subjectDialogTitle").textContent = isNew
      ? "Agregar materia"
      : subject.name;
    App.$("#subjectName").value = isNew ? options.name || "" : subject.name;
    App.$("#subjectYear").value = String(
      options.year || (subject ? subject.year : 1)
    );
    App.$("#subjectType").value = subject ? subject.code : "M";
    App.$("#subjectPeriod").value = subject ? subject.period : "";
    App.$("#subjectGrade").value = subject ? subject.grade : "";
    App.$("#subjectCursadaDate").value = subject ? subject.cursadaDate : "";
    App.$("#subjectApprovedDate").value = subject ? subject.approvedDate : "";
    App.$("#subjectNotes").value = subject ? subject.notes : "";

    var radio = App.$('input[name="status"][value="' + status + '"]');
    if (radio) radio.checked = true;
    App.syncSubjectStatusFields(
      status,
      options.start === true || options.status === "cursando"
    );

    App.$("#deleteSubjectButton").hidden = isNew;
    App.$("#subjectAdvanced").open = false;
    App.$("#subjectEvents").hidden = isNew;
    renderCorrelationDisplay(correlations);
    renderCorrelationEditor(correlations, subject);
    if (!isNew) App.renderSubjectEvents(subject.id);

    App.showDialog(App.$("#subjectDialog"));
    if (options.focusNotes) {
      setTimeout(function () {
        var notes = App.$("#subjectNotes");
        notes.focus();
        notes.setSelectionRange(notes.value.length, notes.value.length);
      }, 80);
    } else {
      var nameInput = App.$("#subjectName");
      if (isNew) {
        setTimeout(function () {
          nameInput.focus();
        }, 80);
      }
    }
  };

  App.saveSubject = function () {
    var form = App.$("#subjectForm");
    if (!form.reportValidity()) return;

    var name = App.$("#subjectName").value.trim();
    if (!name) {
      App.$("#subjectName").setCustomValidity("Escribí un nombre para la materia.");
      form.reportValidity();
      App.$("#subjectName").setCustomValidity("");
      return;
    }

    var id = App.$("#subjectId").value;
    var mode = App.$("#subjectMode").value;
    var existing = mode === "edit" ? App.subjectById(id) : null;
    var now = new Date().toISOString();
    var status =
      (App.$('input[name="status"]:checked') || {}).value || "pendiente";
    var cursadaDate = App.$("#subjectCursadaDate").value;
    var approvedDate = App.$("#subjectApprovedDate").value;
    var notes = App.$("#subjectNotes").value;

    var subject = existing;
    if (!subject) {
      var maxNumber = App.state.subjects.reduce(function (max, item) {
        return Math.max(max, Number(item.number) || 0);
      }, 0);
      subject = {
        id: App.uid("sub"),
        number: maxNumber + 1,
        official: false,
        createdAt: now
      };
      App.state.subjects.push(subject);
    }

    subject.name = name;
    subject.year = parseInt(App.$("#subjectYear").value, 10) || 1;
    subject.code = App.$("#subjectType").value;
    subject.period = App.$("#subjectPeriod").value;
    subject.status = status;
    subject.grade = App.$("#subjectGrade").value;
    subject.cursadaDate = cursadaDate;
    subject.approvedDate = approvedDate;
    App.applyStatusDates(subject, status);
    if (subject.notes !== notes) subject.notesUpdatedAt = now;
    subject.notes = notes;
    subject.correlations = readCorrelations();
    subject.updatedAt = now;

    App.closeDialog(App.$("#subjectDialog"));
    App.currentSubjectId = null;
    App.persistState();
    App.renderShell();
    App.renderPage();
    App.toast(
      existing ? "Materia actualizada" : "Materia agregada",
      existing
        ? subject.name + " se guardó correctamente."
        : subject.name + " ya forma parte de tu plan."
    );
  };

  App.deleteSubject = function () {
    var subject = App.subjectById(App.currentSubjectId);
    if (!subject) return;
    var references = 0;
    var eventCount = App.state.events.filter(function (event) {
      return event.subjectId === subject.id;
    }).length;
    App.state.subjects.forEach(function (item) {
      if (item.id === subject.id) return;
      App.CORR_GROUPS.forEach(function (group) {
        var rule = item.correlations[group.key];
        if (rule && rule.subjects.indexOf(Number(subject.number)) >= 0) references += 1;
      });
    });

    App.confirmAction({
      kicker: "Eliminar del plan",
      title: "¿Eliminar esta materia?",
      message:
        "Se eliminará “" +
        subject.name +
        "” de tu plan." +
        (references
          ? " También se quitarán " +
            references +
            " referencias en correlatividades de otras materias."
          : "") +
        (eventCount
          ? " Sus " +
            eventCount +
            " fechas asociadas se conservarán, pero quedarán sin materia."
          : ""),
      confirmText: "Eliminar materia",
      danger: true
    }).then(function (confirmed) {
      if (!confirmed) return;
      var stamp = new Date().toISOString();
      App.state.subjects = App.state.subjects.filter(function (item) {
        return item.id !== subject.id;
      });
      App.state.deleted = App.normalizeTombstones(App.state.deleted);
      App.state.deleted.subjects[subject.id] = stamp;
      App.state.subjects.forEach(function (item) {
        var touched = false;
        App.CORR_GROUPS.forEach(function (group) {
          var rule = item.correlations[group.key];
          if (!rule) return;
          var before = rule.subjects.length;
          rule.subjects = rule.subjects.filter(function (number) {
            return Number(number) !== Number(subject.number);
          });
          if (rule.subjects.length !== before) touched = true;
        });
        if (touched) item.updatedAt = stamp;
      });
      App.state.events.forEach(function (event) {
        if (event.subjectId === subject.id) {
          event.subjectId = null;
          event.updatedAt = stamp;
        }
      });
      App.closeDialog(App.$("#subjectDialog"));
      App.currentSubjectId = null;
      App.persistState();
      App.renderShell();
      App.renderPage();
      App.toast("Materia eliminada", subject.name + " se quitó del plan.");
    });
  };
})();
