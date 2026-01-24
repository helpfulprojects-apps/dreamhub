(function () {
  async function loadJSON(url) {
    const res = await fetch(window.DH_ABS(url), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + url);
    return await res.json();
  }

  function card(item, href) {
    const tag = item.tag ? `<span class="pill">${item.tag}</span>` : "";
    const icon = item.icon ? `<span class="icon">${item.icon}</span>` : "";
    const meta = item.meta ? `<div class="muted small">${item.meta}</div>` : "";
    return `
      <a class="card link-card" href="${href}">
        <div class="card-head">
          ${icon}
          <div class="card-title">
            ${tag}
            <h3>${item.title || ""}</h3>
          </div>
        </div>
        <p>${item.summary || ""}</p>
        ${meta}
      </a>
    `;
  }

  async function renderList(opts) {
    const { containerId, jsonPath, itemLinkBuilder } = opts;
    const el = document.getElementById(containerId);
    if (!el) return;

    const data = await loadJSON(jsonPath);
    const items = (data.items || []);
    if (!items.length) {
      el.innerHTML = `<div class="notice">No items yet. Add new markdown + PDF to start.</div>`;
      return;
    }
    el.innerHTML = `<div class="card-grid">${items.map(it => card(it, itemLinkBuilder(it))).join("")}</div>`;
  }

  async function renderMarkdownViewer(opts) {
    const { mdPath, pdfPath, titleId, bodyId, pdfId, pdfDownloadId } = opts;
    const titleEl = document.getElementById(titleId);
    const bodyEl = document.getElementById(bodyId);
    const pdfEl = document.getElementById(pdfId);
    const pdfDl = document.getElementById(pdfDownloadId);

    const res = await fetch(window.DH_ABS(mdPath), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load markdown: " + mdPath);
    const md = await res.text();

    let title = "Details";
    const m = md.match(/^#\s+(.+)$/m);
    if (m) title = m[1].trim();

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = window.DH_MD.render(md);

    if (pdfEl && pdfPath) pdfEl.setAttribute("src", window.DH_ABS(pdfPath));
    if (pdfDl && pdfPath) pdfDl.setAttribute("href", window.DH_ABS(pdfPath));
  }

  window.DH_CONTENT = { renderList, renderMarkdownViewer, loadJSON };
})();
