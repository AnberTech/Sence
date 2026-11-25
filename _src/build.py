#!/usr/bin/env python3
"""Sence sitesi üretici. Depo kökünden çalıştır:  python3 _src/build.py

Üretir: index.html (TR), en/index.html, destek/index.html, en/support/index.html, sitemap.xml, llms.txt.
Üretilen HTML dosyaları elle düzenlenmez; metinler _src/i18n/<dil>.json, yapı bu dosyada.
s/ klasörüne (paylaşılan soru sayfası) DOKUNMAZ; o elle yönetilir.
"""
import datetime
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '_src')
BASE = 'https://anbertech.github.io/Sence/'
HOME = 'https://anbertech.github.io/'
EMAIL = 'destek.anbertech@gmail.com'
LANGS = ('tr', 'en')                      # ilk dil kökte yayınlanır
PATH = {'tr': '', 'en': 'en/'}
APP_STORE = None                          # yayına çıkınca: 'https://apps.apple.com/app/id…' (rozetler kendiliğinden bağlanır)
APP_ID = None                             # yayına çıkınca: '67…' (Safari akıllı uygulama şeridi)
PLAY = None                               # yayına çıkınca: 'https://play.google.com/store/apps/details?id=…'
VER = '2'                                 # css/js önbellek sürümü; stil ya da betik değişince artır
TODAY = datetime.date.today().isoformat()
P = ['']                                  # o an üretilen sayfanın köke göre öneki (kart görselleri için)


def e(s):
    return html.escape(str(s), quote=True)


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def write(rel, text):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(text)


T = {l: json.loads(read(os.path.join(SRC, 'i18n', f'{l}.json'))) for l in LANGS}


def check_i18n():
    """Bütün diller kaynak (tr) ile aynı anahtarlara ve liste uzunluklarına sahip olmalı."""
    src = T['tr']
    for l in LANGS[1:]:
        d = T[l]
        miss = set(src) - set(d)
        extra = set(d) - set(src)
        if miss or extra:
            raise SystemExit(f'{l}.json anahtar farkı: eksik={sorted(miss)} fazla={sorted(extra)}')
        for k, v in src.items():
            if isinstance(v, list) and len(v) != len(d[k]):
                raise SystemExit(f'{l}.json "{k}" listesi {len(d[k])} öğe, kaynakta {len(v)}')


