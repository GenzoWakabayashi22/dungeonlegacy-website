// Modulo «Scrivi la tua traccia» della pagina /community.
// Invia il modulo a /api/campagne (Worker dungeonlegacy-campagne), che lo gira per e-mail.
// Non salva nulla nel browser. Turnstile (Cloudflare) si carica solo quando si inizia a compilare.
(function () {
  var form = document.getElementById("track-form");
  if (!form) return;

  var sitekey = form.getAttribute("data-sitekey") || "";
  var button = form.querySelector("button[type=submit]");
  var done = document.getElementById("track-done");
  var widgetId = null;
  var token = "";
  var loading = false;

  function msg(key) {
    var all = document.querySelectorAll(".fm-msg");
    for (var i = 0; i < all.length; i++) all[i].hidden = all[i].getAttribute("data-msg") !== key;
  }

  if (!sitekey) {
    button.disabled = true;
    msg("off");
    return;
  }

  // ---- Turnstile, caricato al primo tocco sul modulo
  window.dlTurnstileReady = function () {
    widgetId = window.turnstile.render("#ts-box", {
      sitekey: sitekey,
      theme: "dark",
      language: "auto",
      callback: function (t) { token = t; },
      "expired-callback": function () { token = ""; },
      "error-callback": function () { token = ""; msg("captcha"); }
    });
  };
  function loadTurnstile() {
    if (loading) return;
    loading = true;
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=dlTurnstileReady";
    s.async = true;
    document.head.appendChild(s);
  }
  form.addEventListener("focusin", loadTurnstile);
  form.addEventListener("pointerdown", loadTurnstile);

  function resetWidget() {
    token = "";
    if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
  }

  function mark(fields) {
    var els = form.querySelectorAll("[aria-invalid]");
    for (var i = 0; i < els.length; i++) els[i].removeAttribute("aria-invalid");
    var first = null;
    for (var j = 0; j < fields.length; j++) {
      var el = form.elements[fields[j]];
      if (el) { el.setAttribute("aria-invalid", "true"); first = first || el; }
    }
    if (first) first.focus();
  }

  document.getElementById("track-again").addEventListener("click", function () {
    done.hidden = true;
    form.hidden = false;
    button.disabled = false;
    resetWidget();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    mark([]);
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!token) { loadTurnstile(); msg("wait"); return; }

    var data = { consent: form.elements.consent.checked === true };
    var names = ["title", "idea", "hero", "place", "start", "events", "obstacle", "ending", "scene", "ai", "name", "credit", "email", "phone", "website"];
    for (var i = 0; i < names.length; i++) data[names[i]] = form.elements[names[i]].value;
    data.rulesVersion = form.getAttribute("data-rules");
    data.lang = document.documentElement.lang === "en" ? "en" : "it";
    data.turnstile = token;

    button.disabled = true;
    msg("sending");
    fetch("/api/campagne", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) { return { status: res.status, body: body }; });
    }).then(function (r) {
      if (r.status === 200 && r.body.ok) {
        document.getElementById("track-ref").textContent = r.body.ref;
        form.hidden = true;
        done.hidden = false;
        msg("");
        done.scrollIntoView({ behavior: "smooth", block: "center" });
        form.reset();
        return;
      }
      button.disabled = false;
      if (r.status === 422 && r.body.fields) { mark(r.body.fields); msg("invalid"); }
      else if (r.status === 403 && r.body.error === "captcha") { resetWidget(); msg("captcha"); }
      else { resetWidget(); msg("error"); }
    }).catch(function () {
      button.disabled = false;
      resetWidget();
      msg("error");
    });
  });
})();
