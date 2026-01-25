(function () {
    function base() {
      // Prefer explicit config; else derive from current folder
      // If you want: set window.DH.inviteBase = "/dreamhub/apps/invite" in config.js
      if (window.DH && window.DH.inviteBase) return window.DH.inviteBase;
      return location.origin + location.pathname.replace(/\/(index\.html)?$/, "");
    }
  
    function q(name) {
      return new URL(location.href).searchParams.get(name);
    }
  
    function esc(s) {
      return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }
  
    function nl2br(s) {
      return String(s).replace(/\n/g, "<br/>");
    }
  
// JSONP call to Apps Script (no CORS issues on GitHub Pages)
function api(action, payload) {
    return new Promise((resolve, reject) => {
      const url = window.DH?.inviteApi;
      if (!url || !url.startsWith("https://")) {
        reject(new Error("Missing window.DH.inviteApi in apps/invite/config.js"));
        return;
      }
  
      const cb = "DH_INVITE_CB_" + Math.random().toString(36).slice(2);
      const u = new URL(url);
  
      // payload -> base64url
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload || {}))))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
  
      u.searchParams.set("action", action);
      u.searchParams.set("payload", b64);
      u.searchParams.set("callback", cb);
  
      const script = document.createElement("script");
  
      const cleanup = () => {
        try { delete window[cb]; } catch {}
        try { script.remove(); } catch {}
      };
  
      window[cb] = (data) => {
        cleanup();
        resolve(data);
      };
  
      script.onerror = () => {
        cleanup();
        reject(new Error("Network/API error calling Apps Script"));
      };
  
      // optional timeout (helps when script is blocked / wrong URL)
      const t = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout calling Apps Script"));
      }, 15000);
  
      const oldCb = window[cb];
      window[cb] = (data) => { clearTimeout(t); oldCb(data); };
  
      script.src = u.toString();
      script.async = true;
      document.head.appendChild(script);
    });
  }
  
  
    window.DH.inviteApi = { api, base, q, esc, nl2br };
  })();
  