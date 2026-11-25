// Türkçe dışındaki tarayıcılarda İngilizce.
if (!(navigator.language || "en").toLowerCase().startsWith("tr")) {
  document.documentElement.lang = "en";
  for (const el of document.querySelectorAll("[data-en]")) el.textContent = el.dataset.en;
}
