/* =========================================================
   Trayecto · Interfaz compartida: avisos y diálogos
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;

  App.toast = function (title, message, type) {
    var region = App.$("#toastRegion");
    if (!region) return;
    type = type || "success";
    var toast = document.createElement("div");
    toast.className = "toast" + (type === "error" ? " toast--error" : "");
    toast.innerHTML =
      '<span class="toast-icon">' +
      App.icon(type === "error" ? "alert" : "check", "icon--small") +
      "</span>" +
      '<span class="toast-copy"><strong>' +
      App.esc(title) +
      "</strong>" +
      (message ? "<span>" + App.esc(message) + "</span>" : "") +
      "</span>" +
      '<button class="toast-close" type="button" aria-label="Cerrar aviso">' +
      App.icon("close", "icon--small") +
      "</button>";

    var remove = function () {
      if (!toast.parentNode) return;
      toast.classList.add("is-leaving");
      setTimeout(function () {
        toast.remove();
      }, 230);
    };

    toast.querySelector(".toast-close").addEventListener("click", remove);
    region.appendChild(toast);
    setTimeout(remove, type === "error" ? 6500 : 4200);
  };

  App.updateBodyLock = function () {
    var openDialog = document.querySelector("dialog[open]");
    document.body.classList.toggle("is-locked", !!openDialog);
  };

  App.showDialog = function (dialog) {
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    App.updateBodyLock();
  };

  App.closeDialog = function (dialog) {
    if (!dialog) return;
    if (dialog.open) dialog.close();
    App.updateBodyLock();
  };

  App.confirmAction = function (options) {
    options = options || {};
    var dialog = App.$("#confirmDialog");
    var accept = App.$("#confirmAccept");
    var title = App.$("#confirmTitle");
    var kicker = App.$("#confirmKicker");
    var message = App.$("#confirmMessage");

    title.textContent = options.title || "¿Estás seguro?";
    kicker.textContent = options.kicker || "Confirmar acción";
    message.textContent = options.message || "Esta acción no se puede deshacer.";
    accept.textContent = options.confirmText || "Confirmar";
    accept.className = "button " + (options.danger ? "button--danger-solid" : "button--primary");

    return new Promise(function (resolve) {
      App.confirmResolver = resolve;
      accept.onclick = function () {
        var finish = App.confirmResolver;
        App.confirmResolver = null;
        App.closeDialog(dialog);
        if (finish) finish(true);
      };
      App.showDialog(dialog);
    });
  };

  App.exportCalendar = function () {
    var events = App.state.events.slice().sort(function (a, b) {
      return (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""));
    });
    var stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Trayecto//Seguimiento academico//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Trayecto - Profesorado de Matemática"
    ];

    var escapeICS = function (text) {
      return String(text || "")
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
    };

    events.forEach(function (event) {
      var subject = event.subjectId ? App.subjectById(event.subjectId) : null;
      var start = event.date.replace(/-/g, "");
      var endDate;
      if (event.time) {
        var time = event.time.replace(":", "") + "00";
        lines.push("BEGIN:VEVENT");
        lines.push("UID:" + event.id + "@trayecto");
        lines.push("DTSTAMP:" + stamp);
        lines.push("DTSTART:" + start + "T" + time);
        var startDate = App.parseISO(event.date);
        startDate.setHours(
          Number(event.time.slice(0, 2)),
          Number(event.time.slice(3, 5)) + 60,
          0,
          0
        );
        endDate =
          App.toISO(startDate).replace(/-/g, "") +
          "T" +
          App.pad2(startDate.getHours()) +
          App.pad2(startDate.getMinutes()) +
          "00";
        lines.push("DTEND:" + endDate);
      } else {
        var nextDay = App.parseISO(event.date);
        nextDay.setDate(nextDay.getDate() + 1);
        lines.push("BEGIN:VEVENT");
        lines.push("UID:" + event.id + "@trayecto");
        lines.push("DTSTAMP:" + stamp);
        lines.push("DTSTART;VALUE=DATE:" + start);
        lines.push("DTEND;VALUE=DATE:" + App.toISO(nextDay).replace(/-/g, ""));
      }
      lines.push("SUMMARY:" + escapeICS(event.title));
      lines.push(
        "DESCRIPTION:" +
          escapeICS(
            [
              event.type,
              subject ? subject.name : "",
              event.notes || "",
              event.done ? "Marcado como rendido/entregado" : ""
            ]
              .filter(Boolean)
              .join(" · ")
          )
      );
      if (subject) lines.push("CATEGORIES:" + escapeICS(subject.name));
      lines.push("STATUS:CONFIRMED");
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");
    App.downloadFile(
      "trayecto-calendario-" + App.todayISO() + ".ics",
      lines.join("\r\n"),
      "text/calendar;charset=utf-8"
    );
  };
})();
