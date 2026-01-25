(function () {
    function base() {
      // Use config base if present; else derive from location
      return window.DH_INVITE_BASE || (location.origin + location.pathname.replace(/\/(index\.html)?$/, ""));
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
  
    // JSONP call to Apps Script to avoid CORS issues on GitHub Pages
    function api(action, payload) {
      return new Promise((resolve, reject) => {
        const url = window.DH_INVITE_API;
        if (!url || !url.startsWith("https://")) {
          reject(new Error("Missing DH_INVITE_API in apps/invite/config.js"));
          return;
        }
  
        const cb = "DH_INVITE_CB_" + Math.random().toString(36).slice(2);
        const script = document.createElement("script");
  
        window[cb] = (data) => {
          try {
            resolve(data);
          } finally {
            delete window[cb];
            script.remove();
          }
        };
  
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload || {}))))
          .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  
        const sep = url.includes("?") ? "&" : "?";
        script.src = `${url}${sep}action=${encodeURIComponent(action)}&payload=${encodeURIComponent(b64)}&callback=${encodeURIComponent(cb)}`;
        script.onerror = () => {
          delete window[cb];
          script.remove();
          reject(new Error("Network/API error calling Apps Script"));
        };
  
        document.head.appendChild(script);
      });
    }
  
    window.DH_INVITE = { api, base, q, esc, nl2br };
  })();
  