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
    const { mdPath, pdfPath, titleId, bodyId, pdfId, pdfDownloadId, pdfPanelId } = opts;
  
    const titleEl = document.getElementById(titleId);
    const bodyEl  = document.getElementById(bodyId);
  
    const pdfEl   = document.getElementById(pdfId);
    const pdfDl   = document.getElementById(pdfDownloadId);
    const pdfPanelEl = pdfPanelId ? document.getElementById(pdfPanelId) : null;
  
    // --- Load markdown (same as before) ---
    const res = await fetch(window.DH_ABS(mdPath), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load markdown: " + mdPath);
    const md = await res.text();
  
    let title = "Details";
    const m = md.match(/^#\s+(.+)$/m);
    if (m) title = m[1].trim();
  
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = window.DH_MD.render(md);
  
    // --- NEW: Handle optional PDF (hide panel when missing) ---
    const hidePdfPanel = () => {
      if (pdfPanelEl) pdfPanelEl.style.display = "none";
    };
  
    // 1) If no pdfPath provided => hide immediately
    if (!pdfPath) {
      hidePdfPanel();
      return;
    }
  
    // 2) If pdfPath exists, verify file exists. If not, hide panel.
    try {
      const pdfUrl = window.DH_ABS(pdfPath);
  
      // HEAD is lightweight; if it fails on any host, fall back to GET
      let ok = false;
      try {
        const head = await fetch(pdfUrl, { method: "HEAD", cache: "no-store" });
        ok = head.ok;
      } catch (e) {
        const get = await fetch(pdfUrl, { method: "GET", cache: "no-store" });
        ok = get.ok;
      }
  
      if (!ok) {
        hidePdfPanel();
        return;
      }
  
      if (pdfEl) pdfEl.setAttribute("src", pdfUrl);
      if (pdfDl) pdfDl.setAttribute("href", pdfUrl);
    } catch (e) {
      hidePdfPanel();
    }
  }
  

  window.DH_CONTENT = { renderList, renderMarkdownViewer, loadJSON };
})();
