# Sence sitesi: kaynak dosyalar

Site depo kökünden `python3 _src/build.py` ile üretilir. Üretilen dosyalar (`index.html`, `en/index.html`, `destek/index.html`, `en/support/index.html`, `sitemap.xml`, `llms.txt`) elle düzenlenmez.

**`s/` klasörü (paylaşılan soru sayfası) bu betikle üretilmez, ona dokunulmaz.** Uygulamadaki Paylaş bağlantısı `s/?id=<soru>` adresine gelir, sayfa `sence://soru/<soru>` açar (iOS `Tema/Paylasim.swift`). `s/` sayfası `assets/sence.css`, `assets/dil.js`, `assets/isaret.svg`, `assets/ikon.png` dosyalarını kullanır; bunlar da silinmez.

| Dosya | Ne işe yarar |
|---|---|
| `build.py` | Sayfaları, `sitemap.xml` ve `llms.txt` dosyasını üretir; dil dosyalarını denetler. İkonlar, ters soru işareti ve "Yüz" avatarları burada çizilir |
| `i18n/<dil>.json` | Bütün metinler. Kaynak `tr.json`; her dil aynı anahtarlara ve liste uzunluklarına sahip olmalı (betik farkta durur) |
| `og.html` | Paylaşım görselleri `assets/img/og-tr.jpg`, `og-en.jpg` için kaynak |
| `../assets/style.css` | Bütün stil: "Duru Kristal" (açık cam / koyu Dumanlı Obsidiyen), Buzul holografik vurgu. Renkler iOS `Tema/Renkler.swift` ile aynı |
| `../assets/app.js` | Tema düğmesi, görünme, geri sayımlar ve kartlardaki deneme oylaması (Evet/Hayır, Seçtir, Puanlat şeridi + puan dalgası) |
| `../assets/sence-zipla.js` | Zıpla yükleme işareti. Sence_Local `tasarim/animasyon/uret_zipla.py` üretir; elle değiştirme, oradan kopyala |
| `../assets/fonts/` | Geist + Geist Mono (OFL), Latin + Türkçe alt kümesi, woff |

## Yeni dil eklemek

1. `i18n/en.json`'u `i18n/<dil>.json` olarak kopyala, çevir (`support_slug`: `<dil>/support/` gibi, ASCII).
2. `build.py` içinde `LANGS` ve `PATH` listesine ekle; `og.html`'e o dilin metnini koy ve görseli üret.
3. `python3 _src/build.py`

## App Store'a çıkınca

`build.py` içinde `APP_STORE` (App Store adresi) ve `APP_ID` (sayısal kimlik) doldurulup betik çalıştırılır: "Çok yakında" rozetleri indirme bağlantısına döner, Safari'nin akıllı uygulama şeridi gelir. Gerekirse `i18n` içindeki `pill`, `cta_p` ve SSS'deki "çıkacak" cümleleri güncellenir.

Stil ya da betik değişince `build.py` içindeki `VER` bir artırılır (tarayıcı önbelleği).

## Paylaşım görseli

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --window-size=1200,630 --virtual-time-budget=3000 --screenshot=/tmp/og.png "file://$PWD/_src/og.html?l=tr"
sips -s format jpeg -s formatOptions 86 /tmp/og.png --out assets/img/og-tr.jpg
```
(`?l=en` ile `og-en.jpg`.)