# --------------------------------------------------------------------------- ikonlar (24'lük, çizgi)
IC = {
    'agenda': '<path d="M12 2.8c.9 3 5.2 5.2 5.2 10.3a5.2 5.2 0 0 1-10.4 0c0-2.3 1-3.8 2.3-5 .3 1.6 1.1 2.6 2.1 3C10.7 8.4 11.2 5.5 12 2.8z"/>',
    'square': '<rect x="3.8" y="8.6" width="16.4" height="12" rx="3"/><path d="M6.3 5.4h11.4M8.6 2.6h6.8"/>',
    'decisions': '<path d="M12 2.6l2.4 1.7 2.9-.1 1 2.8 2.3 1.8-.9 2.8.9 2.8-2.3 1.8-1 2.8-2.9-.1L12 21.4l-2.4-1.7-2.9.1-1-2.8-2.3-1.8.9-2.8-.9-2.8 2.3-1.8 1-2.8 2.9.1z"/><path d="M8.6 12.2l2.3 2.3 4.5-4.6"/>',
    'me': '<circle cx="12" cy="8.2" r="3.9"/><path d="M4.6 20.2c1.3-3.7 4.2-5.5 7.4-5.5s6.1 1.8 7.4 5.5"/>',
    'resence': '<path d="M16.8 2.6l3 3-3 3"/><path d="M4.2 11V9.6a4 4 0 0 1 4-4h11.6"/><path d="M7.2 21.4l-3-3 3-3"/><path d="M19.8 13v1.4a4 4 0 0 1-4 4H4.2"/>',
    'comment': '<path d="M20.2 14.6a3.2 3.2 0 0 1-3.2 3.2H9.4L4.6 21.2V7a3.2 3.2 0 0 1 3.2-3.2H17A3.2 3.2 0 0 1 20.2 7z"/>',
    'bell': '<path d="M6 16.4V11a6 6 0 1 1 12 0v5.4l1.6 2H4.4z"/><path d="M9.9 20.6a2.3 2.3 0 0 0 4.2 0"/>',
    'share': '<path d="M12 3.2v11.6"/><path d="M7.6 7.4L12 3l4.4 4.4"/><path d="M5.2 11.6v6.2a3 3 0 0 0 3 3h7.6a3 3 0 0 0 3-3v-6.2"/>',
    'theme': '<circle cx="12" cy="12" r="8.6"/><path d="M12 3.4a8.6 8.6 0 0 1 0 17.2z" fill="currentColor" stroke="none"/>',
    'mask': '<circle cx="12" cy="12" r="3.6"/><path d="M15.6 12v1.3a2.6 2.6 0 0 0 5.2 0V12a8.8 8.8 0 1 0-3.5 7"/>',
    'lock': '<rect x="4.8" y="10.4" width="14.4" height="10.4" rx="3"/><path d="M8.4 10.4V7.6a3.6 3.6 0 0 1 7.2 0v2.8"/><path d="M12 14.4v2.4"/>',
    'photo': '<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="3.2"/><circle cx="9" cy="9.8" r="1.8"/><path d="M20.6 15.6l-4.8-4.8-8.6 8.6"/>',
    'shield': '<path d="M12 2.8l7.6 3v5.6c0 4.6-3.2 8.1-7.6 9.8-4.4-1.7-7.6-5.2-7.6-9.8V5.8z"/><path d="M8.9 11.8l2.2 2.2 4.1-4.2"/>',
    'age': '<circle cx="12" cy="12" r="9.2"/><text x="12" y="15.6" text-anchor="middle" font-size="10" font-weight="800" letter-spacing="-.6" fill="currentColor" stroke="none" font-family="Geist,sans-serif">18</text>',
    'key': '<circle cx="8" cy="15.6" r="4.2"/><path d="M11 12.6l8.6-8.6M16.2 7.4l2.6 2.6M14 9.6l2 2"/>',
    'timer': '<circle cx="12" cy="13.2" r="7.8"/><path d="M12 9.4v3.8l2.4 1.8"/><path d="M9.6 2.6h4.8"/>',
    'tap': '<path d="M9.2 11.4V5.6a1.6 1.6 0 0 1 3.2 0v4.9"/><path d="M12.4 10.3V9.2a1.6 1.6 0 0 1 3.2 0v1.6"/><path d="M15.6 10.8v-.6a1.6 1.6 0 0 1 3.2 0v4.3c0 3.6-2.4 6.5-6 6.5h-.9c-1.9 0-3.4-.8-4.5-2.4L4.7 14.7a1.6 1.6 0 0 1 2.6-1.9l1.9 2"/>',
    'dots': '<circle cx="5.6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18.4" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
    'sun': '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M5.4 18.6l1.5-1.5M17.1 6.9l1.5-1.5"/>',
    'moon': '<path d="M20.2 14.4A8.4 8.4 0 0 1 9.6 3.8a8.4 8.4 0 1 0 10.6 10.6z"/>',
    'down': '<path d="M12 4.6v14.8M6.4 13.8L12 19.4l5.6-5.6"/>',
    'mail': '<rect x="3.2" y="5.2" width="17.6" height="13.6" rx="3"/><path d="M4 7l8 6 8-6"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'check': '<path d="M5 12.6l4.4 4.4L19 7.4"/>',
    'again': '<path d="M4.6 12a7.4 7.4 0 1 0 2.2-5.3"/><path d="M4.4 3.6v4h4"/>',
    'arrow': '<path d="M5 12h14M13.4 6.4L19 12l-5.6 5.6"/>',
}
APPLE = ('<svg class="apple" viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>')


