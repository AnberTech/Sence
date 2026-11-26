/* Sence sitesi · girişteki "Kalabalık" (2026-11-26)
   Telefonun çevresinde uygulamadaki "Yüz" avatarlarından bir kalabalık durur (renkler tasarim/avatar/uret_avatar.py ile aynı 33 palet).
   Gözleri imleci izler (imleç yoksa telefondaki soruya bakar), ara sıra göz kırparlar, imleç yaklaşınca hafifçe kenara çekilirler.
   Telefondaki kartta oy verilince ("sence:vote") kalabalık sonuca göre ikiye ayrılır: Hayır diyenler Hayır'ın, Evet diyenler Evet'in tarafına geçer;
   senin yüzün de seçtiğin tarafa katılır. "Bir daha" ("sence:reset") ile yeniden karışırlar.
   "Hareketi azalt" açıksa kalabalık durağandır; ayrılma bir anda olur. Bağımlılık yok. */
(function () {
  "use strict";
  var hero = document.querySelector(".hero"), cv = hero && hero.querySelector("canvas.crowd");
  if (!cv || !cv.getContext) return;
  var card = hero.querySelector(".hero-card"), phone = hero.querySelector(".phone"), copy = hero.querySelector(".copy");
  var doc = document.documentElement, ctx = cv.getContext("2d");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var YOU = (document.body.dataset.you || "Sen");

  var PAL = [
    ["#22D3EE", "#7C83FF", "#C084FC"], ["#F472B6", "#A78BFA", "#38BDF8"], ["#34D399", "#2DD4BF", "#38BDF8"],
    ["#FBBF24", "#F472B6", "#FB7185"], ["#818CF8", "#E879F9", "#F472B6"], ["#4ADE80", "#FACC15", "#FB923C"],
    ["#60A5FA", "#22D3EE", "#34D399"], ["#F472B6", "#FB923C", "#FACC15"], ["#A78BFA", "#818CF8", "#60A5FA"],
    ["#2DD4BF", "#A78BFA", "#E879F9"], ["#FB7185", "#C084FC", "#60A5FA"], ["#A3E635", "#2DD4BF", "#38BDF8"],
    ["#FCA5A5", "#EF4444", "#B91C1C"], ["#FDBA9C", "#FB7185", "#E11D48"], ["#FDBA74", "#FB923C", "#EA580C"],
    ["#FDE68A", "#FBBF24", "#D97706"], ["#FEF08A", "#FACC15", "#CA8A04"], ["#D9F99D", "#84CC16", "#4D7C0F"],
    ["#86EFAC", "#22C55E", "#15803D"], ["#6EE7B7", "#10B981", "#047857"], ["#5EEAD4", "#14B8A6", "#0F766E"],
    ["#67E8F9", "#06B6D4", "#0E7490"], ["#7DD3FC", "#0EA5E9", "#0369A1"], ["#93C5FD", "#3B82F6", "#1D4ED8"],
    ["#A5B4FC", "#4F46E5", "#312E81"], ["#C4B5FD", "#8B5CF6", "#5B21B6"], ["#D8B4FE", "#A855F7", "#6B21A8"],
    ["#F0ABFC", "#D946EF", "#A21CAF"], ["#F9A8D4", "#EC4899", "#BE185D"], ["#FDA4AF", "#F43F5E", "#BE123C"],
    ["#D4A373", "#A0673A", "#6F4020"], ["#9CA3AF", "#4B5563", "#1F2937"], ["#FFFFFF", "#E5E7EB", "#C4C8D0"]
  ];
  // Kalabalıkta tema renkleri (00–11) daha sık görünür; tema dışı renkler serpiştirilir.
  function pickPal() { return Math.random() < 0.62 ? (Math.random() * 12) | 0 : 12 + ((Math.random() * 21) | 0); }

  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function lum(h) {
    return rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce(function (a, c, i) { return a + c * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  var EYE_DARK = "#121316";
  function eyeColor(p) {   // topun ortasındaki renkle en çok kontrast veren göz (uygulamadaki goz() ile aynı)
    var l = lum(PAL[p][1]), dark = (l + 0.05) / (lum(EYE_DARK) + 0.05), white = 1.05 / (l + 0.05);
    return dark >= white ? EYE_DARK : "#FFFFFF";
  }

  /* ---- top görselleri (gözsüz; gözler her karede çizilir) ---- */
  var S = 128, sprites = [];
  function makeSprites() {
    var dark = doc.dataset.theme === "dark";
    sprites = PAL.map(function (cols) {
      var c = document.createElement("canvas"); c.width = c.height = S;
      var g = c.getContext("2d"), R = S * 0.4, cx = S / 2, cy = S / 2 - S * 0.02;
      // yumuşak gölge
      var sh = g.createRadialGradient(cx, cy + R * 0.98, 0, cx, cy + R * 0.98, R * 0.9);
      sh.addColorStop(0, dark ? "rgba(0,0,0,.55)" : "rgba(27,28,58,.28)"); sh.addColorStop(1, "rgba(0,0,0,0)");
      g.save(); g.translate(cx, cy + R * 0.98); g.scale(1, 0.28); g.translate(-cx, -(cy + R * 0.98));
      g.fillStyle = sh; g.beginPath(); g.arc(cx, cy + R * 0.98, R * 0.9, 0, 7); g.fill(); g.restore();
      // top: soldan üstten sağa alta üç renkli gradyan
      var lg = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      lg.addColorStop(0, cols[0]); lg.addColorStop(0.5, cols[1]); lg.addColorStop(1, cols[2]);
      g.fillStyle = lg; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
      // parlak lekesi
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
      var hx = cx - R + R * 0.64, hy = cy - R + R * 0.4;
      g.translate(hx, hy); g.scale(1, 0.62);
      var hl = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.42);
      hl.addColorStop(0, "rgba(255,255,255,.62)"); hl.addColorStop(0.6, "rgba(255,255,255,.4)"); hl.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = hl; g.beginPath(); g.arc(0, 0, R * 0.42, 0, 7); g.fill(); g.restore();
      // ince iç kenar
      g.strokeStyle = dark ? "rgba(255,255,255,.12)" : "rgba(18,19,22,.06)"; g.lineWidth = 1.2;
      g.beginPath(); g.arc(cx, cy, R - 0.6, 0, 7); g.stroke();
      return c;
    });
  }
  var EYE = PAL.map(function (_, i) { return eyeColor(i); });

  /* ---- yerleşim ---- */
  var W = 0, H = 0, dpr = 1, faces = [], you = null, rects = null, t0 = performance.now(), last = t0;
  var split = null;   // { noLeft: bool, mineSide: 0|1, at: zaman }
  function rel(r, o) { return { l: r.left - o.left, t: r.top - o.top, r: r.right - o.left, b: r.bottom - o.top }; }
  function measure() {
    var h = hero.getBoundingClientRect();
    var c = copy.getBoundingClientRect(), p = phone.getBoundingClientRect();
    // yazının kapladığı gerçek alan: satır satır (başlık, paragraf, düğmeler)
    var parts = [].map.call(copy.children, function (el) { return rel(el.getBoundingClientRect(), h); });
    var note = hero.querySelector(".device .note"); if (note) parts.push(rel(note.getBoundingClientRect(), h));
    rects = { hero: h, copy: rel(c, h), parts: parts, phone: rel(p, h), narrow: h.width < 900 };
  }
  function hitsText(x, y, r) {
    var pad = r + (rects.narrow ? 6 : 14);
    for (var i = 0; i < rects.parts.length; i++) {
      var q = rects.parts[i];
      if (x > q.l - pad && x < q.r + pad && y > q.t - pad && y < q.b + pad) return true;
    }
    return false;
  }
  function allowed(x, y, r, side) {
    var P = rects.phone, inset = Math.min(r * 0.9, 22);
    if (y < 86 + r * 0.3 || y > H - r * 0.2 || x < -r * 0.3 || x > W + r * 0.3) return false;
    if (x > P.l + inset && x < P.r - inset && y > P.t + inset && y < P.b - inset) return false;   // telefonun arkası: görünmez
    if (hitsText(x, y, r)) return false;
    if (side != null) {
      var mid = (P.l + P.r) / 2, left = side === 0 ? split.noLeft : !split.noLeft;
      if (left ? x > mid - r * 0.5 : x < mid + r * 0.5) return false;
    }
    return true;
  }
  function farEnough(x, y, r, list, skip) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i]; if (f === skip) continue;
      var fx = f.tx != null ? f.tx : f.hx, fy = f.ty != null ? f.ty : f.hy;
      var dx = fx - x, dy = fy - y, m = f.r + r + (rects.narrow ? 3 : 6);
      if (dx * dx + dy * dy < m * m) return false;
    }
    return true;
  }
  // telefona yakın yerler daha olası: kalabalık sorunun etrafına toplanır
  function nearPhone(x, y) {
    var P = rects.phone, cx = (P.l + P.r) / 2, cy = (P.t + P.b) / 2;
    var d = Math.hypot((x - cx) / (W * 0.5), (y - cy) / (H * 0.75));
    return Math.max(0.04, 1 - d * 1.1);
  }
  function radius() {
    var n = rects.narrow, u = Math.pow(Math.random(), 1.7);
    return n ? 8 + u * 12 : 9 + u * 21;
  }
  function spot(r, side, list, skip, strict) {
    for (var k = 0; k < 600; k++) {
      var x = Math.random() * W, y = 70 + Math.random() * (H - 70);
      if (strict) {   // senin yüzün: tamamen görünür olsun (telefonun arkasına, kenara ya da yazının üstüne düşmesin)
        var Q = rects.phone;
        if (x < r + 16 || x > W - r - 16 || y < 110 || y > H - r - 40) continue;
        if (x > Q.l - r - 10 && x < Q.r + r + 10 && y > Q.t - r - 10 && y < Q.b + r + 34) continue;
      }
      if (Math.random() > nearPhone(x, y)) continue;
      if (allowed(x, y, r, side) && farEnough(x, y, r, list, skip)) return [x, y];
    }
    return null;
  }
  function layout(fresh) {
    measure();
    var nw = Math.round(rects.hero.width), nh = Math.round(rects.hero.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = nw; H = nh;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var target = rects.narrow ? Math.round(W * H / 10000) : Math.round(W * H / 21000);
    target = Math.max(14, Math.min(rects.narrow ? 40 : 70, target));
    var old = faces; faces = [];
    for (var tries = 0; faces.length < target && tries < target * 6; tries++) {
      var r = radius(), s = spot(r, null, faces);
      if (!s) continue;
      var o = old[faces.length];
      var f = {
        pal: o ? o.pal : pickPal(), r: r, hx: s[0], hy: s[1], tx: s[0], ty: s[1],
        x: o && !fresh ? o.x : s[0], y: o && !fresh ? o.y : s[1], vx: 0, vy: 0,
        ph1: Math.random() * 6.28, ph2: Math.random() * 6.28, amp: 2 + Math.random() * 5, sp: 0.35 + Math.random() * 0.5,
        ex: 0, ey: 0, blink: 1.5 + Math.random() * 6, side: -1, ring: 0, hop: -9, px: 0, py: 0,
        born: fresh ? 0.35 + Math.random() * 0.25 + (1 - nearPhone(s[0], s[1])) * 0.55 : -9
      };
      faces.push(f);
    }
    faces.sort(function (a, b) { return a.r - b.r; });   // küçükler (uzaktakiler) önce çizilir
    if (split) applySplit(true);
  }

  /* ---- oy: kalabalık ikiye ayrılır ---- */
  function applySplit(instant) {
    var noShare = split.percents[0] / 100;
    var order = faces.slice().sort(function (a, b) { return a.hx - b.hx; });
    if (!split.noLeft) order.reverse();
    var nNo = Math.round(order.length * noShare);
    var placed = [];
    order.forEach(function (f, i) {
      f.side = i < nNo ? 0 : 1;
      var ok = allowed(f.hx, f.hy, f.r, f.side) ? [f.hx, f.hy] : null;
      if (ok && !farEnough(ok[0], ok[1], f.r, placed)) ok = null;
      if (!ok) ok = spot(f.r, f.side, placed) || [f.hx, f.hy];
      f.tx = ok[0]; f.ty = ok[1];
      placed.push({ hx: f.tx, hy: f.ty, r: f.r });
      f.hop = f.side === split.mine ? now() + 0.55 + Math.random() * 0.5 : -9;
      if (instant) { f.x = f.tx; f.y = f.ty; f.ring = 1; }
    });
  }
  function now() { return (performance.now() - t0) / 1000; }
  if (card) {
    card.addEventListener("sence:vote", function (ev) {
      var d = ev.detail; if (!d || d.kind !== "yesno") return;
      split = { percents: d.percents, mine: d.mine, noLeft: d.sides[0] < d.sides[1] };
      applySplit(reduce);
      // senin yüzün: oy verdiğin dilimden çıkıp kendi tarafına katılır
      var h = hero.getBoundingClientRect(), sl = card.querySelectorAll(".strip .sl")[d.mine].getBoundingClientRect();
      var sx = (sl.left + sl.right) / 2 - h.left, sy = (sl.top + sl.bottom) / 2 - h.top;
      var r = rects.narrow ? 17 : 24, s = spot(r, d.mine, faces, null, true) || spot(r, d.mine, [], null, true) || spot(r, d.mine, []) || [sx, sy];
      you = { pal: 0, r: r, x: sx, y: sy, vx: 0, vy: 0, tx: s[0], ty: s[1], hx: s[0], hy: s[1], ph1: 1, ph2: 2, amp: 2, sp: 0.5, ex: 0, ey: 0,
              blink: 3, side: d.mine, ring: 0, hop: now() + 0.9, px: 0, py: 0, born: reduce ? -9 : now(), you: true, out: 0 };
      if (reduce) { you.x = you.tx; you.y = you.ty; you.ring = 1; }
      wake();
    });
    card.addEventListener("sence:reset", function () {
      split = null;
      faces.forEach(function (f) { f.side = -1; f.tx = f.hx; f.ty = f.hy; if (reduce) { f.x = f.hx; f.y = f.hy; f.ring = 0; } });
      if (you) you.out = now();
      if (reduce) you = null;
      wake();
    });
  }

  /* ---- imleç ---- */
  var ptr = { x: 0, y: 0, at: -99 };
  window.addEventListener("pointermove", function (ev) { ptr.x = ev.clientX; ptr.y = ev.clientY; ptr.at = now(); }, { passive: true });
  window.addEventListener("pointerdown", function (ev) { ptr.x = ev.clientX; ptr.y = ev.clientY; ptr.at = now(); }, { passive: true });

  /* ---- çizim ---- */
  var COL = { evet: "#00C48C", hayir: "#E62E4D" };
  function readCols() {
    var cs = getComputedStyle(doc);
    COL.evet = cs.getPropertyValue("--evet").trim() || COL.evet;
    COL.hayir = cs.getPropertyValue("--hayir").trim() || COL.hayir;
    COL.h1 = cs.getPropertyValue("--h1").trim(); COL.h2 = cs.getPropertyValue("--h2").trim(); COL.h3 = cs.getPropertyValue("--h3").trim();
    COL.ink = cs.getPropertyValue("--ink").trim(); COL.zemin = cs.getPropertyValue("--kutu").trim();
  }
  function backOut(u) { var c = 1.6; u -= 1; return 1 + (c + 1) * u * u * u + c * u * u; }
  function drawFace(f, t, look, hr) {
    // yay: hedefe biraz esneyerek gider
    var k = 34, damp = 8.5, dt = f._dt;
    f.vx += (f.tx - f.x) * k * dt; f.vy += (f.ty - f.y) * k * dt;
    var dd = Math.exp(-damp * dt); f.vx *= dd; f.vy *= dd;
    f.x += f.vx * dt; f.y += f.vy * dt;
    var dx = reduce ? 0 : f.amp * Math.sin(t * f.sp + f.ph1), dy = reduce ? 0 : f.amp * 0.8 * Math.cos(t * f.sp * 0.8 + f.ph2);
    // imleç yaklaşınca utangaçça kenara çekil
    var px = 0, py = 0;
    if (!reduce && t - ptr.at < 4) {
      var mx = ptr.x - hr.left, my = ptr.y - hr.top, ax = f.x - mx, ay = f.y - my, d = Math.hypot(ax, ay), R = 110 + f.r;
      if (d < R && d > 0.1) { var push = (1 - d / R) * (16 + f.r * 0.4); px = ax / d * push; py = ay / d * push; }
    }
    f.px += (px - f.px) * Math.min(1, dt * 8); f.py += (py - f.py) * Math.min(1, dt * 8);
    // zıplama (kendi tarafın kazanınca bir kez)
    var hopY = 0, sq = 1;
    if (!reduce && f.hop > 0) {
      var u = (t - f.hop) / 0.75;
      if (u >= 0 && u <= 1) {
        if (u < 0.55) { var v = u / 0.55; hopY = -Math.sin(v * Math.PI) * f.r * 1.3; sq = 1 + Math.sin(v * Math.PI) * 0.08; }
        else { var w = (u - 0.55) / 0.45; sq = 1 - Math.sin(w * Math.PI) * 0.16 * (1 - w); }
      }
    }
    var x = f.x + dx + f.px, y = f.y + dy + f.py + hopY;
    // doğuş
    var s = 1, a = 1;
    if (f.born > 0) {
      var b = (t - f.born) / 0.55;
      if (b < 0) return; if (b < 1) { s = backOut(b); a = Math.min(1, b * 2); }
    }
    if (f.you && f.out) {
      var o = (t - f.out) / 0.4; if (o >= 1) { you = null; return; }
      s *= 1 - o; a *= 1 - o;
    }
    var depth = f.you ? 1 : 0.62 + 0.38 * Math.min(1, (f.r - 8) / 24);
    var r = f.r * s, sw = r * (2 - sq), shh = r * sq;
    ctx.globalAlpha = a * depth;
    // halka: hangi tarafta olduğu
    f.ring += ((f.side >= 0 ? 1 : 0) - f.ring) * Math.min(1, dt * 6);
    if (f.ring > 0.02) {
      ctx.lineWidth = Math.max(1.5, r * 0.09);
      if (f.you) {
        var g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
        g.addColorStop(0, COL.h1); g.addColorStop(0.5, COL.h2); g.addColorStop(1, COL.h3); ctx.strokeStyle = g;
        ctx.lineWidth = Math.max(2.4, r * 0.14);
      } else ctx.strokeStyle = f.side === 0 || (f.side < 0 && f._lastSide === 0) ? COL.hayir : COL.evet;
      ctx.globalAlpha = a * depth * f.ring;
      ctx.beginPath(); ctx.arc(x, y, r * 1.16, 0, 7); ctx.stroke();
      ctx.globalAlpha = a * depth;
    }
    if (f.side >= 0) f._lastSide = f.side;
    ctx.drawImage(sprites[f.pal], x - sw / 0.4 / 2, y - shh / 0.4 / 2 + r * 0.05, sw / 0.4, shh / 0.4);
    // gözler: bakılan yere döner
    var lx = look[0] - x, ly = look[1] - y, ld = Math.hypot(lx, ly) || 1, m = Math.min(1, ld / 160);
    var tex = lx / ld * m * 0.13, tey = ly / ld * m * 0.1;
    f.ex += (tex - f.ex) * Math.min(1, dt * 9); f.ey += (tey - f.ey) * Math.min(1, dt * 9);
    // göz kırpma
    var bl = 1;
    if (!reduce) {
      if (t > f.blink) { var q = (t - f.blink) / 0.16; if (q >= 1) f.blink = t + 2.5 + Math.random() * 6; else bl = 1 - Math.sin(q * Math.PI) * 0.88; }
    }
    ctx.fillStyle = EYE[f.pal];
    var ex = r * 0.315, ey = r * 0.056, erx = r * 0.096, ery = r * 0.167 * bl;
    for (var side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.ellipse(x + side * ex * (sw / r) + f.ex * r, y + ey + f.ey * r, erx, Math.max(0.6, ery * sq), 0, 0, 7);
      ctx.fill();
    }
    if (f.you && s > 0.6) {   // "Sen" etiketi
      ctx.globalAlpha = a * Math.min(1, f.ring * 1.4);
      ctx.font = "600 " + (rects.narrow ? 11 : 12) + "px Geist, -apple-system, sans-serif";
      var tw = ctx.measureText(YOU).width + 14, ty = y + r * 1.16 + 8;
      ctx.fillStyle = COL.ink; roundRect(x - tw / 2, ty, tw, 20, 10); ctx.fill();
      ctx.fillStyle = COL.zemin; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(YOU, x, ty + 10.5);
    }
    ctx.globalAlpha = 1;
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  var raf = 0, visible = true, idleSince = 0;
  function frame() {
    raf = 0;
    var tn = performance.now(), dt = Math.min(0.05, (tn - last) / 1000); last = tn;
    var t = now(), hr = hero.getBoundingClientRect();
    // bakılan yer: son 2,5 sn'de imleç oynadıysa imleç, yoksa telefondaki şerit
    var look;
    if (t - ptr.at < 2.5) look = [ptr.x - hr.left, ptr.y - hr.top];
    else {
      var st = card && card.querySelector(".strip"), sr = st ? st.getBoundingClientRect() : phone.getBoundingClientRect();
      look = [(sr.left + sr.right) / 2 - hr.left, (sr.top + sr.bottom) / 2 - hr.top];
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < faces.length; i++) { faces[i]._dt = dt; drawFace(faces[i], t, look, hr); }
    if (you) { you._dt = dt; drawFace(you, t, look, hr); }
    if (reduce) {   // durağan: yalnız gerektiğinde çiz (imleç, oy)
      if (t - ptr.at < 3 || t - idleSince < 1.5) raf = requestAnimationFrame(frame);
      return;
    }
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function wake() { idleSince = now(); if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  window.addEventListener("pointermove", function () { if (reduce) wake(); }, { passive: true });

  function start() {
    readCols(); makeSprites(); layout(!reduce);
    cv.classList.add("on");
    wake();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) wake(); });
    var rt = 0, lw = window.innerWidth;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        // telefonda adres çubuğu gizlenince yalnız yükseklik oynar: yeniden dizme
        if (Math.abs(window.innerWidth - lw) < 2 && Math.abs(hero.getBoundingClientRect().height - H) < 120) return;
        lw = window.innerWidth; layout(false); wake();
      }, 160);
    });
    document.addEventListener("sence:theme", function () { readCols(); makeSprites(); wake(); });
  }
  // yazı tipi yüklenince ölç (başlığın boyu yazı tipine göre değişir)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(start); });
  else window.addEventListener("load", start);
})();
