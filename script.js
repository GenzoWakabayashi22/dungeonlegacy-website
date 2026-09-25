(function () {
  var KEY = "dl-lang";
  function get() {
    try { var s = localStorage.getItem(KEY); if (s === "it" || s === "en") return s; } catch (e) {}
    return (navigator.language || "en").toLowerCase().indexOf("it") === 0 ? "it" : "en";
  }
  function apply(l) {
    document.documentElement.lang = l;
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.lang === l ? "true" : "false");
    });
    var t = document.body.dataset["title" + l.charAt(0).toUpperCase() + l.slice(1)];
    if (t) document.title = t;
  }
  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () {
      try { localStorage.setItem(KEY, b.dataset.lang); } catch (e) {}
      apply(b.dataset.lang);
    });
  });
  apply(get());
})();