def ic(name, cls='ic'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{IC[name]}</svg>'


# Ters soru işareti (uygulama ikonundaki işaret; tasarim/ikon/svg/sence_isaret_*.svg ile aynı geometri)
MARK_PATH = ('M212 232Q212 315 234.0 357.5Q256 400 310 425Q346 442 363.5 455.0Q381 468 387.0 482.5Q393 497 393 517Q393 549 372.0 '
             '569.0Q351 589 311 589Q223 589 212 493L34 501Q40 566 73.5 617.0Q107 668 166.5 697.0Q226 726 311 726Q397 726 454.0 '
             '698.5Q511 671 539.5 623.5Q568 576 568 517Q568 473 556.0 443.5Q544 414 517.0 391.0Q490 368 445 343Q409 323 395.0 '
             '300.5Q381 278 381 232Z')
_mid = [0]


def mark(cls='mark'):
    _mid[0] += 1
    g = f'mk{_mid[0]}'
    return (f'<svg class="{cls}" viewBox="283 202 458 617" aria-hidden="true"><defs><linearGradient id="{g}" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" class="h1"/><stop offset=".5" class="h2"/><stop offset="1" class="h3"/></linearGradient></defs>'
            f'<g transform="translate(265.76 215.04) scale(0.81807)"><path d="{MARK_PATH}" fill="currentColor"/></g>'
            f'<circle cx="507.09" cy="283.35" r="70.97" fill="url(#{g})"/></svg>')


def logo(t, href, cls='brand'):
    return (f'<a class="{cls}" href="{href}" aria-label="{e(t["aria_home"])}"><span class="word">sence</span>{mark("mark")}</a>')


# "Yüz" avatarı (tasarim/avatar/uret_avatar.py paletleri)
PAL = [["#22D3EE", "#7C83FF", "#C084FC"], ["#F472B6", "#A78BFA", "#38BDF8"], ["#34D399", "#2DD4BF", "#38BDF8"],
       ["#FBBF24", "#F472B6", "#FB7185"], ["#818CF8", "#E879F9", "#F472B6"], ["#4ADE80", "#FACC15", "#FB923C"],
       ["#60A5FA", "#22D3EE", "#34D399"], ["#F472B6", "#FB923C", "#FACC15"]]
_aid = [0]


def avatar(p):
    _aid[0] += 1
    g = f'av{_aid[0]}'
    a, b, c = PAL[p]
    return (f'<svg class="ava" viewBox="0 0 1024 1024" aria-hidden="true"><defs><linearGradient id="{g}" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="{a}"/><stop offset=".5" stop-color="{b}"/><stop offset="1" stop-color="{c}"/></linearGradient></defs>'
            f'<circle cx="512" cy="512" r="490" fill="url(#{g})"/>'
            f'<ellipse cx="342" cy="250" rx="170" ry="100" fill="#fff" fill-opacity=".45"/>'
            f'<ellipse cx="364" cy="538" rx="46" ry="78" fill="#121316"/><ellipse cx="660" cy="538" rx="46" ry="78" fill="#121316"/></svg>')


# --------------------------------------------------------------------------- örnek kartlar
def social(t, c, r, v):
    return (f'<div class="social"><span>{ic("comment")}<b class="mono">{c}</b><i class="sr">{e(t["comments"])}</i></span>'
            f'<span>{ic("resence")}<b class="mono">{r}</b><i class="sr">{e(t["resences"])}</i></span>'
            f'<span>{ic("tap")}<b class="mono" data-count>{v}</b><i class="sr">{e(t["bence"])}</i></span></div>')


def head(t, nick, pal, timer=None):
    tm = f'<span class="timer mono">{ic("timer")}<span data-timer="{timer}"></span></span>' if timer else ''
    return (f'<header class="qhead">{avatar(pal)}<b>{e(nick)}</b><span class="more">{ic("dots")}</span></header>'
            f'<div class="qmeta">{tm}</div>')


def strip_yesno(t):
    return (f'<div class="strip yn" role="group" aria-label="{e(t["a11y_strip_yesno"])}">'
            f'<button type="button" class="sl no" data-v="0"><span class="lab">{e(t["no"])}</span><span class="pct mono"></span></button>'
            f'<button type="button" class="sl yes" data-v="1"><span class="lab">{e(t["yes"])}</span><span class="pct mono"></span></button>'
            f'</div>')


def strip_choice(t, labels):
    btns = ''.join(f'<button type="button" class="sl ch" data-v="{i}"><span class="lab"><b>{"ABCD"[i]}</b> {e(x)}</span>'
                   f'<span class="pct mono"></span></button>' for i, x in enumerate(labels))
    return f'<div class="strip choice" role="group" aria-label="{e(t["a11y_strip_choice"])}">{btns}</div>'


def strip_rate(t):
    ticks = ''.join(f'<i style="left:{i * 10}%"></i>' for i in range(11))
    return (f'<div class="strip rate" role="slider" tabindex="0" aria-label="{e(t["a11y_strip_rate"])}" aria-valuemin="0" aria-valuemax="10" aria-valuenow="0">'
            f'<span class="end mono">0</span><div class="track"><div class="ticks">{ticks}</div><div class="knob mono">0</div></div>'
            f'<span class="end mono">10</span><svg class="wave" aria-hidden="true"></svg></div>')


def demo_attrs(t, kind, data):
    j = json.dumps(data, separators=(',', ':'))
    return f'data-demo="{kind}" data-crowd=\'{j}\''


def card_hero(t):
    return (f'<article class="qcard hero-card" {demo_attrs(t, "yesno", {"c": [69, 113]})}>'
            f'<div class="panel">{head(t, t["nick"], 3, "21597")}'
            f'<figure class="photo"><img src="{P[0]}assets/img/ayakkabi_a.webp" alt="{e(t["a11y_photo"])}" width="720" height="720" fetchpriority="high"></figure>'
            f'<h3 class="qtext">{e(t["q_hero"])}</h3>{social(t, 8, 3, 182)}</div>'
            f'<div class="hint" aria-hidden="true"><span>{e(t["demo_hint"])}</span></div>'
            f'{strip_yesno(t)}<span class="ghost" aria-hidden="true"></span>'
            f'<button type="button" class="again" hidden>{ic("again")}<span>{e(t["demo_again"])}</span></button></article>')


def card_yesno(t):
    return (f'<article class="qcard" {demo_attrs(t, "yesno", {"c": [28, 68]})}>'
            f'<div class="panel">{head(t, "@gecekusu", 0, "2710")}'
            f'<div class="textbox"><h3 class="qtext">{e(t["q_yesno"])}</h3></div>{social(t, 4, 1, 96)}</div>'
            f'{strip_yesno(t)}<button type="button" class="again" hidden>{ic("again")}<span>{e(t["demo_again"])}</span></button></article>')


def card_choice(t):
    return (f'<article class="qcard" {demo_attrs(t, "choice", {"c": [81, 46]})}>'
            f'<div class="panel">{head(t, "@masakurdu", 6, "9873")}'
            f'<div class="tiles"><figure><img src="{P[0]}assets/img/kutuphane.webp" alt="{e(t["opt_a"])}" width="720" height="720" loading="lazy"><b>A</b></figure>'
            f'<figure><img src="{P[0]}assets/img/calisma.webp" alt="{e(t["opt_b"])}" width="720" height="720" loading="lazy"><b>B</b></figure></div>'
            f'<h3 class="qtext">{e(t["q_choice"])}</h3>{social(t, 12, 2, 127)}</div>'
            f'{strip_choice(t, [t["opt_a"], t["opt_b"]])}<button type="button" class="again" hidden>{ic("again")}<span>{e(t["demo_again"])}</span></button></article>')


def card_rate(t):
    return (f'<article class="qcard" {demo_attrs(t, "rate", {"c": [0, 0, 1, 2, 3, 6, 11, 19, 25, 15, 8]})}>'
            f'<div class="panel">{head(t, "@kosedeki", 5, "15820")}'
            f'<figure class="photo"><img src="{P[0]}assets/img/calisma.webp" alt="{e(t["a11y_photo"])}" width="720" height="720" loading="lazy"></figure>'
            f'<h3 class="qtext">{e(t["q_rate"])}</h3>{social(t, 6, 0, 90)}</div>'
            f'{strip_rate(t)}<button type="button" class="again" hidden>{ic("again")}<span>{e(t["demo_again"])}</span></button></article>')


def tabbar(t, active='agenda'):
    items = ''.join(f'<span class="tb{" on" if k == active else ""}">{ic(k)}<i>{e(t["tabs"][k])}</i></span>'
                    for k in ('agenda', 'square', 'decisions', 'me'))
    return (f'<div class="tabbar" aria-hidden="true"><div class="tabs">{items}</div>'
            f'<span class="askbtn">{mark("mark")}</span></div>')


# --------------------------------------------------------------------------- sayfa iskeleti
def prefix(rel):
    return '../' * rel.count('/')


def lang_switch(l, page):
    """page: 'home' | 'support'"""
    out = []
    for x in LANGS:
        href = BASE + (PATH[x] if page == 'home' else T[x]['support_slug'])
        cur = ' aria-current="page"' if x == l else ''
        out.append(f'<a href="{href}" hreflang="{x}" lang="{x}"{cur}>{T[x]["code"]}</a>')
    return f'<nav class="langs" aria-label="{e(T[l]["aria_lang"])}">{"".join(out)}</nav>'


def alternates(page):
    rows = []
    for x in LANGS:
        href = BASE + (PATH[x] if page == 'home' else T[x]['support_slug'])
        rows.append(f'<link rel="alternate" hreflang="{x}" href="{href}">')
    xd = BASE + (PATH['en'] if page == 'home' else T['en']['support_slug'])
    rows.append(f'<link rel="alternate" hreflang="x-default" href="{xd}">')
    return '\n'.join(rows)


PLAY_ICON = ('<svg class="gp" viewBox="0 0 24 26" aria-hidden="true"><path fill="#00D7FE" d="M1.1.6C.8.9.6 1.4.6 2v22c0 .6.2 1.1.5 1.4l.1.1L13.5 13.2v-.3L1.2.5z"/>'
             '<path fill="#FFCE00" d="M17.6 17.3l-4.1-4.1v-.3l4.1-4.1.1.1 4.9 2.8c1.4.8 1.4 2.1 0 2.9l-4.9 2.8z"/>'
             '<path fill="#FF3A44" d="M17.7 17.2L13.5 13 1.1 25.4c.5.5 1.2.5 2.1.1l14.5-8.3"/>'
             '<path fill="#00F076" d="M17.7 8.8L3.2.5C2.3 0 1.6.1 1.1.6L13.5 13z"/></svg>')


def store_button(t, cls=''):
    """App Store ve Google Play. Adres yoksa "Çok yakında" rozeti (bağlantısız)."""
    out = []
    for name, href, icon, small, key in (('App Store', APP_STORE, APPLE, 'Download on the', 'appstore'),
                                          ('Google Play', PLAY, PLAY_ICON, 'Get it on', 'googleplay')):
        if href:
            out.append(f'<a class="store {cls}" href="{href}" target="_blank" rel="noopener" data-goatcounter-click="sence/{t["lang"]}/{key}">'
                       f'{icon}<span><small>{small}</small>{name}</span></a>')
        else:
            out.append(f'<span class="store soon {cls}" role="note">{icon}<span><small>{e(t["store_soon_small"])}</small>{name}</span></span>')
    return ''.join(out)


def page(l, rel, title, desc, body, ld, page_kind, og_title=None, og_desc=None):
    t = T[l]
    p = prefix(rel)
    url = BASE + rel
    smart = f'\n<meta name="apple-itunes-app" content="app-id={APP_ID}">' if APP_ID else ''
    return f'''<!doctype html>
<!-- Üretilen dosya: _src/build.py ile oluşturulur, elle düzenleme. -->
<html lang="{l}" dir="{t["dir"]}" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
{alternates(page_kind)}
<meta name="theme-color" content="#F4F5F8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0F13" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/png" sizes="64x64" href="{p}assets/img/favicon.png">
<link rel="apple-touch-icon" href="{p}assets/img/apple-touch-icon.png">{smart}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Sence">
<meta property="og:locale" content="{t["locale"]}">
<meta property="og:title" content="{e(og_title or title)}">
<meta property="og:description" content="{e(og_desc or desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}assets/img/og-{l}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(og_title or title)}">
<meta name="twitter:description" content="{e(og_desc or desc)}">
<meta name="twitter:image" content="{BASE}assets/img/og-{l}.jpg">
<link rel="preload" href="{p}assets/fonts/geist-extrabold.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="{p}assets/fonts/geist-medium.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="{p}assets/style.css?v={VER}">
<script>try{{var s=localStorage.getItem("sence-tema");if(s==="dark"||s==="light")document.documentElement.dataset.theme=s}}catch(_){{}}document.documentElement.classList.add("js")</script>
<script data-goatcounter="https://anbertech.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
<body data-avg="{e(t["avg"])}" data-you="{e(t["you"])}">
<a class="skip" href="#main">{e(t["skip"])}</a>
<div class="amb" aria-hidden="true"><i></i><i></i><i></i></div>
<header class="top"><div class="wrap bar">
{logo(t, p + PATH[l])}
<nav class="nav"><a href="{p}{PATH[l]}#nasil">{e(t["nav_how"])}</a><a href="{p}{PATH[l]}#sss">{e(t["nav_faq"])}</a><a href="{p}{t["support_slug"]}">{e(t["nav_support"])}</a></nav>
<div class="tools">{lang_switch(l, page_kind)}<button type="button" class="themebtn" aria-label="{e(t["aria_theme"])}">{ic("sun", "ic sun")}{ic("moon", "ic moon")}</button></div>
</div></header>
<main id="main">
{body}
</main>
<footer class="foot"><div class="wrap">
<div class="f1">{logo(t, p + PATH[l], "brand small")}</div>
<p class="f3">{e(t["rights"])}</p>
</div></footer>
<script src="{p}assets/sence-zipla.js?v={VER}"></script>
<script src="{p}assets/app.js?v={VER}"></script>
</body>
</html>
'''


def org_ld():
    return {"@type": "Organization", "@id": HOME + "#org", "name": "AnberTech", "url": HOME, "email": EMAIL}


def home(l):
    t = T[l]
    rel = PATH[l]
    P[0] = prefix(rel)
    checks = ''.join(f'<li>{ic("check")}{e(c)}</li>' for c in t['checks'])
    how = ''.join(
        f'<li class="step rv"><span class="num mono">0{i + 1}</span><h3>{e(s["t"])}</h3><p>{e(s["p"])}</p>{step_visual(t, i)}</li>'
        for i, s in enumerate(t['how']))
    inside = ''.join(f'<li class="tile rv"><span class="ti">{ic(x["i"])}</span><h3>{e(x["t"])}</h3><p>{e(x["p"])}</p></li>' for x in t['inside'])
    trust = ''.join(f'<li class="tile rv"><span class="ti">{ic(x["i"])}</span><h3>{e(x["t"])}</h3><p>{e(x["p"])}</p></li>' for x in t['trust'])
    faq = ''.join(f'<details class="qa rv"><summary>{e(x["q"])}<span>{ic("plus")}</span></summary><p>{e(x["a"])}</p></details>' for x in t['faq'])
    body = f'''<section class="hero"><div class="wrap grid">
<div class="copy">
<span class="pill">{e(t["pill"])}</span>
<h1>{e(t["h1_a"])}<br><em>{e(t["h1_b"])}</em></h1>
<p class="lead">{e(t["lead"])}</p>
<div class="ctas">{store_button(t)}<a class="ghostbtn" href="#nasil">{e(t["see_how"])}{ic("down")}</a></div>
<ul class="checks">{checks}</ul>
</div>
<div class="device">
<div class="phone"><div class="screen">
<div class="amb in" aria-hidden="true"><i></i><i></i><i></i></div>
{card_hero(t)}
{tabbar(t)}
</div></div>
<p class="note">{e(t["demo_note"])}</p>
</div>
</div></section>

<section class="sec" id="sekiller"><div class="wrap">
<div class="sh rv"><h2>{e(t["shapes_h2"])}</h2><p>{e(t["shapes_p"])}</p></div>
<div class="shapes">
<div class="shape rv"><div class="st"><span class="sic yn">{shape_icon("yesno")}</span><div><h3>{e(t["shape_yesno"])}</h3><p>{e(t["shape_yesno_p"])}</p></div></div>{card_yesno(t)}</div>
<div class="shape rv"><div class="st"><span class="sic">{shape_icon("choice")}</span><div><h3>{e(t["shape_choice"])}</h3><p>{e(t["shape_choice_p"])}</p></div></div>{card_choice(t)}</div>
<div class="shape rv"><div class="st"><span class="sic">{shape_icon("rate")}</span><div><h3>{e(t["shape_rate"])}</h3><p>{e(t["shape_rate_p"])}</p></div></div>{card_rate(t)}</div>
</div>
<p class="note c">{e(t["demo_note"])}</p>
</div></section>

<section class="sec" id="nasil"><div class="wrap">
<div class="sh rv"><h2>{e(t["how_h2"])}</h2><p>{e(t["how_p"])}</p></div>
<ol class="steps">{how}</ol>
</div></section>

<section class="sec" id="icinde"><div class="wrap">
<div class="sh rv"><h2>{e(t["inside_h2"])}</h2><p>{e(t["inside_p"])}</p></div>
<div class="barshow rv">{tabbar(t)}</div>
<ul class="tiles4">{inside}</ul>
</div></section>

<section class="sec" id="guven"><div class="wrap">
<div class="sh rv"><h2>{e(t["trust_h2"])}</h2><p>{e(t["trust_p"])}</p></div>
<ul class="tiles3">{trust}</ul>
</div></section>

<section class="sec" id="sss"><div class="wrap narrow">
<div class="sh rv"><h2>{e(t["faq_h2"])}</h2></div>
<div class="faq">{faq}</div>
</div></section>

<section class="sec"><div class="wrap">
<div class="cta rv"><div class="zipla" data-zipla></div><h2>{e(t["cta_h2"])}</h2><p>{e(t["cta_p"])}</p><div class="stores">{store_button(t, "big")}</div></div>
</div></section>'''
    ld = {"@context": "https://schema.org", "@graph": [
        org_ld(),
        {"@type": "WebSite", "@id": BASE + "#website", "name": "Sence", "url": BASE, "inLanguage": l, "publisher": {"@id": HOME + "#org"}},
        {"@type": "MobileApplication", "@id": BASE + "#app", "name": "Sence", "alternateName": T['tr']['og_title'] if l == 'tr' else t['og_title'],
         "url": BASE + rel, "description": t['meta_desc'], "operatingSystem": "iOS 17.6+, Android", "applicationCategory": "SocialNetworkingApplication",
         "inLanguage": list(LANGS), "image": BASE + "assets/img/icon-512.png", "publisher": {"@id": HOME + "#org"},
         **({"downloadUrl": [x for x in (APP_STORE, PLAY) if x]} if (APP_STORE or PLAY) else {})},
        {"@type": "FAQPage", "inLanguage": l, "mainEntity": [
            {"@type": "Question", "name": x['q'], "acceptedAnswer": {"@type": "Answer", "text": x['a']}} for x in t['faq']]},
    ]}
    write(rel + 'index.html', page(l, rel, t['title'], t['meta_desc'], body, ld, 'home', t['og_title'], t['og_desc']))


def shape_icon(k):
    if k == 'yesno':
        return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.6 4.6L3.4 8.8l4.2 4.2M3.6 8.8h12.6M16.4 11l4.2 4.2-4.2 4.2M20.4 15.2H7.8"/></svg>'
    if k == 'choice':
        return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.6" y="3.6" width="7.2" height="7.2" rx="2"/><rect x="13.2" y="3.6" width="7.2" height="7.2" rx="2"/><rect x="3.6" y="13.2" width="7.2" height="7.2" rx="2"/><rect x="13.2" y="13.2" width="7.2" height="7.2" rx="2"/></svg>'
    return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20.4v-5.6M9.7 20.4V10.6M14.3 20.4V4.4M19 20.4v-8"/></svg>'


def step_visual(t, i):
    if i == 0:
        chips = ''.join(f'<span class="chip{" on" if k == 1 else ""} mono">{e(c)}</span>' for k, c in enumerate(t['dur_chips']))
        return f'<div class="sv chips" aria-hidden="true">{chips}</div>'
    if i == 1:
        return (f'<div class="sv mini" aria-hidden="true"><span class="mno">{e(t["no"])} <b class="mono">{pct(t, 38)}</b></span>'
                f'<span class="myes">{e(t["yes"])} <b class="mono">{pct(t, 62)}</b></span></div>')
    return (f'<div class="sv closing" aria-hidden="true"><span class="cap">{e(t["closing_ask"])}</span>'
            f'<span class="picked">{ic("check")}{e(t["closing_picked"])}</span></div>')


def pct(t, n):
    return f'%{n}' if t['lang'] == 'tr' else f'{n}%'


def support(l):
    t = T[l]
    rel = t['support_slug']
    from urllib.parse import quote
    mail = f'mailto:{EMAIL}?subject={quote(t["support_mail_subject"])}'
    faq = ''.join(f'<details class="qa"><summary>{e(x["q"])}<span>{ic("plus")}</span></summary><p>{e(x["a"])}</p></details>' for x in t['support_faq'])
    body = f'''<section class="page"><div class="wrap narrow">
<h1>{e(t["support_h1"])}</h1>
<p class="lead">{e(t["support_lead"])}</p>
<div class="mailcard"><span class="ti">{ic("mail")}</span><div><b>{EMAIL}</b></div><a class="btn" href="{mail}" data-goatcounter-click="sence/{l}/destek-mail">{e(t["support_mail_btn"])}</a></div>
<h2>{e(t["support_h2"])}</h2>
<div class="faq">{faq}</div>
<p class="legal">{e(t["support_legal"])}</p>
<p><a class="back" href="{prefix(rel)}{PATH[l]}">← {e(t["back_home"])}</a></p>
</div></section>'''
    ld = {"@context": "https://schema.org", "@graph": [org_ld(), {"@type": "FAQPage", "inLanguage": l, "mainEntity": [
        {"@type": "Question", "name": x['q'], "acceptedAnswer": {"@type": "Answer", "text": x['a']}} for x in t['support_faq']]}]}
    write(rel + 'index.html', page(l, rel, t['support_title'], t['support_desc'], body, ld, 'support'))


def sitemap():
    rows = []
    for kind in ('home', 'support'):
        alts = ''.join(f'\n    <xhtml:link rel="alternate" hreflang="{x}" href="{BASE + (PATH[x] if kind == "home" else T[x]["support_slug"])}" />' for x in LANGS)
        alts += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{BASE + (PATH["en"] if kind == "home" else T["en"]["support_slug"])}" />'
        for l in LANGS:
            loc = BASE + (PATH[l] if kind == 'home' else T[l]['support_slug'])
            pr = '1.0' if kind == 'home' else '0.5'
            rows.append(f'  <url><loc>{loc}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority>{alts}\n  </url>')
    write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
          'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + '\n'.join(rows) + '\n</urlset>\n')


def llms():
    en, tr = T['en'], T['tr']
    faq = '\n'.join(f'- {x["q"]} {x["a"]}' for x in en['faq'])
    txt = f'''# Sence

> Sence ("what do you think?" in Turkish) is a mobile app by AnberTech for decisions you can't make alone: you ask a question under a nickname and the community votes. Store name: "Sence: Can't Decide? We Can." (Turkish: "{tr["og_title"]}"). Status: coming soon to the App Store for iPhone and iPad (iOS 17.6+) and to Google Play for Android. Languages: Turkish and English. Free. Adults only (18+).

## What it does

- Three question types: Yes/No (slide left for no, right for yes), Pick (2–4 options, each a photo or short text) and Rate (0–10, the result shows the crowd's score distribution and average).
- A question has up to 99 characters, an optional photo, a category and a time limit (10 minutes, 1, 6, 12 or 24 hours, or no limit). When time is up the result locks and the asker is notified.
- Tabs: Trending (everyone's questions, personalised), Square (people you follow and their Resences), Decisions (questions you voted on), Me (profile), Ask.
- Social: follow, private accounts, Resence (re-ask someone's question to your followers), public comments the asker can turn off, notifications, Story sharing.
- Privacy and safety: nickname only, no passwords (optional Apple/Google account linking), voters are never shown (only counts), photos are checked before going live and location data is stripped on the device, report and block, in-app account deletion.

## Pages

- [Sence (English)]({BASE}en/)
- [Sence (Türkçe)]({BASE})
- [Support]({BASE}{en["support_slug"]}) · [Destek]({BASE}{tr["support_slug"]})

## FAQ

{faq}

## Contact

- {EMAIL}
- Developer: AnberTech ({HOME})
'''
    write('llms.txt', txt)


if __name__ == '__main__':
    check_i18n()
    for l in LANGS:
        home(l)
        support(l)
    sitemap()
    llms()
    print('tamam:', ', '.join(PATH[l] or '/' for l in LANGS), '+ destek, sitemap.xml, llms.txt')
