(function () {
  // --- helpers ---
  function base() {
    // Prefer explicit config; else derive from current folder
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
    return String(s ?? "").replace(/\n/g, "<br/>");
  }

  // JSONP call to Apps Script (avoids CORS on GitHub Pages)
  function api(action, payload) {
    return new Promise((resolve, reject) => {
      const url = window.DH && window.DH.inviteApi; // MUST be a string URL from config.js

      if (typeof url !== "string" || !url.startsWith("https://")) {
        reject(new Error("Missing/invalid window.DH.inviteApi (check apps/invite/config.js)"));
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
      let cleaned = false;

      function cleanup() {
        if (cleaned) return;
        cleaned = true;
        try { delete window[cb]; } catch (e) {}
        try { script.remove(); } catch (e) {}
      }

      const t = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout calling Apps Script"));
      }, 15000);

      window[cb] = (data) => {
        clearTimeout(t);
        cleanup();
        resolve(data);
      };

      script.onerror = () => {
        clearTimeout(t);
        cleanup();
        reject(new Error("Network/API error calling Apps Script"));
      };

      script.src = u.toString();
      script.async = true;
      document.head.appendChild(script);
    });
  }

  // IMPORTANT:
  // - Do NOT overwrite window.DH.inviteApi (string)
  // - Put functions under window.DH.invite
  window.DH = window.DH || {};
  window.DH.invite = { api, base, q, esc, nl2br };
})();
