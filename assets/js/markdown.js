(function () {
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[c]));
  }

  function escAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Allow http(s), absolute, and RELATIVE paths like "images/Dosa.jpg"
  function safeUrl(u) {
    u = String(u || "").trim();
    const lower = u.toLowerCase();

    // block dangerous schemes
    if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) return "";

    // allow full http(s) and absolute/relative prefixes
    if (
      u.startsWith("http://") || u.startsWith("https://") ||
      u.startsWith("/") || u.startsWith("./") || u.startsWith("../")
    ) return u;

    // ✅ allow plain relative paths: images/..., docs/..., foo/bar.png
    // block protocol-like "abc:..." and "//..."
    if (!u.includes(":") && !u.startsWith("//")) return u;

    return "";
  }

  function inline(md) {
    let s = esc(md);

    // bold + italic
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // ✅ Images with optional size token:
    // ![alt](url)
    // ![alt](url){sm|md|lg}
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)(\{(sm|md|lg)\})?/g, (m, alt, url, _all, size) => {
      const src = safeUrl(url);
      if (!src) return ""; // if unsafe, render nothing
      const cls = size ? `dh-img dh-img-${size}` : "dh-img";
      return `<img src="${escAttr(src)}" alt="${escAttr(alt)}" class="${cls}" loading="lazy" />`;
    });

    // Links: [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {
      const safe = safeUrl(u);
      const href = safe ? safe : "#";
      const isHttp = href.startsWith("http");
      return `<a href="${escAttr(href)}" target="${isHttp ? "_blank" : "_self"}" rel="noopener">${t}</a>`;
    });

    return s;
  }

  function render(mdText) {
    const lines = mdText.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let inList = false;

    function closeList() {
      if (inList) { html += "</ul>"; inList = false; }
    }

    for (const raw of lines) {
      const line = raw.trimRight();

      if (!line.trim()) { closeList(); continue; }

      // headings
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      if (h) {
        closeList();
        const level = h[1].length;
        html += `<h${level}>${inline(h[2].trim())}</h${level}>`;
        continue;
      }

      // list items
      const li = line.match(/^\-\s+(.*)$/);
      if (li) {
        if (!inList) { html += "<ul>"; inList = true; }
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
