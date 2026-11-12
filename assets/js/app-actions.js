/* =========================================================
   Trayecto · Acciones, navegación e inicio
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;

  App.refresh = function () {
    App.persistState();
    App.renderShell();
    App.renderPage();
  };

  function routeFromHash() {
    var raw = String(window.location.hash || "")
      .replace(/^#\/?/, "")
      .split("?")[0];
    return App.ROUTES[raw] ? raw : "panel";
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    var button = App.$("#menuButton");
    if (button) button.setAttribute("aria-expanded", "false");
  }

  function openSidebar() {
    document.body.classList.add("sidebar-open");
    var button = App.$("#menuButton");
    if (button) button.setAttribute("aria-expanded", "true");
  }

  function go(route) {
    if (!App.ROUTES[route]) route = "panel";
    if (window.location.hash === "#/" + route) {
      App.ui.route = route;
      App.renderShell();
      App.renderPage();
      window.scrollTo(0, 0);
    } else {
      window.location.hash = "#/" + route;
    }
  }

  function onRouteChange() {
    var next = routeFromHash();
    var changed = next !== App.ui.route;
    App.ui.route = next;
    closeSidebar();
    App.renderShell();
    App.renderPage();
    if (changed) window.scrollTo(0, 0);
  }

  function rerenderPlanWithFocus() {
    var current = document.activeElement;
    var wasSearch = current && current.id === "planSearch";
    var position = wasSearch ? current.selectionStart : null;
    App.renderPlan();
    if (wasSearch) {
      var next = App.$("#planSearch");
      if (next) {
        next.focus();
        try {
          next.setSelectionRange(position, position);
        } catch (error) {
          /* el input search puede no soportar selección en algunos navegadores */
        }
      }
    }
  }

  function rerenderNotesWithFocus() {
    var current = document.activeElement;
    var wasSearch = current && current.id === "notesSearch";
    var position = wasSearch ? current.selectionStart : null;
    App.renderNotes();
    if (wasSearch) {
      var next = App.$("#notesSearch");
      if (next) {
        next.focus();
        try {
          next.setSelectionRange(position, position);
        } catch (error) {
          /* sin acción */
        }
      }
    }
  }

  function setPlanFilter(key, value) {
    App.ui.plan[key] = value;
    App.renderPlan();
  }

  function clearPlanFilters() {
    App.ui.plan = { query: "", year: "all", status: "all", type: "all" };
    App.renderPlan();
  }

  function quickStatus(id, status) {
    var subject = App.subjectById(id);
    if (!subject || !App.STATUS_META[status]) return;
    var previousPercent = App.getStats().percent;
    if (subject.status === status) return;

    subject.status = status;
    if (status === "cursando" || status === "regular") {
      if (!subject.cursadaDate) subject.cursadaDate = App.todayISO();
    }
    if (status === "aprobada" && !subject.approvedDate) {
      subject.approvedDate = App.todayISO();
    }
    App.applyStatusDates(subject, status);
    subject.updatedAt = new Date().toISOString();
    App.refresh();
    App.toast(
      App.statusLabel(status),
      subject.name + " ahora figura como " + App.statusLabel(status).toLowerCase() + "."
    );

    var percent = App.getStats().percent;
    if (previousPercent < 100 && percent === 100) {
      setTimeout(function () {
        App.toast("¡Plan completo!", "Aprobaste todos los espacios curriculares.");
      }, 500);
    }
  }

  function exportJSON() {
    var payload = {
      app: "Trayecto",
      schema: 1,
      exportedAt: new Date().toISOString(),
      state: App.state
    };
    App.downloadFile(
      "trayecto-respaldo-" + App.todayISO() + ".json",
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8"
    );
    App.toast("Respaldo exportado", "Guardá el archivo en un lugar seguro.");
  }

  function importJSONFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var imported;
      try {
        imported = App.normalizeState(JSON.parse(String(reader.result)));
      } catch (error) {
        App.toast("No se pudo importar", error.message || "El archivo no es válido.", "error");
        return;
      }
      App.confirmAction({
        kicker: "Importar respaldo",
        title: "¿Reemplazar tus datos actuales?",
        message:
          "Se van a reemplazar las materias, los estados, las observaciones y el calendario por el contenido del archivo. Esta acción no se puede deshacer.",
        confirmText: "Importar y reemplazar"
      }).then(function (confirmed) {
        if (!confirmed) return;
        App.state = imported;
        App.ui.plan = { query: "", year: "all", status: "all", type: "all" };
        App.ui.notesQuery = "";
        App.persistState();
        if (window.location.hash !== "#/panel") {
          window.location.hash = "#/panel";
        } else {
          App.ui.route = "panel";
          App.renderShell();
          App.renderPage();
        }
        App.toast("Respaldo importado", "Tus datos se restauraron correctamente.");
      });
    };
    reader.onerror = function () {
      App.toast("No se pudo leer el archivo", "Probá nuevamente.", "error");
    };
    reader.readAsText(file);
  }

  function restoreOfficialPlan() {
    App.confirmAction({
      kicker: "Plan oficial",
      title: "¿Restaurar la estructura del plan?",
      message:
        "Se recuperan las 40 materias y sus correlatividades oficiales. Las materias personalizadas se eliminan. Se conservan estados, notas, notas finales y fechas de las materias oficiales que coincidan.",
      confirmText: "Restaurar plan"
    }).then(function (confirmed) {
      if (!confirmed) return;
      var previous = {};
      App.state.subjects.forEach(function (subject) {
        previous[subject.id] = subject;
      });
      var now = new Date().toISOString();
      var subjects = App.PLAN.subjects.map(function (official) {
        var restored = App.createSubjectFromOfficial(official);
        var old = previous[restored.id];
        restored.createdAt = now;
        restored.updatedAt = now;
        if (old) {
          restored.status = old.status;
          restored.grade = old.grade;
          restored.cursadaDate = old.cursadaDate;
          restored.approvedDate = old.approvedDate;
          restored.period = old.period;
          restored.notes = old.notes;
          restored.notesUpdatedAt = old.notesUpdatedAt;
          restored.createdAt = old.createdAt || now;
        }
        return restored;
      });
      var validIds = {};
      subjects.forEach(function (subject) {
        validIds[subject.id] = true;
      });
      App.state.subjects = subjects;
      App.state.events.forEach(function (event) {
        if (event.subjectId && !validIds[event.subjectId]) event.subjectId = null;
      });
      App.closeDialog(App.$("#subjectDialog"));
      App.currentSubjectId = null;
      App.persistState();
      App.renderShell();
      App.renderPage();
      App.toast("Plan restaurado", "La estructura oficial volvió a estar disponible.");
    });
  }

  function resetAll() {
    App.confirmAction({
      kicker: "Zona sensible",
      title: "¿Borrar todos los datos?",
      message:
        "Se eliminarán tu perfil, los estados de las materias, las observaciones, las fechas y cualquier materia personalizada de este navegador. Esta acción no se puede deshacer.",
      confirmText: "Borrar todo",
      danger: true
    }).then(function (confirmed) {
      if (!confirmed) return;
      App.$$("dialog[open]").forEach(function (dialog) {
        dialog.close();
      });
      App.state = App.createInitialState();
      App.persistState();
      App.ui.plan = { query: "", year: "all", status: "all", type: "all" };
      App.ui.notesQuery = "";
      var now = new Date();
      App.ui.calendar.month = new Date(now.getFullYear(), now.getMonth(), 1);
      App.currentSubjectId = null;
      closeSidebar();
      if (window.location.hash !== "#/panel") {
        window.location.hash = "#/panel";
      } else {
        App.ui.route = "panel";
        App.renderShell();
        App.renderPage();
      }
      App.updateBodyLock();
      App.toast("Datos borrados", "El plan quedó listo para empezar de nuevo.");
    });
  }

  function shiftCalendarMonth(delta) {
    var month = App.ui.calendar.month || new Date();
    App.ui.calendar.month = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    App.renderCalendar();
  }

  function writeNote() {
    var picker = App.$("#noteSubjectPicker");
    var id = picker ? picker.value : "";
    if (!id) {
      App.toast("Elegí una materia", "Seleccioná una materia para escribir una observación.", "error");
      if (picker) picker.focus();
      return;
    }
    App.openSubjectDialog(id, { focusNotes: true });
  }

  function handleAction(action, element) {
    switch (action) {
      case "open-subject":
        App.openSubjectDialog(element.dataset.id, {
          start: element.dataset.start === "1",
          focusNotes: element.dataset.focusNotes === "1"
        });
        break;
      case "add-subject":
        App.openSubjectDialog(null, {
          year: App.ui.plan.year !== "all" ? Number(App.ui.plan.year) : 1
        });
        break;
      case "new-event-day":
        App.openEventDialog(null, { date: element.dataset.date });
        break;
      case "new-event":
        App.openEventDialog(null, {
          date: element.dataset.date,
          subjectId: element.dataset.subject
        });
        break;
      case "open-event":
        App.openEventDialog(element.dataset.id);
        break;
      case "set-status":
        quickStatus(element.dataset.id, element.dataset.status);
        break;
      case "open-year":
        App.ui.plan = {
          query: "",
          year: String(element.dataset.year),
          status: "all",
          type: "all"
        };
        go("plan");
        break;
      case "filter-year":
        setPlanFilter("year", element.dataset.year);
        break;
      case "clear-plan-filters":
        clearPlanFilters();
        break;
      case "clear-notes-search":
        App.ui.notesQuery = "";
        App.renderNotes();
        break;
      case "calendar-prev":
        shiftCalendarMonth(-1);
        break;
      case "calendar-next":
        shiftCalendarMonth(1);
        break;
      case "calendar-today":
        var today = new Date();
        App.ui.calendar.month = new Date(today.getFullYear(), today.getMonth(), 1);
        App.renderCalendar();
        break;
      case "open-plan-info":
        App.renderPlanInfo();
        App.showDialog(App.$("#planInfoDialog"));
        break;
      case "open-sync":
        App.openSyncDialog();
        break;
      case "open-sync-login":
        App.openSyncDialog("login");
        break;
      case "open-sync-register":
        App.openSyncDialog("register");
        break;
      case "sync-now":
        App.sync.now({ silent: false, announce: true });
        break;
      case "sync-logout":
        App.syncLogout();
        break;
      case "sync-password":
        App.syncPassword();
        break;
      case "sync-password-cancel":
        App.cancelSyncPassword();
        break;
      case "go-settings":
        go("ajustes");
        break;
      case "write-note":
        writeNote();
        break;
      case "export-json":
        exportJSON();
        break;
      case "import-json":
        App.$("#importFileInput").click();
        break;
      case "export-ics":
        App.exportCalendar();
        App.toast("Calendario exportado", "El archivo .ics está listo para importar en tu agenda.");
        break;
      case "restore-plan":
        restoreOfficialPlan();
        break;
      case "reset-all":
        resetAll();
        break;
      case "open-sidebar":
        openSidebar();
        break;
      case "close-sidebar":
        closeSidebar();
        break;
      default:
        break;
    }
  }

  function handleClick(event) {
    var closer = event.target.closest("[data-close-dialog]");
    if (closer) {
      App.closeDialog(App.$("#" + closer.dataset.closeDialog));
      return;
    }

    if (event.target.closest("[data-confirm-cancel]")) {
      App.closeDialog(App.$("#confirmDialog"));
      return;
    }

    if (event.target.closest("#menuButton")) {
      openSidebar();
      return;
    }

    if (event.target.closest("#sidebarClose") || event.target.closest("#sidebarOverlay")) {
      closeSidebar();
      return;
    }

    if (event.target.closest(".nav-item") || event.target.closest(".brand")) {
      closeSidebar();
    }

    var actionElement = event.target.closest("[data-action]");
    if (actionElement) {
      event.preventDefault();
      handleAction(actionElement.dataset.action, actionElement);
    }

    if (!event.target.closest(".status-menu")) {
      App.$$(".status-menu[open]").forEach(function (menu) {
        menu.open = false;
      });
    }
  }

  function handleInput(event) {
    if (event.target.id === "planSearch") {
      var value = event.target.value;
      clearTimeout(App.searchTimer);
      App.searchTimer = setTimeout(function () {
        App.ui.plan.query = value;
        rerenderPlanWithFocus();
      }, 160);
      return;
    }

    if (event.target.id === "notesSearch") {
      var noteValue = event.target.value;
      clearTimeout(App.notesTimer);
      App.notesTimer = setTimeout(function () {
        App.ui.notesQuery = noteValue;
        rerenderNotesWithFocus();
      }, 160);
      return;
    }

    if (event.target.id === "generalNote") {
      App.state.generalNote = event.target.value;
      App.state.generalNoteUpdatedAt = new Date().toISOString();
      App.persistState();
      var label = App.$("#journalSaveState");
      if (label) {
        label.innerHTML = App.icon("clock", "icon--tiny") + "Guardando…";
      }
      clearTimeout(App.saveNoteTimer);
      App.saveNoteTimer = setTimeout(function () {
        var currentLabel = App.$("#journalSaveState");
        if (currentLabel) {
          currentLabel.innerHTML = App.icon("check", "icon--tiny") + "Guardado";
        }
      }, 450);
    }
  }

  function handleChange(event) {
    if (event.target.id === "planStatus") {
      setPlanFilter("status", event.target.value);
      return;
    }
    if (event.target.id === "planType") {
      setPlanFilter("type", event.target.value);
      return;
    }
    if (event.target.name === "status") {
      App.syncSubjectStatusFields(event.target.value, true);
      return;
    }
    if (event.target.id === "eventSubject") {
      var subjectId = event.target.value;
      var subject = subjectId ? App.subjectById(subjectId) : null;
      App.$("#eventTitle").placeholder = subject
        ? "Ej. Parcial de " + subject.name
        : "Ej. Parcial de Cálculo 2";
    }
  }

  function handleSubmit(event) {
    if (event.target.id === "subjectForm") {
      event.preventDefault();
      App.saveSubject();
      return;
    }
    if (event.target.id === "eventForm") {
      event.preventDefault();
      App.saveEvent();
      return;
    }
    if (event.target.id === "profileForm") {
      event.preventDefault();
      var form = event.target;
      if (!form.reportValidity()) return;
      App.state.profile.name = App.$("#profileName").value.trim();
      var startYear = App.$("#profileStartYear").value;
      App.state.profile.startYear = startYear ? parseInt(startYear, 10) : "";
      App.state.profile.institution =
        App.$("#profileInstitution").value.trim() || App.PLAN.institution;
      App.persistState();
      App.renderShell();
      App.renderPage();
      App.toast("Perfil actualizado", "Tus datos se guardaron en este dispositivo.");
    }
  }

  function bindEvents() {
    window.addEventListener("hashchange", onRouteChange);
    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("submit", handleSubmit);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeSidebar();
        App.$$(".status-menu[open]").forEach(function (menu) {
          menu.open = false;
        });
      }
    });

    document.addEventListener("click", function (event) {
      var tab = event.target.closest("[data-corr-tab]");
      if (!tab) return;
      App.currentCorrelationTab = tab.dataset.corrTab;
      App.$$("[data-corr-tab]").forEach(function (button) {
        var active = button === tab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      App.$$("[data-corr-panel]").forEach(function (panel) {
        panel.classList.toggle(
          "is-active",
          panel.dataset.corrPanel === App.currentCorrelationTab
        );
      });
    });

    App.$$("dialog").forEach(function (dialog) {
      dialog.addEventListener("close", function () {
        if (dialog.id === "confirmDialog" && App.confirmResolver) {
          var resolve = App.confirmResolver;
          App.confirmResolver = null;
          resolve(false);
        }
        if (dialog.id === "subjectDialog") {
          App.currentSubjectId = null;
        }
        App.updateBodyLock();
      });
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) App.closeDialog(dialog);
      });
    });

    var deleteSubject = App.$("#deleteSubjectButton");
    if (deleteSubject) deleteSubject.addEventListener("click", App.deleteSubject);

    var deleteEvent = App.$("#deleteEventButton");
    if (deleteEvent) deleteEvent.addEventListener("click", App.deleteEvent);

    var importInput = App.$("#importFileInput");
    if (importInput) {
      importInput.addEventListener("change", function () {
        var file = importInput.files && importInput.files[0];
        importInput.value = "";
        if (file) importJSONFile(file);
      });
    }

    window.addEventListener("storage", function (event) {
      if (event.key !== App.STORAGE_KEY || !event.newValue) return;
      try {
        App.state = App.normalizeState(JSON.parse(event.newValue));
        App.renderShell();
        App.renderPage();
        App.toast("Datos actualizados", "Se sincronizaron los cambios de otra pestaña.");
      } catch (error) {
        console.warn("No se pudieron sincronizar los datos:", error);
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden" && App.state) App.persistState();
    });
  }

  function init() {
    App.state = App.loadState();
    var today = new Date();
    App.ui.calendar.month = new Date(today.getFullYear(), today.getMonth(), 1);
    bindEvents();

    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/panel");
    }
    App.ui.route = routeFromHash();
    App.renderShell();
    App.renderPage();
    App.updateBodyLock();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
