(function () {
  function esc(s) {
    return s.replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  }
  function inline(md) {
    let s = esc(md);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {
      const safe = (u.startsWith("http") || u.startsWith("/") || u.startsWith("./") || u.startsWith("../")) ? u : "#";
      return `<a href="${safe}" target="${safe.startsWith("http") ? "_blank" : "_self"}" rel="noopener">${t}</a>`;
    });
    return s;
  }
  function render(mdText) {
    const lines = mdText.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let inList = false;
    function closeList(){ if(inList){ html += "</ul>"; inList=false; } }
    for (const raw of lines){
      const line = raw.trimRight();
      if(!line.trim()){ closeList(); continue; }
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      if(h){ closeList(); const level=h[1].length; html += `<h${level}>${inline(h[2].trim())}</h${level}>`; continue; }
      const li = line.match(/^[-*]\s+(.*)$/);
      if(li){ if(!inList){ html += "<ul>"; inList=true; } html += `<li>${inline(li[1].trim())}</li>`; continue; }
      closeList();
      html += `<p>${inline(line.trim())}</p>`;
    }
    closeList();
    return html;
  }
  window.DH_MD = { render };
})();
