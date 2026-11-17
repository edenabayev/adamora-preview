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

  /* home hero video: plays muted unless reduced motion is requested; a button pauses / plays it */
  var v = doc.querySelector(".hero-video"), vb = doc.querySelector(".vid-toggle");
  if (v && vb) {
    var icon = vb.firstChild;
    var set = function (play) {
      if (play) { var p = v.play(); if (p && p.catch) p.catch(function () { set(false); }); } else v.pause();
      vb.setAttribute("aria-label", play ? "עצירת הסרטון" : "הפעלת הסרטון");
      icon.textContent = play ? "❚❚" : "▶︎";
    };
    set(!reduce);
    vb.addEventListener("click", function () { set(v.paused); });
  }

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
