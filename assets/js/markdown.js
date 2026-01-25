(function () {
  function esc(s) {
    return s.replace(/[&<>"]/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[c]));
  }

  function isSafeUrl(u) {
    const s = (u || "").trim();
    const lower = s.toLowerCase();

    // Block dangerous schemes
    if (lower.startsWith("javascript:") || lower.startsWith("data:")) return false;

    // Allow:
    // - https://...
    // - /dreamhub/...
    // - ./images/...
    // - images/...
    // - ../...
    return s.length > 0;
  }

  function inline(md) {
    // Escape HTML first (keeps things safe)
    let s = esc(md);

    // ✅ Images: ![alt](url)
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, url) => {
      const u = url.trim();
      if (!isSafeUrl(u)) return "";
      return `<img class="md-img" src="${u}" alt="${esc(alt)}" loading="lazy" />`;
    });

    // Bold / Italic
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Links: [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {
      const url = (u || "").trim();
      const safe = isSafeUrl(url) ? url : "#";
      const isHttp = safe.startsWith("http://") || safe.startsWith("https://");
      return `<a href="${safe}" target="${isHttp ? "_blank" : "_self"}" rel="noopener">${t}</a>`;
    });

    return s;
  }

  function render(mdText) {
    const lines = mdText.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let inList = false;

    function closeList() {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
    }

    for (const raw of lines) {
      const line = raw.trimRight();
      if (!line.trim()) {
        closeList();
        continue;
      }

      // Headings: #, ##, ###
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      if (h) {
        closeList();
        const level = h[1].length;
        html += `<h${level}>${inline(h[2].trim())}</h${level}>`;
        continue;
      }

      // Lists: - item
      const li = line.match(/^[-*]\s+(.*)$/);
      if (li) {
        if (!inList) {
          html += "<ul>";
          inList = true;
        }
        html += `<li>${inline(li[1].trim())}</li>`;
        continue;
      }

      closeList();
      html += `<p>${inline(line.trim())}</p>`;
    }

    closeList();
    return html;
  }

  window.DH_MD = { render };
})();
