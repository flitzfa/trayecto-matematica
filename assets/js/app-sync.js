/* =========================================================
   Trayecto · Cuenta y sincronización entre dispositivos
   ========================================================= */
(function () {
  "use strict";

  var App = window.TrayectoApp;
  var SESSION_KEY = "trayecto.sync.v1";
  var API =
    window.TRAYECTO_SYNC_API ||
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:3001"
      : "https://trayecto-sync.vercel.app");

  var sync = {
    API: API,
    session: null,
    revision: 0,
    lastSyncedAt: "",
    status: "signed-out",
    busy: false,
    timer: null,
    retryTimer: null,
    pollTimer: null,
    applying: false,
    mode: "login",
    passwordOpen: false
  };
  App.sync = sync;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sessionStore(value) {
    try {
      if (value) window.localStorage.setItem(SESSION_KEY, JSON.stringify(value));
      else window.localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn("No se pudo guardar la sesión:", error);
    }
  }

  function loadSession() {
    try {
      var raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.token || !parsed.username) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function setStatus(status) {
    sync.status = status;
    refreshAccountUI();
  }

  function statusLabel() {
    if (!sync.session) return "Solo en este dispositivo";
    if (sync.status === "saving") return "Guardando cambios…";
    if (sync.status === "syncing") return "Sincronizando…";
    if (sync.status === "offline") return "Sin conexión · se reintenta solo";
    if (sync.status === "error") return "No se pudo sincronizar";
    return "Sincronizado";
  }

  function statusClass() {
    if (sync.status === "saving" || sync.status === "syncing") return "is-saving";
    if (sync.status === "offline" || sync.status === "error") return "is-error";
    if (sync.session) return "is-synced";
    return "is-off";
  }

  function relativeTime(iso) {
    if (!iso) return "Todavía no";
    var then = new Date(iso).getTime();
    if (!isFinite(then)) return "Todavía no";
    var diff = Math.max(0, Date.now() - then);
    var minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Hace un momento";
    if (minutes < 60) return "Hace " + minutes + " min";
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return "Hace " + hours + " h";
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  }

  function hasLocalData() {
    if (!App.state) return false;
    var profile = App.state.profile || {};
    if ((profile.name || "").trim() || String(profile.startYear || "").trim()) return true;
    if ((App.state.generalNote || "").trim()) return true;
    if ((App.state.events || []).length) return true;
    var stats = App.getStats();
    if (stats.approved + stats.regular + stats.cursando > 0) return true;
    return (App.state.subjects || []).some(function (subject) {
      return (
        subject.official === false ||
        Boolean(subject.notes) ||
        Boolean(subject.grade) ||
        Boolean(subject.period) ||
        Boolean(subject.cursadaDate) ||
        Boolean(subject.approvedDate)
      );
    });
  }

  function entityTime(entity) {
    // Solo cuenta la última edición real: la fecha de creación no gana conflictos.
    return (entity && entity.updatedAt) || "";
  }

  function mergeTombstones(localDeleted, remoteDeleted) {
    var result = { subjects: {}, events: {} };
    var horizon = new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString();
    [localDeleted, remoteDeleted].forEach(function (source) {
      if (!source || typeof source !== "object") return;
      ["subjects", "events"].forEach(function (kind) {
        var entries = source[kind] || {};
        Object.keys(entries).forEach(function (id) {
          var when = String(entries[id] || "");
          if (!when || when < horizon) return;
          if (!result[kind][id] || when > result[kind][id]) result[kind][id] = when;
        });
      });
    });
    return result;
  }

  function withoutDeleted(list, tombstones) {
    return (list || []).filter(function (entity) {
      var when = tombstones[entity.id];
      if (!when) return true;
      var stamp = entityTime(entity);
      return Boolean(stamp) && stamp > when;
    });
  }

  function payloadSignature(state) {
    return JSON.stringify({
      profile: state.profile,
      subjects: state.subjects,
      events: state.events,
      deleted: state.deleted,
      generalNote: state.generalNote,
      generalNoteUpdatedAt: state.generalNoteUpdatedAt
    });
  }

  function mergeStates(localState, remoteState) {
    var merged = clone(remoteState);
    var localNewer = (localState.updatedAt || "") > (remoteState.updatedAt || "");

    if (localNewer) merged.profile = clone(localState.profile);

    merged.deleted = mergeTombstones(localState.deleted, remoteState.deleted);
    merged.subjects = merged.subjects || [];
    merged.events = merged.events || [];

    var subjects = {};
    merged.subjects.forEach(function (subject) {
      subjects[subject.id] = subject;
    });
    (localState.subjects || []).forEach(function (localSubject) {
      var remoteSubject = subjects[localSubject.id];
      if (!remoteSubject) {
        merged.subjects.push(clone(localSubject));
        return;
      }
      if (entityTime(localSubject) > entityTime(remoteSubject)) {
        Object.keys(localSubject).forEach(function (key) {
          remoteSubject[key] = clone(localSubject[key]);
        });
      }
    });

    var events = {};
    merged.events.forEach(function (event) {
      events[event.id] = event;
    });
    (localState.events || []).forEach(function (localEvent) {
      var remoteEvent = events[localEvent.id];
      if (!remoteEvent) {
        merged.events.push(clone(localEvent));
        return;
      }
      if (entityTime(localEvent) > entityTime(remoteEvent)) {
        Object.keys(localEvent).forEach(function (key) {
          remoteEvent[key] = clone(localEvent[key]);
        });
      }
    });

    merged.subjects = withoutDeleted(merged.subjects, merged.deleted.subjects);
    merged.events = withoutDeleted(merged.events, merged.deleted.events);

    if ((localState.generalNoteUpdatedAt || "") > (merged.generalNoteUpdatedAt || "")) {
      merged.generalNote = localState.generalNote;
      merged.generalNoteUpdatedAt = localState.generalNoteUpdatedAt;
    }

    merged.updatedAt = new Date().toISOString();
    return merged;
  }

  function applyRemoteState(state, revision, updatedAt) {
    sync.applying = true;
    try {
      App.state = App.normalizeState(state);
      App.state.updatedAt = updatedAt || App.state.updatedAt;
      window.localStorage.setItem(App.STORAGE_KEY, JSON.stringify(App.state));
    } finally {
      sync.applying = false;
    }
    sync.revision = Number(revision || 0);
    sync.lastSyncedAt = updatedAt || "";
    setStatus("synced");
    App.renderShell();
    App.renderPage();
  }

  function applyLocalState(state) {
    sync.applying = true;
    try {
      App.state = App.normalizeState(state);
      App.state.updatedAt = new Date().toISOString();
      window.localStorage.setItem(App.STORAGE_KEY, JSON.stringify(App.state));
    } finally {
      sync.applying = false;
    }
    App.renderShell();
    App.renderPage();
  }

  async function request(path, options) {
    options = options || {};
    var headers = { "Content-Type": "application/json" };
    if (options.token) headers.Authorization = "Bearer " + options.token;
    var response = await fetch(API + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store"
    });
    var data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }
    if (!response.ok) {
      var failure = new Error(data.error || "No se pudo conectar con el servidor.");
      failure.status = response.status;
      failure.data = data;
      throw failure;
    }
    return data;
  }

  function expireSession() {
    sync.session = null;
    sync.revision = 0;
    sync.lastSyncedAt = "";
    if (sync.retryTimer) {
      window.clearTimeout(sync.retryTimer);
      sync.retryTimer = null;
    }
    sessionStore(null);
    setStatus("signed-out");
    App.toast("Sesión vencida", "Volvé a entrar para seguir sincronizando.", "error");
  }

  async function pushState(options) {
    options = options || {};
    if (!sync.session) return false;
    var snapshot = clone(App.state);
    var response = await request("/api/sync", {
      method: "POST",
      token: sync.session.token,
      body: {
        state: snapshot,
        baseRevision: options.baseRevision !== undefined ? options.baseRevision : sync.revision,
        force: options.force === true
      }
    });
    sync.revision = Number(response.revision || 0);
    sync.lastSyncedAt = response.updatedAt || "";
    if (sync.retryTimer) {
      window.clearTimeout(sync.retryTimer);
      sync.retryTimer = null;
    }
    setStatus("synced");
    return true;
  }

  async function handleConflict(data) {
    if (!data || !data.state) return;
    var merged = mergeStates(App.state, data.state);
    sync.revision = Number(data.revision || 0);
    sync.lastSyncedAt = data.updatedAt || "";
    applyLocalState(merged);
    try {
      await pushState({ baseRevision: sync.revision });
      App.toast("Cambios combinados", "Se unieron los datos de tus dispositivos.");
    } catch (error) {
      if (error.status === 409) {
        applyRemoteState(error.data.state, error.data.revision, error.data.updatedAt);
        App.toast("Se usó la versión más reciente", "Había cambios nuevos en otro dispositivo.");
      } else {
        throw error;
      }
    }
  }

  sync.now = async function (options) {
    options = options || {};
    if (!sync.session) {
      openSyncDialog("login");
      return;
    }
    if (sync.busy) return;
    sync.busy = true;
    if (!options.silent) setStatus("syncing");
    try {
      if (options.pushOnly) {
        await pushState({ baseRevision: sync.revision });
        return;
      }

      var remote = await request("/api/sync", { token: sync.session.token });
      if (!remote.state) {
        sync.revision = 0;
        sync.lastSyncedAt = "";
        if (hasLocalData()) {
          await pushState({ baseRevision: 0 });
          if (!options.silent) App.toast("Cuenta conectada", "Tus datos ya están guardados en la nube.");
        } else if (!options.silent) {
          App.toast(
            "Cuenta conectada",
            "Cuando agregues materias, fechas o notas, se van a guardar en tu cuenta."
          );
        }
        setStatus("synced");
        return;
      }

      var previousRevision = sync.revision;
      sync.revision = Number(remote.revision || 0);
      sync.lastSyncedAt = remote.updatedAt || "";

      if (!hasLocalData()) {
        applyRemoteState(remote.state, remote.revision, remote.updatedAt);
        if (!options.silent) App.toast("Datos cargados", "Ya tenés tu seguimiento en este dispositivo.");
        return;
      }

      var localSignature = payloadSignature(App.state);
      var remoteSignature = payloadSignature(remote.state);

      if (!options.force && Number(remote.revision || 0) === previousRevision && localSignature === remoteSignature) {
        setStatus("synced");
        return;
      }

      // Siempre se combinan ambos lados: nunca se descarta lo que existe
      // solo en este dispositivo aunque el servidor tenga algo más nuevo.
      var merged = mergeStates(App.state, remote.state);
      var mergedSignature = payloadSignature(merged);

      if (mergedSignature === remoteSignature) {
        applyRemoteState(remote.state, remote.revision, remote.updatedAt);
        if (!options.silent && options.announce) {
          App.toast("Datos actualizados", "Se cargaron los cambios de tu cuenta.");
        }
        return;
      }

      if (mergedSignature !== localSignature) {
        applyLocalState(merged);
      }
      await pushState({ baseRevision: sync.revision });
      if (!options.silent) {
        App.toast("Datos sincronizados", "Se combinaron los cambios de tus dispositivos.");
      }
      setStatus("synced");
    } catch (error) {
      if (error.status === 401) {
        expireSession();
      } else if (error.status === 409) {
        await handleConflict(error.data);
      } else {
        setStatus("offline");
        if (!options.silent) {
          App.toast("No se pudo sincronizar", error.message || "Revisá tu conexión.", "error");
        }
        scheduleRetry();
      }
    } finally {
      sync.busy = false;
    }
  };

  function scheduleRetry() {
    if (!sync.session || sync.retryTimer) return;
    sync.retryTimer = window.setTimeout(function () {
      sync.retryTimer = null;
      if (!sync.session) return;
      sync.now({ silent: true, announce: false });
    }, 8000);
  }

  sync.schedulePush = function () {
    if (!sync.session || sync.applying) return;
    setStatus("saving");
    window.clearTimeout(sync.timer);
    sync.timer = window.setTimeout(function () {
      sync.now({ pushOnly: true, silent: true });
    }, 900);
  };

  function openSyncDialog(mode) {
    sync.mode = mode || "login";
    sync.passwordOpen = false;
    renderSyncDialog();
    App.showDialog(App.$("#syncDialog"));
    window.setTimeout(function () {
      var focus = sync.session
        ? App.$("#syncNowButton")
        : App.$("#syncUsername");
      if (focus) focus.focus();
    }, 60);
  }

  App.openSyncDialog = openSyncDialog;

  function setAuthMode(mode) {
    sync.mode = mode;
    sync.passwordOpen = false;
    renderSyncDialog();
    var first = mode === "register" ? App.$("#syncUsername") : App.$("#syncUsername");
    if (first) first.focus();
  }

  App.setSyncMode = setAuthMode;

  function renderSyncDialog() {
    var signedIn = Boolean(sync.session);
    App.$("#syncLoggedOut").hidden = signedIn;
    App.$("#syncLoggedIn").hidden = !signedIn;
    App.$("#syncDialogTitle").textContent = signedIn
      ? "Tu cuenta"
      : sync.mode === "register"
        ? "Crear tu cuenta"
        : sync.mode === "recover"
          ? "Recuperar el acceso"
          : "Entrar a tu cuenta";
    App.$("#syncDialogKicker").textContent = signedIn ? "Cuenta conectada" : "Trayecto en todos lados";

    if (signedIn) {
      App.$("#syncAccountName").textContent = "@" + sync.session.username;
      App.$("#syncAccountStatus").textContent = statusLabel();
      App.$("#syncAccountStatus").className = "account-badge " + statusClass();
      App.$("#syncLastTime").textContent = relativeTime(sync.lastSyncedAt);
      App.$("#syncChangeForm").hidden = !sync.passwordOpen;
      App.$("#syncPasswordToggle").hidden = sync.passwordOpen;
      App.$("#syncErrorLogged").hidden = true;
      return;
    }

    var isRegister = sync.mode === "register";
    var isRecover = sync.mode === "recover";

    App.$("#syncTabs").hidden = isRecover;
    App.$("#syncLoginTab").classList.toggle("is-active", sync.mode === "login");
    App.$("#syncRegisterTab").classList.toggle("is-active", isRegister);
    App.$("#syncPasswordField").hidden = isRecover;
    App.$("#syncNewPasswordField").hidden = !isRecover;
    App.$("#syncSetupField").hidden = !(isRegister || isRecover);
    App.$("#syncError").hidden = true;
    App.$("#syncForgot").textContent = isRecover ? "Volver a entrar" : "Olvidé mi contraseña";
    App.$("#syncSubmit").textContent = isRecover
      ? "Cambiar contraseña"
      : isRegister
        ? "Crear cuenta"
        : "Entrar";
    App.$("#syncSubmit").disabled = false;
  }

  function setAuthError(message) {
    var box = App.$("#syncError");
    if (!box) return;
    box.textContent = message;
    box.hidden = !message;
  }

  App.submitSyncAuth = async function (event) {
    event.preventDefault();
    var username = App.$("#syncUsername").value.trim();
    var password = App.$("#syncPassword").value;
    var setupCode = App.$("#syncSetupCode").value.trim();
    var newPassword = App.$("#syncNewPassword").value;
    var submit = App.$("#syncSubmit");
    setAuthError("");

    if (sync.mode !== "recover" && !password) {
      setAuthError("Escribí tu contraseña.");
      return;
    }
    if (sync.mode === "register" && !setupCode) {
      setAuthError("Escribí el código de invitación que te pasaron.");
      return;
    }
    if (sync.mode === "recover" && (!setupCode || !newPassword)) {
      setAuthError("Completá el código de invitación y la contraseña nueva.");
      return;
    }

    submit.disabled = true;
    var original = submit.textContent;
    submit.textContent = "Conectando…";

    try {
      var action = sync.mode;
      var body =
        action === "register"
          ? { action: "register", username: username, password: password, setupCode: setupCode }
          : action === "recover"
            ? { action: "recover", username: username, setupCode: setupCode, newPassword: newPassword }
            : { action: "login", username: username, password: password };

      var result = await request("/api/auth", { method: "POST", body: body });
      sync.session = { token: result.token, username: result.username };
      sessionStore(sync.session);
      sync.revision = 0;
      sync.lastSyncedAt = "";
      App.closeDialog(App.$("#syncDialog"));
      App.$("#syncAuthForm").reset();
      setStatus("syncing");
      await sync.now({ silent: false });
      if (sync.status !== "offline") {
        App.toast("Cuenta conectada", "Ya podés abrir Trayecto en tus otros dispositivos.");
      }
    } catch (error) {
      setAuthError(error.message || "No se pudo completar la operación.");
    } finally {
      submit.disabled = false;
      submit.textContent = original;
    }
  };

  App.submitPasswordChange = async function (event) {
    event.preventDefault();
    if (!sync.session) return;
    var current = App.$("#syncCurrentPassword").value;
    var next = App.$("#syncNewPasswordChange").value;
    var box = App.$("#syncErrorLogged");
    var button = App.$("#syncChangeSubmit");
    box.hidden = true;
    button.disabled = true;
    try {
      await request("/api/auth", {
        method: "POST",
        token: sync.session.token,
        body: {
          action: "change-password",
          currentPassword: current,
          newPassword: next
        }
      });
      App.$("#syncChangeForm").reset();
      sync.passwordOpen = false;
      renderSyncDialog();
      App.toast("Contraseña actualizada", "Usá la nueva la próxima vez que entres.");
    } catch (error) {
      if (error.status === 401 && error.message.indexOf("sesión") !== -1) {
        expireSession();
        return;
      }
      box.textContent = error.message || "No se pudo cambiar la contraseña.";
      box.hidden = false;
    } finally {
      button.disabled = false;
    }
  };

  App.syncLogout = function () {
    if (!sync.session) return;
    App.confirmAction({
      kicker: "Cuenta",
      title: "¿Cerrar sesión en este dispositivo?",
      message:
        "Tus datos siguen guardados en este navegador y en tu cuenta. Para volver a sincronizar, entrá de nuevo con tu usuario y contraseña.",
      confirmText: "Cerrar sesión"
    }).then(function (confirmed) {
      if (!confirmed) return;
      sessionStore(null);
      sync.session = null;
      sync.revision = 0;
      sync.lastSyncedAt = "";
      window.clearTimeout(sync.retryTimer);
      sync.retryTimer = null;
      setStatus("signed-out");
      App.closeDialog(App.$("#syncDialog"));
      App.toast("Sesión cerrada", "Tus datos quedan guardados en este dispositivo.");
    });
  };

  App.syncPassword = function () {
    if (!sync.session) return;
    sync.passwordOpen = true;
    renderSyncDialog();
    App.showDialog(App.$("#syncDialog"));
    window.setTimeout(function () {
      var input = App.$("#syncCurrentPassword");
      if (input) input.focus();
    }, 60);
  };

  App.cancelSyncPassword = function () {
    sync.passwordOpen = false;
    renderSyncDialog();
  };

  function renderAccountSettings() {
    if (!sync.session) {
      return (
        '<section class="card settings-card account-card">' +
        '<div class="settings-card-header"><span class="section-kicker section-kicker--coral">Tu cuenta</span><h2>Llevalo a todos lados</h2><p>Creá tu cuenta una vez y abrí el mismo seguimiento desde el celular, la compu o cualquier navegador.</p></div>' +
        '<div class="account-benefits">' +
        '<span><strong>Un solo lugar</strong>Materias, fechas y notas siempre al día.</span>' +
        '<span><strong>Cambio de dispositivo</strong>Entrás con tu usuario y listo.</span>' +
        "</div>" +
        '<div class="account-actions">' +
        '<button class="button button--primary button--compact" type="button" data-action="open-sync-register">Crear cuenta</button>' +
        '<button class="button button--secondary button--compact" type="button" data-action="open-sync-login">Ya tengo cuenta</button>' +
        "</div>" +
        '<p class="account-footnote">Opcional. Sin cuenta, todo sigue funcionando solo en este navegador.</p>' +
        "</section>"
      );
    }

    return (
      '<section class="card settings-card account-card">' +
      '<div class="settings-card-header"><span class="section-kicker section-kicker--coral">Tu cuenta</span><h2>Sincronizado</h2><p>Tu seguimiento se guarda en tu cuenta y se replica en los dispositivos donde entres.</p></div>' +
      '<div class="account-head">' +
      '<span class="account-avatar">' +
      App.icon("cloud", "icon--small") +
      "</span>" +
      '<span class="account-identity"><strong>@' +
      App.esc(sync.session.username) +
      "</strong><span class=\"account-badge " +
      statusClass() +
      '">' +
      App.esc(statusLabel()) +
      "</span></span>" +
      "</div>" +
      '<div class="sync-meta"><span>Última sincronización</span><strong>' +
      App.esc(relativeTime(sync.lastSyncedAt)) +
      "</strong></div>" +
      '<div class="account-actions">' +
      '<button class="button button--secondary button--compact" type="button" data-action="sync-now">' +
      App.icon("refresh", "icon--small") +
      " Sincronizar ahora</button>" +
      '<button class="button button--ghost button--compact" type="button" data-action="sync-password">Cambiar contraseña</button>' +
      '<button class="button button--ghost button--compact account-logout" type="button" data-action="sync-logout">Cerrar sesión</button>' +
      "</div>" +
      "</section>"
    );
  }

  function refreshAccountUI() {
    var container = App.$("#accountSettings");
    if (container) container.innerHTML = renderAccountSettings();

    var button = App.$("#syncButton");
    if (button) {
      button.classList.remove("is-synced", "is-saving", "is-error", "is-off");
      button.classList.add(statusClass());
      button.setAttribute("title", statusLabel());
      var label = App.$("#syncLabel");
      if (label) {
        label.textContent = sync.session
          ? sync.status === "saving"
            ? "Guardando…"
            : sync.status === "offline"
              ? "Sin conexión"
              : "Sincronizado"
          : "Activar sync";
      }
    }

    if (App.$("#syncDialog") && App.$("#syncDialog").open) renderSyncDialog();
  }

  App.refreshAccountUI = refreshAccountUI;

  App.renderAccountSettings = renderAccountSettings;

  function bind() {
    document.addEventListener("click", function (event) {
      var modeButton = event.target.closest("[data-sync-mode]");
      if (modeButton) {
        event.preventDefault();
        setAuthMode(modeButton.dataset.syncMode);
        return;
      }
      if (event.target.closest("#syncForgot")) {
        event.preventDefault();
        setAuthMode(sync.mode === "recover" ? "login" : "recover");
        return;
      }
      if (event.target.closest("#syncBack")) {
        event.preventDefault();
        setAuthMode("login");
      }
    });

    document.addEventListener("submit", function (event) {
      if (event.target.id === "syncAuthForm") App.submitSyncAuth(event);
      if (event.target.id === "syncChangeForm") App.submitPasswordChange(event);
    });

    window.addEventListener("online", function () {
      if (sync.session) sync.now({ silent: true, announce: false });
    });

    document.addEventListener("visibilitychange", function () {
      if (!sync.session) return;
      if (document.visibilityState === "hidden") {
        if (sync.timer) {
          window.clearTimeout(sync.timer);
          sync.timer = null;
          sync.now({ pushOnly: true, silent: true });
        }
        return;
      }
      sync.now({ silent: true, announce: true });
    });

    window.addEventListener("focus", function () {
      if (sync.session) sync.now({ silent: true, announce: true });
    });
  }

  function init() {
    sync.session = loadSession();
    setStatus(sync.session ? "syncing" : "signed-out");
    bind();
    if (sync.session) {
      window.setTimeout(function () {
        sync.now({ silent: true, announce: true });
      }, 500);
      sync.pollTimer = window.setInterval(function () {
        if (document.visibilityState === "visible") sync.now({ silent: true, announce: true });
      }, 45000);
    }
  }

  var basePersist = App.persistState;
  App.persistState = function () {
    var saved = basePersist.apply(App, arguments);
    if (saved && !sync.applying) sync.schedulePush();
    return saved;
  };

  document.addEventListener("DOMContentLoaded", init);
})();
