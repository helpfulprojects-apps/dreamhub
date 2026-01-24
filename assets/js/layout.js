(function () {
  const cfg = window.DREAMHUB_CONFIG || { BASE_PATH: "" };
  const BASE = (cfg.BASE_PATH || "").replace(/\/$/, "");

  function abs(p) {
    if (!p) return BASE + "/";
    if (p.startsWith("http")) return p;
    if (p.startsWith("/")) return p;
    return BASE + "/" + p.replace(/^\//, "");
  }

  async function loadInto(id, file) {
    const el = document.getElementById(id);
    if (!el) return;
    const res = await fetch(abs(file), { cache: "no-store" });
    el.innerHTML = await res.text();

    el.querySelectorAll("[data-href]").forEach(a => a.setAttribute("href", abs(a.getAttribute("data-href"))));
    el.querySelectorAll("[data-src]").forEach(img => img.setAttribute("src", abs(img.getAttribute("data-src"))));
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
      loadInto("dh-header", "partials/header.html"),
      loadInto("dh-footer", "partials/footer.html")
    ]);
  });

  window.DH_ABS = abs;
})();
