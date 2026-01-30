(function () {
  window.DH = window.DH || {};

  function base() {
    if (window.DH.inviteBase) return window.DH.inviteBase;
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

  // JSONP call to Apps Script (safe for GitHub Pages)
  function api(action, payload) {
    return new Promise((resolve, reject) => {
      const url = window.DH.inviteApi;

      if (typeof url !== "string" || !/^https:\/\/script\.google\.com\/macros\/s\//.test(url)) {
        reject(new Error("Missing/invalid window.DH.inviteApi (check apps/invite/config.js)"));
        return;
      }

      const cb = "DH_INVITE_CB_" + Math.random().toString(36).slice(2);
      const script = document.createElement("script");

      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload || {}))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      window[cb] = (data) => {
        cleanup();
        resolve(data);
      };

      function cleanup() {
        try { delete window[cb]; } catch {}
        try { script.remove(); } catch {}
      }

      script.onerror = () => {
        cleanup();
        reject(new Error("Network/API error calling Apps Script"));
      };

      script.src =
        url +
        "?action=" + encodeURIComponent(action) +
        "&payload=" + encodeURIComponent(b64) +
        "&callback=" + encodeURIComponent(cb);

      document.head.appendChild(script);
    });
  }

  // ✅ IMPORTANT: expose helpers under DH.invite (NOT inviteApi)
  window.DH.invite = {
    api,
    base,
    q,
    esc,
    nl2br
  };
})();
