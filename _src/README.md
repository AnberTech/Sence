# Sence sitesi: kaynak dosyalar

Site depo kökünden `python3 _src/build.py` ile üretilir. Üretilen dosyalar (`index.html`, `en/index.html`, `destek/index.html`, `en/support/index.html`, `sitemap.xml`, `llms.txt`) elle düzenlenmez.

**`s/` klasörü (paylaşılan soru sayfası) bu betikle üretilmez, ona dokunulmaz.** Uygulamadaki Paylaş bağlantısı `s/?id=<soru>` adresine gelir, sayfa `sence://soru/<soru>` açar (iOS `Tema/Paylasim.swift`). `s/` sayfası `assets/sence.css`, `assets/dil.js`, `assets/isaret.svg`, `assets/ikon.png` dosyalarını kullanır; bunlar da silinmez.

| Dosya | Ne işe yarar |
|---|---|
| `build.py` | Sayfaları, `sitemap.xml` ve `llms.txt` dosyasını üretir; dil dosyalarını denetler. İkonlar, ters soru işareti ve "Yüz" avatarları burada çizilir |
| `i18n/<dil>.json` | Bütün metinler. Kaynak `tr.json`; her dil aynı anahtarlara ve liste uzunluklarına sahip olmalı (betik farkta durur) |
| `og.html` | Paylaşım görselleri `assets/img/og-<dil>.jpg` için kaynak (16 dil; metinleri `i18n/<dil>.json`'dan okur) |
| `../assets/style.css` | Bütün stil: "Duru Kristal" (açık cam / koyu Dumanlı Obsidiyen), Buzul holografik vurgu. Renkler iOS `Tema/Renkler.swift` ile aynı |
| `../assets/app.js` | Tema düğmesi, üst bar, dil menüsü, geri sayımlar ve kartlardaki deneme oylaması (Evet/Hayır, Seçtir, Puanlat şeridi + puan dalgası). Oy verilince kart `sence:vote`, "Bir daha"da `sence:reset` olayı yayar |
| `../assets/kalabalik.js` | Yalnız ana sayfada: girişteki "Yüz" kalabalığı (canvas). Gözler imleci izler, göz kırpar; telefondaki kartta oy verilince kalabalık Hayır/Evet diye ikiye ayrılır, ziyaretçinin yüzü de seçtiği tarafa katılır. Paletler `Sence_Local/tasarim/avatar/uret_avatar.py` ile aynı 33 renk |
| `../assets/sence-zipla.js` | Zıpla yükleme işareti. Sence_Local `tasarim/animasyon/uret_zipla.py` üretir; elle değiştirme, oradan kopyala |
| `../assets/fonts/` | Geist + Geist Mono (OFL), Latin + Türkçe alt kümesi, woff. Kiril, Arap, Devanagari ve Doğu Asya yazıları cihazın sistem yazı tipine düşer (`style.css` başındaki `:lang()` satırları) |

## Tasarım (2026-11-26)

- Tek gösterişli an girişte: Yüz kalabalığı ve başlığın sonundaki nokta. Başlığın ikinci satırı `.` ya da `。` ile bitiyorsa o nokta logodaki holografik noktaya dönüşür ve açılışta bir kez Zıpla gibi sıçrar (dokununca bir daha). Başlığın boyu `fit_units()` ile her dilde sütuna sığacak şekilde ayarlanır.
- Diğer bölümler sakin: Nasıl çalışır gerçek bir zaman çizgisi, özellikler düz liste, "Rahatça sor" her temada koyu obsidiyen bant, SSS iki sütun.
- "Çok yakında" rozetleri tıklanır düğme gibi görünmez (cam rozet); `APP_STORE`/`PLAY` dolunca holografik indirme düğmesine döner.
- "Hareketi azalt" açıksa kalabalık durağan, nokta zıplamaz, geçişler yok.

## Yeni dil eklemek

1. `i18n/en.json`'u `i18n/<dil>.json` olarak kopyala, çevir (`support_slug`: `<dil>/support/` gibi, ASCII).
2. `build.py` içinde `LANGS` ve `PATH` listesine ekle; `og.html`'e o dilin metnini koy ve görseli üret.
3. `python3 _src/build.py`

## App Store'a çıkınca

`build.py` içinde `APP_STORE` (App Store adresi) ve `APP_ID` (sayısal kimlik) doldurulup betik çalıştırılır: "Çok yakında" rozetleri indirme bağlantısına döner, Safari'nin akıllı uygulama şeridi gelir. Gerekirse `i18n` içindeki `pill`, `cta_p` ve SSS'deki "çıkacak" cümleleri güncellenir.

Stil ya da betik değişince `build.py` içindeki `VER` bir artırılır (tarayıcı önbelleği).

## Paylaşım görseli

Her dil için (depo kökünden):
```
for l in tr en de fr it nl pl es pt ru ar ja ko zh-Hans hi id; do
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --allow-file-access-from-files \
    --window-size=1200,630 --virtual-time-budget=3000 --screenshot=/tmp/og.png "file://$PWD/_src/og.html?l=$l"
  sips -s format jpeg -s formatOptions 86 /tmp/og.png --out assets/img/og-$l.jpg
done
```
