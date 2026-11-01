/* =========================================================
   Trayecto · Estado, persistencia y cálculos
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;

  App.createSubjectFromOfficial = function (official) {
    return {
      id: "s" + App.pad2(official.number),
      number: official.number,
      name: official.name,
      year: official.year,
      code: official.code,
      period: official.period || "",
      status: "pendiente",
      grade: "",
      cursadaDate: "",
      approvedDate: "",
      notes: "",
      notesUpdatedAt: "",
      official: true,
      correlations: App.cloneCorrelations(official.correlations),
      createdAt: "",
      updatedAt: ""
    };
  };

  App.emptyCorrelations = function () {
    return {
      cursarRegular: { subjects: [], years: [] },
      cursarPromocion: { subjects: [], years: [] },
      finalRegular: { subjects: [], years: [] },
      finalPromocion: { subjects: [], years: [] }
    };
  };

  App.cloneCorrelations = function (correlations) {
    var source = correlations || App.emptyCorrelations();
    var output = {};
    App.CORR_GROUPS.forEach(function (group) {
      var rule = source[group.key] || {};
      output[group.key] = {
        subjects: (rule.subjects || []).map(Number).filter(function (n) {
          return Number.isFinite(n);
        }),
        years: (rule.years || []).map(Number).filter(function (n) {
          return n >= 1 && n <= 4;
        })
      };
    });
    return output;
  };

  App.createInitialState = function () {
    var now = new Date().toISOString();
    return {
      version: 1,
      createdAt: now,
      updatedAt: now,
      profile: {
        name: "",
        startYear: "",
        institution: App.PLAN.institution,
        career: App.PLAN.career
      },
      subjects: App.PLAN.subjects.map(function (official) {
        var subject = App.createSubjectFromOfficial(official);
        subject.createdAt = now;
        subject.updatedAt = now;
        return subject;
      }),
      events: [],
      generalNote: "",
      generalNoteUpdatedAt: ""
    };
  };

  App.normalizeState = function (candidate) {
    if (candidate && candidate.state && candidate.state.subjects) {
      candidate = candidate.state;
    }
    if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.subjects)) {
      throw new Error("El archivo no tiene una estructura de Trayecto válida.");
    }
    if (!candidate.subjects.length) {
      throw new Error("El respaldo no contiene materias.");
    }

    var now = new Date().toISOString();
    var seenIds = {};
    var seenNumbers = {};
    var maxNumber = 0;

    candidate.subjects.forEach(function (subject) {
      var number = Number(subject && subject.number);
      if (Number.isFinite(number)) maxNumber = Math.max(maxNumber, number);
    });

    var subjects = candidate.subjects.map(function (raw, index) {
      raw = raw || {};
      var number = Number(raw.number);
      if (!Number.isFinite(number) || number <= 0) number = index + 1;
      if (seenNumbers[number]) {
        maxNumber += 1;
        number = maxNumber;
      }
      seenNumbers[number] = true;
      maxNumber = Math.max(maxNumber, number);

      var id = String(raw.id || "s" + App.pad2(number));
      if (seenIds[id]) id = App.uid("sub");
      seenIds[id] = true;

      var code = String(raw.code || raw.type || "M").toUpperCase();
      if (code === "MATERIA" || code === "M") code = "M";
      else if (code === "TALLER" || code === "T") code = "T";
      else if (code === "SEMINARIO" || code === "S") code = "S";
      else code = "M";

      var status = String(raw.status || "pendiente");
      if (!App.STATUS_META[status]) status = "pendiente";

      var year = parseInt(raw.year, 10);
      if (!year || year < 1 || year > 4) year = 1;

      var period = String(raw.period || "");
      if (!Object.prototype.hasOwnProperty.call(App.PERIOD_META, period)) period = "";

      return {
        id: id,
        number: number,
        name: String(raw.name || "Materia sin nombre").trim(),
        year: year,
        code: code,
        period: period,
        status: status,
        grade:
          raw.grade === null || raw.grade === undefined || raw.grade === ""
            ? ""
            : String(raw.grade),
        cursadaDate: App.parseISO(raw.cursadaDate) ? raw.cursadaDate : "",
        approvedDate: App.parseISO(raw.approvedDate) ? raw.approvedDate : "",
        notes: String(raw.notes || ""),
        notesUpdatedAt: raw.notesUpdatedAt || "",
        official: !!raw.official,
        correlations: App.cloneCorrelations(raw.correlations),
        createdAt: raw.createdAt || now,
        updatedAt: raw.updatedAt || now
      };
    });

    var subjectIds = {};
    subjects.forEach(function (subject) {
      subjectIds[subject.id] = true;
    });

    var seenEventIds = {};
    var events = (Array.isArray(candidate.events) ? candidate.events : [])
      .map(function (raw) {
        raw = raw || {};
        if (!App.parseISO(raw.date)) return null;
        var id = String(raw.id || App.uid("evt"));
        if (seenEventIds[id]) id = App.uid("evt");
        seenEventIds[id] = true;
        var type = ["Parcial", "Final", "Trabajo práctico", "Otro"].indexOf(raw.type) >= 0
          ? raw.type
          : "Otro";
        var time = /^\d{2}:\d{2}$/.test(String(raw.time || "")) ? raw.time : "";
        return {
          id: id,
          title: String(raw.title || "Evento sin título").trim(),
          type: type,
          subjectId: raw.subjectId && subjectIds[raw.subjectId] ? raw.subjectId : null,
          date: raw.date,
          time: time,
          notes: String(raw.notes || ""),
          done: !!raw.done,
          createdAt: raw.createdAt || now
        };
      })
      .filter(Boolean);

    var profile = candidate.profile || {};
    var startYear = parseInt(profile.startYear, 10);
    if (!startYear || startYear < 1900 || startYear > 2200) startYear = "";

    return {
      version: 1,
      createdAt: candidate.createdAt || now,
      updatedAt: candidate.updatedAt || now,
      profile: {
        name: String(profile.name || "").slice(0, 100),
        startYear: startYear,
        institution: String(profile.institution || App.PLAN.institution).slice(0, 160),
        career: String(profile.career || App.PLAN.career).slice(0, 160)
      },
      subjects: subjects,
      events: events,
      generalNote: String(candidate.generalNote || ""),
      generalNoteUpdatedAt: candidate.generalNoteUpdatedAt || ""
    };
  };

  App.loadState = function () {
    var raw;
    try {
      raw = window.localStorage.getItem(App.STORAGE_KEY);
    } catch (error) {
      raw = null;
    }
    if (!raw) return App.createInitialState();
    try {
      return App.normalizeState(JSON.parse(raw));
    } catch (error) {
      console.warn("No se pudieron leer los datos guardados:", error);
      return App.createInitialState();
    }
  };

  App.persistState = function () {
    if (!App.state) return false;
    App.state.updatedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(App.STORAGE_KEY, JSON.stringify(App.state));
      return true;
    } catch (error) {
      if (!App.storageWarned) {
        App.storageWarned = true;
        App.toast(
          "No se pudo guardar",
          "El navegador no permite guardar datos. Revisá el espacio disponible o la configuración de privacidad.",
          "error"
        );
      }
      return false;
    }
  };

  App.subjectById = function (id) {
    return App.state.subjects.find(function (subject) {
      return subject.id === id;
    }) || null;
  };

  App.subjectByNumber = function (number) {
    number = Number(number);
    return App.state.subjects.find(function (subject) {
      return Number(subject.number) === number;
    }) || null;
  };

  App.getYearSubjects = function (year) {
    return App.state.subjects
      .filter(function (subject) {
        return Number(subject.year) === Number(year);
      })
      .sort(function (a, b) {
        return a.number - b.number;
      });
  };

  App.getStats = function (list) {
    var subjects = list || App.state.subjects;
    var approved = 0;
    var regular = 0;
    var cursando = 0;
    var pending = 0;
    subjects.forEach(function (subject) {
      if (subject.status === "aprobada") approved += 1;
      else if (subject.status === "regular") regular += 1;
      else if (subject.status === "cursando") cursando += 1;
      else pending += 1;
    });
    var total = subjects.length;
    return {
      total: total,
      approved: approved,
      regular: regular,
      cursando: cursando,
      active: regular + cursando,
      pending: pending,
      percent: total ? Math.round((approved / total) * 100) : 0
    };
  };

  App.getSubjectEvents = function (subjectId) {
    return App.state.events
      .filter(function (event) {
        return event.subjectId === subjectId;
      })
      .sort(function (a, b) {
        return (a.date + (a.time || "")) .localeCompare(b.date + (b.time || ""));
      });
  };

  App.getUpcomingEvents = function (limit) {
    var today = App.todayISO();
    var events = App.state.events
      .filter(function (event) {
        return !event.done && event.date >= today;
      })
      .sort(function (a, b) {
        return (a.date + (a.time || "00:00")).localeCompare(
          b.date + (b.time || "00:00")
        );
      });
    return typeof limit === "number" ? events.slice(0, limit) : events;
  };

  App.ruleMet = function (rule, level) {
    if (!rule) return true;
    var subjectsOk = (rule.subjects || []).every(function (number) {
      var subject = App.subjectByNumber(number);
      if (!subject) return false;
      if (level === "promotion") return subject.status === "aprobada";
      return subject.status === "regular" || subject.status === "aprobada";
    });
    var yearsOk = (rule.years || []).every(function (year) {
      var yearSubjects = App.getYearSubjects(year);
      if (!yearSubjects.length) return false;
      return yearSubjects.every(function (subject) {
        if (level === "promotion") return subject.status === "aprobada";
        return subject.status === "regular" || subject.status === "aprobada";
      });
    });
    return subjectsOk && yearsOk;
  };

  App.isReadyToCourse = function (subject) {
    if (!subject) return false;
    return App.ruleMet(subject.correlations.cursarRegular, "regular");
  };

  App.correlationsWithRules = function (subject) {
    if (!subject) return [];
    return App.CORR_GROUPS.filter(function (group) {
      var rule = subject.correlations[group.key] || {};
      return (rule.subjects || []).length || (rule.years || []).length;
    });
  };

  App.applyStatusDates = function (subject, status) {
    if (!subject) return;
    if (status === "cursando" || status === "regular" || status === "aprobada") {
      if (!subject.cursadaDate) subject.cursadaDate = App.todayISO();
    }
    if (status === "aprobada" && !subject.approvedDate) {
      subject.approvedDate = App.todayISO();
    }
  };

  App.correlationCount = function (subject) {
    if (!subject) return 0;
    var numbers = {};
    var years = {};
    ["cursarRegular", "cursarPromocion"].forEach(function (key) {
      var rule = subject.correlations[key] || {};
      (rule.subjects || []).forEach(function (number) {
        numbers[number] = true;
      });
      (rule.years || []).forEach(function (year) {
        years[year] = true;
      });
    });
    return Object.keys(numbers).length + Object.keys(years).length;
  };

  App.getFocus = function () {
    var active = App.state.subjects
      .filter(function (subject) {
        return subject.status === "cursando" || subject.status === "regular";
      })
      .sort(function (a, b) {
        if (a.year !== b.year) return a.year - b.year;
        return a.number - b.number;
      });
    if (active.length) {
      return { mode: "active", items: active.slice(0, 4), count: active.length };
    }

    var ready = App.state.subjects
      .filter(function (subject) {
        return subject.status === "pendiente" && App.isReadyToCourse(subject);
      })
      .sort(function (a, b) {
        if (a.year !== b.year) return a.year - b.year;
        return a.number - b.number;
      });
    if (ready.length) {
      return { mode: "ready", items: ready.slice(0, 4), count: ready.length };
    }
    return { mode: "none", items: [], count: 0 };
  };

  App.recentNotes = function (limit) {
    return App.state.subjects
      .filter(function (subject) {
        return subject.notes && subject.notes.trim();
      })
      .sort(function (a, b) {
        return String(b.notesUpdatedAt || b.updatedAt || "").localeCompare(
          String(a.notesUpdatedAt || a.updatedAt || "")
        );
      })
      .slice(0, limit || 4);
  };

  App.subjectOptions = function (selectedId, includeEmpty) {
    var html = includeEmpty ? '<option value="">Sin materia</option>' : "";
    [1, 2, 3, 4].forEach(function (year) {
      var subjects = App.getYearSubjects(year);
      if (!subjects.length) return;
      html += '<optgroup label="' + App.esc(App.yearLabel(year)) + '">';
      subjects.forEach(function (subject) {
        html +=
          '<option value="' +
          App.esc(subject.id) +
          '"' +
          (subject.id === selectedId ? " selected" : "") +
          ">" +
          App.esc(subject.name) +
          "</option>";
      });
      html += "</optgroup>";
    });
    return html;
  };

  App.countWords = function (text) {
    var trimmed = String(text || "").trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  };
})();
