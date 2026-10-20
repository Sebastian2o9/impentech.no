/* impentech.no — progressiv forbedring. Alt innhold og all navigasjon virker uten dette skriptet. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;
  doc.classList.add("intro-js");

  // Toppen får en strek når siden er rullet
  var header = document.querySelector(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Menyen (details): lukk med Escape, ved klikk utenfor, når en lenke velges og når skjermen snus
  var menu = document.querySelector(".menu");
  if (menu) {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); }
    });
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { menu.open = false; }); });
    window.addEventListener("orientationchange", function () { menu.open = false; });
  }

  // Myk rulling bare når en intern ankerlenke klikkes (fokus med Tab flyttes alltid umiddelbart)
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href*='#']");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash.length < 2) return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (history.pushState) history.pushState(null, "", url.hash);
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });

  // Mål av/på i bildet av rommet
  document.querySelectorAll("[data-room-toggle]").forEach(function (btn) {
    var room = btn.closest(".room");
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (room) room.classList.toggle("is-plain", !on);
    });
  });

  // Introen på forsiden: spilles når minst 40 % av rommet er i syne, én gang per økt
  var room = document.querySelector(".room");
  if (room) {
    try { sessionStorage.setItem("it-intro", "1"); } catch (e) {}
    if (doc.classList.contains("intro") && !doc.classList.contains("intro-done")) {
      var play = function () {
        room.classList.add("is-playing");
        setTimeout(function () { doc.classList.add("intro-done"); room.classList.remove("is-playing"); }, 1700);
      };
      if (hasIO) {
        var rio = new IntersectionObserver(function (en) {
          if (en[0].intersectionRatio >= 0.4) { rio.disconnect(); play(); }
        }, { threshold: [0, 0.4, 0.6] });
        rio.observe(room.querySelector(".room__view") || room);
      } else { doc.classList.add("intro-done"); }
    }
  }

  // Kopier e-postadressen, med beskjed til skjermlesere og en synlig reserve hvis utklippstavlen ikke kan brukes
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var label = btn.querySelector("span");
    var original = label ? label.textContent : "";
    var box = btn.closest(".contact-main") || btn.parentNode;
    var status = box.querySelector(".copy-status");
    var say = function (text, error) {
      if (!status) return;
      status.textContent = "";
      status.classList.toggle("is-error", !!error);
      setTimeout(function () { status.textContent = text; }, 30);
    };
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        btn.setAttribute("data-done", "");
        if (label) label.textContent = btn.getAttribute("data-copied") || original;
        say(btn.getAttribute("data-copied-sr") || "", false);
        setTimeout(function () { btn.removeAttribute("data-done"); if (label) label.textContent = original; }, 2400);
      };
      var fail = function () {
        var mail = document.getElementById("kontakt-epost");
        if (mail && window.getSelection) { var sel = window.getSelection(); sel.removeAllRanges(); var r = document.createRange(); r.selectNodeContents(mail); sel.addRange(r); }
        say(btn.getAttribute("data-copy-fail") || "", true);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
      else fail();
    });
  });

  // Søkekonsollen: viser de fire veiene inn én runde og stopper på NOBB-raden. Pause ved peker, fokus og berøring.
  document.querySelectorAll("[data-console]").forEach(function (box) {
    var rows = Array.prototype.slice.call(box.querySelectorAll(".console__rows li"));
    var input = box.querySelector(".console__type");
    var kind = box.querySelector(".console__kind");
    if (!rows.length || !input || !kind) return;
    var i = 1, timer = null, typing = null, visible = false, paused = false, steps = 0;
    var show = function (n, animate) {
      rows.forEach(function (r, k) { r.classList.toggle("is-active", k === n); });
      var code = rows[n].getAttribute("data-code"), k = rows[n].getAttribute("data-kind");
      kind.textContent = k;
      clearInterval(typing);
      if (!animate || reduce) { input.textContent = code; return; }
      var c = 0; input.textContent = "";
      typing = setInterval(function () { c++; input.textContent = code.slice(0, c); if (c >= code.length) clearInterval(typing); }, 45);
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var tick = function () {
      if (!visible || paused) return;
      i = (i + 1) % rows.length; steps++; show(i, true);
      if (steps >= rows.length) stop();
    };
    show(1, false);
    if (reduce || !hasIO) return;
    box.addEventListener("mouseenter", function () { paused = true; });
    box.addEventListener("mouseleave", function () { paused = false; });
    box.addEventListener("focusin", function () { paused = true; });
    box.addEventListener("focusout", function () { paused = false; });
    box.addEventListener("touchstart", function () { stop(); steps = rows.length; }, { passive: true });
    box.addEventListener("click", function () { stop(); steps = rows.length; });
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !timer && steps < rows.length) timer = setInterval(tick, 2600);
      if (!visible) stop();
    }, { threshold: 0.3 }).observe(box);
  });

  // Før/etter: 3D-visningen og det ferdige bildet. Skyvebryteren er et ekte range-felt (tastatur og skjermleser).
  document.querySelectorAll("[data-ba]").forEach(function (fig) {
    var stage = fig.querySelector(".ba__stage");
    var range = fig.querySelector(".ba__range");
    if (!stage || !range) return;
    var touched = false, raf = 0;
    var set = function (v) { stage.style.setProperty("--pos", v + "%"); };
    set(range.value);
    range.addEventListener("input", function () { touched = true; cancelAnimationFrame(raf); set(range.value); });
    range.addEventListener("pointerdown", function () { touched = true; cancelAnimationFrame(raf); });
    if (reduce || !hasIO) return;
    // En kort, rolig demonstrasjon første gang figuren er godt i syne — avbrytes straks brukeren tar over
    var demo = function () {
      var keys = [[0, 50], [900, 24], [2100, 76], [3000, 50]], t0 = 0;
      var ease = function (x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
      var step = function (t) {
        if (touched) return;
        if (!t0) t0 = t;
        var e = t - t0, k = 1;
        while (k < keys.length - 1 && e > keys[k][0]) k++;
        var a = keys[k - 1], b = keys[k], p = Math.min(1, Math.max(0, (e - a[0]) / (b[0] - a[0])));
        var v = a[1] + (b[1] - a[1]) * ease(p);
        set(v); range.value = Math.round(v);
        if (e < keys[keys.length - 1][0]) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    var bio = new IntersectionObserver(function (en) {
      if (en[0].intersectionRatio >= 0.6) { bio.disconnect(); setTimeout(demo, 300); }
    }, { threshold: [0, 0.6] });
    bio.observe(stage);
  });

  // Utskrift: alt vises
  window.addEventListener("beforeprint", function () {
    document.querySelectorAll(".reveal, .draw, .mascot-card").forEach(function (el) { el.classList.add("is-in"); });
    doc.classList.add("intro-done");
  });

  // Diskret inntoning og strektegning. Ingenting skjules før brukeren selv ruller, og elementene gjøres klare
  // en god stund før de kommer inn i bildet (rootMargin), så rask rulling ikke gir tomme flater.
  var items = Array.prototype.slice.call(document.querySelectorAll(".reveal, .draw, .mascot-card"));
  if (!hasIO || reduce) { items.forEach(function (el) { el.classList.add("is-in"); }); return; }
  var armed = false;
  var arm = function () {
    if (armed || window.scrollY < 4) return;
    armed = true;
    window.removeEventListener("scroll", arm);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px 20% 0px", threshold: 0 });
    items.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 1.1) el.classList.add("is-in"); else io.observe(el);
    });
    doc.classList.add("io");
  };
  items.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-in"); });
  window.addEventListener("scroll", arm, { passive: true });
  arm();
})();
