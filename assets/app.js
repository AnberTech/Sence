/* Sence sitesi: tema, görünme, sayaçlar ve kartlardaki deneme oylaması.
   Kartlardaki kurallar uygulamadakiyle aynı: yatay = cevap; şeritte parmak gezer, bırakmak ya da dokunmak oy,
   80 px dikey çekip bırakmak iptal; sonuç oydan 0,36 sn sonra yaylanır (Puanlat: bırakılan puan 0,3 sn sonra kesinleşir). */
(function () {
  "use strict";
  var doc = document.documentElement, body = document.body;
  var TR = (doc.lang || "tr").indexOf("tr") === 0;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var T = { avg: body.dataset.avg || "ort.", you: body.dataset.you || "Sen" };
  function pct(n) { return TR ? "%" + n : n + "%"; }
  function dec(x) { var s = x.toFixed(1); return TR ? s.replace(".", ",") : s; }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {} }

  /* ---- tema ---- */
  var zipla = [];
  function theme() { return doc.dataset.theme === "dark" ? "dark" : "light"; }
  function mountZipla() {
    zipla.forEach(function (z) { z.inst && z.inst.destroy(); z.el.innerHTML = ""; });
    zipla.forEach(function (z) {
      if (window.SenceZipla) z.inst = SenceZipla.mount(z.el, { size: 120, delay: 0, theme: theme(), label: "Sence" });
    });
  }
  document.querySelectorAll("[data-zipla]").forEach(function (el) { zipla.push({ el: el }); });
  var tb = document.querySelector(".themebtn");
  if (tb) tb.addEventListener("click", function () {
    var t = theme() === "dark" ? "light" : "dark";
    doc.dataset.theme = t;
    try { localStorage.setItem("sence-tema", t); } catch (_) {}
    mountZipla();
  });
  mountZipla();

  /* ---- görünme ---- */
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  /* ---- geri sayımlar ---- */
  var timers = [].map.call(document.querySelectorAll("[data-timer]"), function (el) { return { el: el, s: +el.dataset.timer }; });
  function fmt(s) {
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (x < 10 ? "0" : "") + x;
  }
  function tick() { timers.forEach(function (t) { t.el.textContent = fmt(Math.max(0, t.s)); t.s--; }); }
  tick(); setInterval(tick, 1000);

  /* ---- yüzdeler: toplamı 100 olacak şekilde yuvarla ---- */
  function percents(c) {
    var tot = c.reduce(function (a, b) { return a + b; }, 0) || 1;
    var raw = c.map(function (v) { return v * 100 / tot; });
    var fl = raw.map(Math.floor), left = 100 - fl.reduce(function (a, b) { return a + b; }, 0);
    raw.map(function (v, i) { return [v - fl[i], i]; }).sort(function (a, b) { return b[0] - a[0]; })
      .slice(0, left).forEach(function (p) { fl[p[1]]++; });
    return fl;
  }
  var CHECK = '<svg class="ic tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.6l4.4 4.4L19 7.4"/></svg>';

  /* ---- kartlar ---- */
  document.querySelectorAll("[data-demo]").forEach(function (card) {
    var kind = card.dataset.demo, crowd = JSON.parse(card.dataset.crowd).c;
    var strip = card.querySelector(".strip"), again = card.querySelector(".again");
    var countEl = card.querySelector("[data-count]"), count0 = countEl ? +countEl.textContent : 0;
    var voted = false;
    if (card.classList.contains("hero-card") && !reduce) setTimeout(function () { if (!card.classList.contains("used")) card.classList.add("hint-run"); }, 400);

    function finish() {
      voted = true;
      card.classList.add("used");
      card.classList.remove("hint-run");
      if (countEl) countEl.textContent = count0 + 1;
      setTimeout(function () { if (again) again.hidden = false; }, 700);
    }

    if (kind === "rate") return rateCard(card, strip, crowd, finish, function () { return voted; }, reset);

    var slices = [].slice.call(strip.querySelectorAll(".sl"));
    var tiles = [].slice.call(card.querySelectorAll(".tiles figure"));
    tiles.forEach(function (f) { var s = document.createElement("span"); s.className = "tp mono"; f.appendChild(s); });
    var on = -1, startY = 0, active = false;

    function light(i) {
      on = i;
      slices.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      tiles.forEach(function (f, k) { f.classList.toggle("lit", k === i); });
    }
    function idxAt(x) {
      for (var i = 0; i < slices.length; i++) { var r = slices[i].getBoundingClientRect(); if (x < r.right + 2) return i; }
      return slices.length - 1;
    }
    function vote(i) {
      if (voted) return;
      light(-1); strip.classList.remove("hot", "cancel");
      var c = crowd.slice(); c[i]++;
      var p = percents(c);
      finish();
      slices[i].classList.add("mine");
      if (tiles[i]) tiles[i].classList.add("mine");
      setTimeout(function () {
        card.classList.add("voted");
        slices.forEach(function (s, k) {
          s.querySelector(".pct").textContent = pct(p[k]);
          s.style.flexGrow = Math.max(p[k], 9);
          s.classList.toggle("thin", p[k] < 28);
          if (k === i && !s.querySelector(".tick")) s.insertAdjacentHTML("afterbegin", CHECK);
          s.setAttribute("aria-pressed", k === i ? "true" : "false");
          if (tiles[k]) tiles[k].querySelector(".tp").textContent = pct(p[k]);
        });
        if (p[i] < 20) buzz([18, 60, 18]); else buzz(12);   // azınlık anı: çift titreşim
        setTimeout(fit, reduce ? 0 : 600);
      }, reduce ? 0 : 360);
    }
    function fit() {   // dar dilimde yazı sığmazsa yalnız yüzde kalır
      slices.forEach(function (s) { var l = s.querySelector(".lab"); s.classList.remove("thin"); if (s.scrollWidth > s.clientWidth + 1 || l.scrollWidth > l.clientWidth + 1) s.classList.add("thin"); });
    }
    window.addEventListener("resize", function () { if (voted) fit(); });
    function reset() {
      voted = false;
      card.classList.remove("voted");
      if (again) again.hidden = true;
      if (countEl) countEl.textContent = count0;
      slices.forEach(function (s) {
        s.classList.remove("mine", "on", "thin"); s.style.flexGrow = ""; s.removeAttribute("aria-pressed");
        var t = s.querySelector(".tick"); if (t) t.remove();
      });
      tiles.forEach(function (f) { f.classList.remove("mine", "lit"); });
    }
    if (again) again.addEventListener("click", reset);

    strip.addEventListener("pointerdown", function (ev) {
      if (voted || ev.button > 0) return;
      active = true; startY = ev.clientY;
      try { strip.setPointerCapture(ev.pointerId); } catch (_) {}
      strip.classList.add("hot"); strip.classList.remove("cancel");
      card.classList.add("used"); card.classList.remove("hint-run");
      light(idxAt(ev.clientX));
    });
    strip.addEventListener("pointermove", function (ev) {
      if (!active) return;
      var i = idxAt(ev.clientX);
      if (i !== on) { light(i); buzz(4); }
      strip.classList.toggle("cancel", Math.abs(ev.clientY - startY) > 80);
    });
    function end(ev, ok) {
      if (!active) return;
      active = false;
      var cancel = !ok || strip.classList.contains("cancel");
      if (cancel) { light(-1); strip.classList.remove("hot", "cancel"); return; }
      vote(on);
    }
    strip.addEventListener("pointerup", function (ev) { end(ev, true); });
    strip.addEventListener("pointercancel", function (ev) { end(ev, false); });
    // klavye (Enter/Boşluk): butonun click olayı, fareden gelen tıklamayı pointerup zaten işledi
    slices.forEach(function (s, i) { s.addEventListener("click", function (ev) { if (ev.detail === 0) vote(i); }); });
  });

  /* ---- Puanlat ---- */
  var gid = 0;
  function rateCard(card, strip, crowd, finish, isVoted) {
    var track = strip.querySelector(".track"), knob = strip.querySelector(".knob"), svg = strip.querySelector(".wave");
    var again = card.querySelector(".again"), countEl = card.querySelector("[data-count]"), count0 = countEl ? +countEl.textContent : 0;
    var val = 0, active = false, startY = 0, timer = null, voted = false;
    function set(v) {
      v = Math.max(0, Math.min(10, v));
      if (v !== val) buzz(3);
      val = v; knob.textContent = v; knob.style.left = v * 10 + "%";
      strip.setAttribute("aria-valuenow", v);
    }
    function valAt(x) { var r = track.getBoundingClientRect(); return Math.round((x - r.left) / r.width * 10); }
    function commit() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (voted) return;
        voted = true; finish(); card.classList.add("voted");
        draw(val);
        buzz(12);
      }, reduce ? 0 : 300);
    }
    function draw(mine) {
      var c = crowd.slice(); c[mine]++;
      var tot = c.reduce(function (a, b) { return a + b; }, 0), sum = c.reduce(function (a, b, i) { return a + b * i; }, 0), avg = sum / tot;
      var w = strip.clientWidth, h = strip.clientHeight, padX = 22, top = 12, bot = 10, max = Math.max.apply(null, c);
      function X(i) { return padX + i * (w - 2 * padX) / 10; }
      function Y(v) { return h - bot - v / max * (h - top - bot); }
      var pts = c.map(function (v, i) { return [X(i), Y(v)]; });
      var d = "M" + pts[0][0] + "," + pts[0][1];
      for (var i = 0; i < pts.length - 1; i++) {            // Catmull-Rom → Bézier
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += " C" + (p1[0] + (p2[0] - p0[0]) / 6) + "," + (p1[1] + (p2[1] - p0[1]) / 6) + " " +
             (p2[0] - (p3[0] - p1[0]) / 6) + "," + (p2[1] - (p3[1] - p1[1]) / 6) + " " + p2[0] + "," + p2[1];
      }
      var id = "wg" + (++gid), ax = padX + avg * (w - 2 * padX) / 10, mx = X(mine), my = Y(c[mine]);
            svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      svg.innerHTML =
        '<defs><linearGradient id="' + id + '" x1="0" x2="1"><stop offset="0" style="stop-color:var(--h1)"/><stop offset=".5" style="stop-color:var(--h2)"/><stop offset="1" style="stop-color:var(--h3)"/></linearGradient></defs>' +
        '<path class="fl" fill="url(#' + id + ')" d="' + d + ' L' + X(10) + ',' + (h - bot) + ' L' + X(0) + ',' + (h - bot) + 'Z"/>' +
        '<line class="avg" x1="' + ax + '" x2="' + ax + '" y1="6" y2="' + (h - 6) + '"/>' +
        '<text x="' + (ax - 6) + '" y="' + (h - 9) + '" text-anchor="end">' + T.avg + " " + dec(avg) + "</text>" +
        '<path class="ln" stroke="url(#' + id + ')" d="' + d + '"/>' +
        '<circle class="me" cx="' + mx + '" cy="' + my + '" r="6.5" stroke="url(#' + id + ')"/>' +
        '<text x="' + Math.min(Math.max(mx, 30), w - 30) + '" y="' + (my > 30 ? my - 12 : my + 22) + '" text-anchor="middle" style="fill:var(--ink)">' + T.you + " " + mine + "</text>";
      strip.setAttribute("aria-label", (T.you + " " + mine + ", " + T.avg + " " + dec(avg)));
      var ln = svg.querySelector(".ln");
      if (!reduce && ln.getTotalLength) {
        var L = ln.getTotalLength();
        ln.style.strokeDasharray = L; ln.style.strokeDashoffset = L;
        ln.getBoundingClientRect();
        ln.style.transition = "stroke-dashoffset .9s cubic-bezier(.4,.1,.2,1)";
        ln.style.strokeDashoffset = 0;
      }
    }
    function reset() {
      voted = false; card.classList.remove("voted"); svg.innerHTML = ""; set(0);
      if (again) again.hidden = true;
      if (countEl) countEl.textContent = count0;
    }
    if (again) again.addEventListener("click", reset);
    set(0);
    strip.addEventListener("pointerdown", function (ev) {
      if (voted || ev.button > 0) return;
      clearTimeout(timer);
      active = true; startY = ev.clientY;
      try { strip.setPointerCapture(ev.pointerId); } catch (_) {}
      strip.classList.add("drag"); card.classList.add("used");
      set(valAt(ev.clientX));
    });
    strip.addEventListener("pointermove", function (ev) {
      if (!active) return;
      set(valAt(ev.clientX));
      strip.classList.toggle("cancel", Math.abs(ev.clientY - startY) > 80);
    });
    function end(ok) {
      if (!active) return;
      active = false; strip.classList.remove("drag");
      if (!ok || strip.classList.contains("cancel")) { strip.classList.remove("cancel"); set(0); return; }
      commit();
    }
    strip.addEventListener("pointerup", function () { end(true); });
    strip.addEventListener("pointercancel", function () { end(false); });
    strip.addEventListener("keydown", function (ev) {
      if (voted) return;
      if (ev.key === "ArrowRight" || ev.key === "ArrowUp") { set(val + 1); ev.preventDefault(); }
      else if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") { set(val - 1); ev.preventDefault(); }
      else if (ev.key === "Enter" || ev.key === " ") { commit(); ev.preventDefault(); }
    });
    window.addEventListener("resize", function () { if (voted) draw(val); });
  }
})();
