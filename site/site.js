/* Adamora — all page behaviour in one file (no inline scripts → a strict Content-Security-Policy works at launch) */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ?n=1 shows the section numbers (for review conversations), ?n=0 hides them again */
  try {
    var q = location.search;
    if (/[?&]n=1/.test(q)) sessionStorage.setItem("n", "1");
    if (/[?&]n=0/.test(q)) sessionStorage.removeItem("n");
    if (sessionStorage.getItem("n")) root.classList.add("show-n");
  } catch (e) {}

  /* mobile menu: Escape, focus leaving it, or a tap outside closes it */
  var menu = doc.querySelector(".mnav");
  if (menu) {
    var sum = menu.querySelector("summary");
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; sum.focus(); } });
    doc.addEventListener("focusin", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    doc.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  }

  /* videos (home hero, blog hero, clinic clip): muted; a button pauses / plays each one. Hero videos start right away
     unless reduced motion is requested; the clinic clip starts when it scrolls into view. */
  [].forEach.call(doc.querySelectorAll("figure.has-video"), function (f) {
    var v = f.querySelector("video"), vb = f.querySelector(".vid-toggle");
    if (!v || !vb) return;
    var icon = vb.firstChild, held = false;
    var set = function (play) {
      if (play) { var p = v.play(); if (p && p.catch) p.catch(function () { set(false); }); } else v.pause();
      vb.setAttribute("aria-label", play ? "עצירת הסרטון" : "הפעלת הסרטון");
      icon.textContent = play ? "❚❚" : "▶︎";
    };
    vb.addEventListener("click", function () { held = !v.paused; set(v.paused); });
    if (v.classList.contains("hero-video")) { set(!reduce); return; }
    set(false);
    if (reduce || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (held) return; if (e.isIntersecting) set(true); else if (!v.paused) { v.pause(); icon.textContent = "▶︎"; vb.setAttribute("aria-label", "הפעלת הסרטון"); } });
    }, { threshold: 0.4 }).observe(v);
  });

  /* workshops carousel: each step lands on a photo edge (WebKit does not re-snap after a smooth scroll). RTL: forward = left */
  var t = doc.querySelector(".car-track");
  if (t) {
    var go = function (dir) {
      var tr = t.getBoundingClientRect(), f = [].slice.call(t.children), el;
      if (dir > 0) {
        el = f.filter(function (x) { return x.getBoundingClientRect().left < tr.left - 1; })[0];
      } else {
        var w = 0;
        for (var i = f.length - 1; i >= 0; i--) {
          var r = f[i].getBoundingClientRect();
          if (r.right > tr.right + 1) { el = f[i]; w += r.width; if (w > tr.width * 0.8) break; }
        }
      }
      if (el) t.scrollBy({ left: el.getBoundingClientRect().right - tr.right, behavior: reduce ? "auto" : "smooth" });
    };
    var nx = doc.querySelector(".car-next"), pv = doc.querySelector(".car-prev");
    if (nx) nx.addEventListener("click", function () { go(1); });
    if (pv) pv.addEventListener("click", function () { go(-1); });
  }

  /* testimonials (clinic): one in front, its neighbours faded at the sides; arrows step one at a time.
     scrollBy to the card's centre (RTL-safe, and WebKit does not re-snap after a smooth scroll) */
  [].forEach.call(doc.querySelectorAll(".tcar"), function (c) {
    var tr = c.querySelector(".tcar-track"), items = [].slice.call(tr.children), cur = 0, tm;
    var mark = function () {
      var r = tr.getBoundingClientRect(), mid = r.left + r.width / 2, best = 0, bd = 1e9;
      items.forEach(function (x, i) { var b = x.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
      cur = best; items.forEach(function (x, i) { x.classList.toggle("on", i === best); });
    };
    var go = function (i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      var r = tr.getBoundingClientRect(), b = items[i].getBoundingClientRect();
      tr.scrollBy({ left: (b.left + b.width / 2) - (r.left + r.width / 2), behavior: reduce ? "auto" : "smooth" });
    };
    tr.addEventListener("scroll", function () { clearTimeout(tm); tm = setTimeout(mark, 60); }, { passive: true });
    var pv = c.querySelector(".tcar-prev"), nx = c.querySelector(".tcar-next");
    if (pv) pv.addEventListener("click", function () { go(cur - 1); });
    if (nx) nx.addEventListener("click", function () { go(cur + 1); });
    items.forEach(function (x, i) { x.addEventListener("click", function () { if (i !== cur) go(i); }); });
    mark(); addEventListener("resize", mark);
  });

  /* lead forms continue in WhatsApp */
  [].forEach.call(doc.querySelectorAll("form.lead"), function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var b = f.querySelector("button[type=submit]");
      if (b) { b.dataset.t = b.textContent; b.textContent = "ממשיכים בוואטסאפ…"; }
      location.href = f.getAttribute("data-wa");
    });
  });
  addEventListener("pageshow", function () {
    [].forEach.call(doc.querySelectorAll("form.lead button[data-t]"), function (b) { b.textContent = b.dataset.t; });
  });
})();
