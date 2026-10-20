/* Progressiv forbedring for mobilmenyen (<details class="menu">):
   lukk med Escape (fokus tilbake til knappen) og ved trykk utenfor menyen.
   Uten JavaScript virker menyen som før. Ingen sporing, ingen lagring. */
(function () {
  "use strict";
  var menu = document.querySelector("details.menu");
  if (!menu) return;
  var summary = menu.querySelector("summary");
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.key === "Esc") && menu.open) {
      menu.open = false;
      if (summary) summary.focus();
    }
  });
  document.addEventListener("click", function (e) {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });
})();
