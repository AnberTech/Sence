/*! Sence "Zıpla" yükleme işareti. tasarim/animasyon/uret_zipla.py ile zipla.json'dan üretilir; elle değiştirme.
 *  Kullanım:
 *    const z = SenceZipla.mount(document.getElementById("yer"), { size: 96, theme: "auto" });
 *    z.destroy();   // kaldırmak için
 *  theme: "auto" (sistemi izler) | "light" | "dark".
 *  delay: ms; bekleme bu süreyi geçmezse işaret görünmez (varsayılan 300). Animasyon göründüğü anda baştan başlar.
 *  "Hareketi azalt" açıksa sıçrama yerine durağan ikon yavaşça solup belirir.
 *  Kısa beklemelerde hiç göstermemek için mount'u bekleme başlarken, destroy'u biterken çağır.
 *  Bağımlılık yok. ES modülü olarak da, <script> ile de çalışır. */
(function (root) {
  "use strict";
  var SPEC = {"sure":1.7,"viewBox":{"x":112,"y":72,"w":800,"h":800},"govde":{"yol":"M212 232Q212 315 234.0 357.5Q256 400 310 425Q346 442 363.5 455.0Q381 468 387.0 482.5Q393 497 393 517Q393 549 372.0 569.0Q351 589 311 589Q223 589 212 493L34 501Q40 566 73.5 617.0Q107 668 166.5 697.0Q226 726 311 726Q397 726 454.0 698.5Q511 671 539.5 623.5Q568 576 568 517Q568 473 556.0 443.5Q544 414 517.0 391.0Q490 368 445 343Q409 323 395.0 300.5Q381 278 381 232Z","tx":265.76,"ty":215.04,"olcek":0.81807,"tabanY":808.9,"tabanX":512},"nokta":{"cx":507.09,"cy":283.35,"r":70.97},"sapUcu":{"x":508.3,"y":404.8},"renkler":{"acik":{"murekkep":"#121316","holo":["#06B6D4","#6366F1","#A78BFA"]},"koyu":{"murekkep":"#F8FAFC","holo":["#67E8F9","#A5B4FC","#E9D5FF"]}},"konum_dy":[[0,[0],"io"],[0.1,[4],"out"],[0.3,[-133],"in"],[0.5,[50.5],"lin"],[0.55,[50.5],"out"],[0.66,[10],"in"],[0.74,[50.5],"lin"],[0.78,[50.5],"io"],[1,[0],"io"]],"nokta_olcek":[[0,[1,1],"io"],[0.1,[1.15,0.8],"out"],[0.17,[0.92,1.14],"out"],[0.3,[1,1],"io"],[0.5,[0.94,1.12],"out"],[0.55,[1.32,0.7],"out"],[0.62,[0.96,1.1],"io"],[0.66,[1,1],"io"],[0.74,[0.98,1.05],"out"],[0.78,[1.14,0.86],"out"],[0.86,[0.98,1.04],"io"],[1,[1,1],"io"]],"govde_boy":[[0,[1],"io"],[0.5,[1],"out"],[0.55,[0.955],"out"],[0.62,[1.012],"io"],[0.68,[1],"io"],[0.74,[1],"out"],[0.78,[0.985],"io"],[0.86,[1.004],"io"],[1,[1],"io"]],"govde_en_katsayi":0.7,"halkalar":[{"baslangic":0.5,"uzunluk":0.24,"rx0":50,"rx1":170,"ry0":12,"ry1":40,"opaklik":0.55,"kalinlik":6},{"baslangic":0.74,"uzunluk":0.16,"rx0":40,"rx1":95,"ry0":9,"ry1":22,"opaklik":0.35,"kalinlik":4}],"hareket_azalt":{"sure":2.0,"en_az":0.35},"gecikme":0.3};
  var NS = "http://www.w3.org/2000/svg";
  var ease = {
    lin: function (u) { return u; },
    "in": function (u) { return u * u; },
    out: function (u) { return 1 - (1 - u) * (1 - u); },
    io: function (u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  };
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  // kareler: [[u, [değerler], eğri], ...]; eğri bir sonraki kareye giden eğridir.
  function kf(kareler, u) {
    var i = 0;
    while (i < kareler.length - 2 && u >= kareler[i + 1][0]) i++;
    var a = kareler[i], b = kareler[i + 1], span = b[0] - a[0];
    var p = span > 0 ? Math.min(1, Math.max(0, (u - a[0]) / span)) : 1;
    p = (ease[a[2]] || ease.lin)(p);
    return a[1].map(function (v, j) { return v + (b[1][j] - v) * p; });
  }
  var uid = 0;
  function mount(host, opts) {
    opts = opts || {};
    var S = SPEC, vb = S.viewBox, g = S.govde, nk = S.nokta, su = S.sapUcu;
    var bottom = nk.cy + nk.r, id = "szp" + (++uid);
    var size = opts.size || 96;
    var svg = el("svg", { viewBox: vb.x + " " + vb.y + " " + vb.w + " " + vb.h, width: size, height: size,
                          role: "img", "aria-label": opts.label || "Loading" }, host);
    var defs = el("defs", {}, svg);
    function grad(gid, x2, y2) {
      var lg = el("linearGradient", { id: gid, x1: 0, y1: 0, x2: x2, y2: y2 }, defs);
      return [el("stop", { offset: 0 }, lg), el("stop", { offset: 0.5 }, lg), el("stop", { offset: 1 }, lg)];
    }
    var gDot = grad(id + "d", 1, 1), gRing = grad(id + "r", 1, 0);
    var spec = S.halkalar.slice().reverse();   // ikinci halka altta
    var halkalar = spec.map(function (h) {
      return el("ellipse", { cx: su.x, cy: su.y, rx: 0, ry: 0, fill: "none", "stroke-width": h.kalinlik,
                             stroke: "url(#" + id + "r)", opacity: 0 }, svg);
    });
    var body = el("g", {}, svg);
    var inner = el("g", { transform: "translate(" + g.tx + " " + g.ty + ") scale(" + g.olcek + ")" }, body);
    var path = el("path", { d: g.yol }, inner);
    var dot = el("circle", { cx: nk.cx, cy: nk.cy, r: nk.r, fill: "url(#" + id + "d)" }, svg);

    var mq = root.matchMedia ? root.matchMedia("(prefers-color-scheme: dark)") : null;
    function tema() { return opts.theme === "dark" || (opts.theme !== "light" && mq && mq.matches) ? "koyu" : "acik"; }
    function boya() {
      var r = S.renkler[tema()];
      path.setAttribute("fill", r.murekkep);
      [gDot, gRing].forEach(function (st) { st.forEach(function (s, i) { s.setAttribute("stop-color", r.holo[i]); }); });
    }
    boya();
    if (mq && mq.addEventListener) mq.addEventListener("change", boya);

    function render(t) {
      var u = (t % S.sure) / S.sure;
      var dy = kf(S.konum_dy, u)[0], sc = kf(S.nokta_olcek, u), sb = kf(S.govde_boy, u)[0];
      dot.setAttribute("transform", "translate(" + nk.cx + " " + (bottom + dy) + ") scale(" + sc[0] + " " + sc[1] +
                       ") translate(" + (-nk.cx) + " " + (-bottom) + ")");
      body.setAttribute("transform", "translate(" + g.tabanX + " " + g.tabanY + ") scale(" +
                        (1 + (1 - sb) * S.govde_en_katsayi) + " " + sb + ") translate(" + (-g.tabanX) + " " + (-g.tabanY) + ")");
      halkalar.forEach(function (e, i) {
        var h = spec[i], q = (u - h.baslangic) / h.uzunluk;
        if (q < 0 || q >= 1) { e.setAttribute("opacity", 0); return; }
        var k = ease.out(q);
        e.setAttribute("rx", h.rx0 + (h.rx1 - h.rx0) * k);
        e.setAttribute("ry", h.ry0 + (h.ry1 - h.ry0) * k);
        e.setAttribute("opacity", h.opaklik * (1 - q));
      });
    }
    render(0);

    var reduce = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ha = S.hareket_azalt;
    var gecikme = opts.delay != null ? opts.delay : S.gecikme * 1000;
    var raf = 0, t0 = 0, zamanlayici = 0, oynat = opts.autoplay !== false;
    svg.style.visibility = gecikme > 0 && oynat ? "hidden" : "visible";
    function tick(now) {
      if (!t0) t0 = now;
      var t = (now - t0) / 1000;
      if (reduce) {
        render(0);
        svg.style.opacity = ha.en_az + (1 - ha.en_az) * (0.5 - 0.5 * Math.cos(2 * Math.PI * t / ha.sure));
      } else render(t);
      raf = root.requestAnimationFrame(tick);
    }
    function basla() { svg.style.visibility = "visible"; t0 = 0; raf = root.requestAnimationFrame(tick); }
    if (oynat) { if (gecikme > 0) zamanlayici = root.setTimeout(basla, gecikme); else basla(); }
    return {
      svg: svg, seek: render,
      destroy: function () {
        if (raf) root.cancelAnimationFrame(raf);
        if (zamanlayici) root.clearTimeout(zamanlayici);
        if (mq && mq.removeEventListener) mq.removeEventListener("change", boya);
        if (svg.parentNode) svg.parentNode.removeChild(svg);
      }
    };
  }
  var api = { mount: mount, spec: SPEC };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.SenceZipla = api;
})(typeof window !== "undefined" ? window : this);
