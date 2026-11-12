/* =========================================================
   Trayecto · Diálogo de eventos del calendario
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;

  function updateEventTitlePlaceholder() {
    var subjectId = App.$("#eventSubject").value;
    var subject = subjectId ? App.subjectById(subjectId) : null;
    App.$("#eventTitle").placeholder = subject
      ? "Ej. Parcial de " + subject.name
      : "Ej. Parcial de Cálculo 2";
  }

  App.openEventDialog = function (id, options) {
    options = options || {};
    var event = id
      ? App.state.events.find(function (item) {
          return item.id === id;
        })
      : null;
    if (id && !event) {
      App.toast("No encontramos el evento", "Puede que se haya eliminado.", "error");
      return;
    }

    var form = App.$("#eventForm");
    form.reset();
    var isEdit = !!event;
    var subjectId = event
      ? event.subjectId || ""
      : options.subjectId || "";

    App.$("#eventId").value = event ? event.id : "";
    App.$("#eventMode").value = isEdit ? "edit" : "create";
    App.$("#eventDialogKicker").textContent = isEdit
      ? "Calendario académico · Editar"
      : "Calendario académico";
    App.$("#eventDialogTitle").textContent = isEdit ? "Editar evento" : "Nuevo evento";
    App.$("#eventSubject").innerHTML = App.subjectOptions(subjectId, true);
    App.$("#eventType").value = event ? event.type : options.type || "Parcial";
    App.$("#eventTitle").value = event ? event.title : options.title || "";
    App.$("#eventDate").value = event ? event.date : options.date || App.todayISO();
    App.$("#eventTime").value = event ? event.time : options.time || "";
    App.$("#eventNotes").value = event ? event.notes : options.notes || "";
    App.$("#eventDone").checked = event ? event.done : false;
    App.$("#eventDoneRow").hidden = !isEdit;
    App.$("#deleteEventButton").hidden = !isEdit;
    updateEventTitlePlaceholder();

    App.showDialog(App.$("#eventDialog"));
  };

  App.saveEvent = function () {
    var form = App.$("#eventForm");
    if (!form.reportValidity()) return;

    var title = App.$("#eventTitle").value.trim();
    if (!title) {
      App.$("#eventTitle").setCustomValidity("Escribí un título para el evento.");
      form.reportValidity();
      App.$("#eventTitle").setCustomValidity("");
      return;
    }

    var id = App.$("#eventId").value;
    var mode = App.$("#eventMode").value;
    var existing = mode === "edit"
      ? App.state.events.find(function (item) {
          return item.id === id;
        })
      : null;
    var event = existing;
    if (!event) {
      event = { id: App.uid("evt"), createdAt: new Date().toISOString() };
      App.state.events.push(event);
    }

    event.title = title;
    event.type = App.$("#eventType").value;
    event.subjectId = App.$("#eventSubject").value || null;
    event.date = App.$("#eventDate").value;
    event.time = App.$("#eventTime").value;
    event.notes = App.$("#eventNotes").value;
    event.done = App.$("#eventDone").checked;
    event.updatedAt = new Date().toISOString();

    App.closeDialog(App.$("#eventDialog"));
    if (App.ui.route === "calendario") {
      var date = App.parseISO(event.date);
      App.ui.calendar.month = new Date(date.getFullYear(), date.getMonth(), 1);
    }
    App.persistState();
    App.renderShell();
    App.renderPage();
    if (App.currentSubjectId) App.renderSubjectEvents(App.currentSubjectId);
    App.toast(
      existing ? "Evento actualizado" : "Fecha agregada",
      title + " · " + App.dateLong(event.date)
    );
  };

  App.deleteEvent = function () {
    var id = App.$("#eventId").value;
    var event = App.state.events.find(function (item) {
      return item.id === id;
    });
    if (!event) return;

    App.confirmAction({
      kicker: "Eliminar del calendario",
      title: "¿Eliminar este evento?",
      message:
        "Se eliminará “" + event.title + "” del " + App.dateLong(event.date) + ".",
      confirmText: "Eliminar evento",
      danger: true
    }).then(function (confirmed) {
      if (!confirmed) return;
      App.state.events = App.state.events.filter(function (item) {
        return item.id !== event.id;
      });
      App.state.deleted = App.normalizeTombstones(App.state.deleted);
      App.state.deleted.events[event.id] = new Date().toISOString();
      App.closeDialog(App.$("#eventDialog"));
      App.persistState();
      App.renderShell();
      App.renderPage();
      if (App.currentSubjectId) App.renderSubjectEvents(App.currentSubjectId);
      App.toast("Evento eliminado", "La fecha se quitó del calendario.");
    });
  };
})();
