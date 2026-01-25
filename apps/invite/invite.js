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
  
    // JSONP call to Apps Script to avoid CORS issues on GitHub Pages
    function api(action, payload) {
      return new Promise((resolve, reject) => {
        const url = window.DH && window.DH.inviteApi;  // ✅ uses config.js
        if (!url || !url.startsWith("https://")) {
          reject(new Error("Missing window.DH.inviteApi in apps/invite/config.js"));
          return;
        }
  
        const cb = "DH_INVITE_CB_" + Math.random().toString(36).slice(2);
        const script = document.createElement("script");
        script.async = true;
  
        const cleanup = () => {
          try { delete window[cb]; } catch (e) {}
          if (script && script.parentNode) script.parentNode.removeChild(script);
        };
  
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error("Timeout calling Apps Script"));
        }, 15000);
  
        window[cb] = (data) => {
          clearTimeout(timeout);
          cleanup();
          resolve(data);
        };
  
        // ✅ Standard base64 (do NOT convert to base64url; keep + / =)
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload || {}))));
  
        // ✅ Safe URL building (no accidental double '?' etc.)
        const u = new URL(url);
        u.searchParams.set("action", action);
        u.searchParams.set("payload", b64);
        u.searchParams.set("callback", cb);
  
        script.onerror = () => {
          clearTimeout(timeout);
          cleanup();
          reject(new Error("Network/API error calling Apps Script"));
        };
  
        script.src = u.toString();
        document.head.appendChild(script);
      });
    }
  
    window.DH_INVITE = { api, base, q, esc, nl2br };
  })();
  