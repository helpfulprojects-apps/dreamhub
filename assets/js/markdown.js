(function(){
  function escapeHtml(s){return s.replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));}
  function inline(md){
    var s = escapeHtml(md);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }
  function renderMarkdown(md){
    var lines = md.replace(/\r\n/g,'\n').split('\n');
    var html = '';
    var inList = false;
    for (var i=0;i<lines.length;i++){
      var line = lines[i];
      if (/^#{1,3}\s+/.test(line)){
        if(inList){ html += '</ul>'; inList=false; }
        var level = line.match(/^#+/)[0].length;
        html += '<h'+level+'>' + inline(line.replace(/^#{1,3}\s+/,'')) + '</h'+level+'>';
      } else if (/^\s*-\s+/.test(line)){
        if(!inList){ html += '<ul>'; inList=true; }
        html += '<li>' + inline(line.replace(/^\s*-\s+/,'')) + '</li>';
      } else if (line.trim()===''){
        if(inList){ html += '</ul>'; inList=false; }
      } else {
        if(inList){ html += '</ul>'; inList=false; }
        html += '<p>' + inline(line.trim()) + '</p>';
      }
    }
    if(inList){ html += '</ul>'; }
    return html;
  }
  function parseFrontMatter(raw){
    var m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if(!m){ return {meta:{}, body:raw}; }
    var yaml = m[1], body = m[2];
    var meta = {};
    yaml.split('\n').forEach(function(line){
      var t = line.trim();
      if(!t || t.startsWith('#')) return;
      var idx = t.indexOf(':');
      if(idx<0) return;
      var key = t.slice(0,idx).trim();
      var val = t.slice(idx+1).trim();
      if(val.startsWith('[')){
        try{ meta[key]=JSON.parse(val.replace(/'/g,'"')); }catch(e){ meta[key]=val; }
      } else {
        meta[key]=val.replace(/^"(.*)"$/,'$1');
      }
    });
    return {meta:meta, body:body};
  }
  window.DH = window.DH || {};
  window.DH.md = { renderMarkdown: renderMarkdown, parseFrontMatter: parseFrontMatter };
})();