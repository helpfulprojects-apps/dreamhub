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

  function escAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  
  function safeUrl(u) {
    u = String(u || "").trim();
    // allow http(s), absolute, and relative paths
    if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/") || u.startsWith("./") || u.startsWith("../")) return u;
    return "#";
  }
  
  function inline(md) {
    let s = esc(md);
  
    // bold + italic
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  
    // ✅ Images: ![alt](url){sm|md|lg}  (size part is optional)
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)(\{(sm|md|lg)\})?/g, (m, alt, url, _all, size) => {
      const src = safeUrl(url);
      const cls = size ? `dh-img dh-img-${size}` : "dh-img";
      return `<img src="${escAttr(src)}" alt="${escAttr(alt)}" class="${cls}" loading="lazy" />`;
    });
  
    // Links: [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {
      const safe = safeUrl(u);
      return `<a href="${escAttr(safe)}" target="${safe.startsWith("http") ? "_blank" : "_self"}" rel="noopener">${t}</a>`;
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
