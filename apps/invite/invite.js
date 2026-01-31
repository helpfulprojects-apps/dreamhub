(function () {
  function base() {
    // If config provides inviteBase, allow "/dreamhub/apps/invite" but convert to full URL.
    if (window.DH && window.DH.inviteBase) {
      const b = window.DH.inviteBase;
      if (typeof b === "string" && b.startsWith("/")) return location.origin + b;
      return b;
    }
    // Default: current folder (absolute)
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

  // JSONP call to Apps Script (works on GitHub Pages without CORS)
  function api(action, payload) {
    return new Promise((resolve, reject) => {
      const url = window.DH && window.DH.inviteApi;

      if (typeof url !== "string" || !url.startsWith("https://")) {
        reject(new Error("Missing/invalid window.DH.inviteApi (check apps/invite/config.js)"));
        return;
      }

      const cb = "DH_INVITE_CB_" + Math.random().toString(36).slice(2);
      const script = document.createElement("script");

      window[cb] = (resp) => {
        try {
          // Your Apps Script returns: { ok: true, data: {...} }
          if (resp && resp.ok) resolve(resp.data);
          else reject(new Error((resp && resp.error) || "Unknown API error"));
        } finally {
          try { delete window[cb]; } catch {}
          try { script.remove(); } catch {}
        }
      };

      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload || {}))))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");

      const sep = url.includes("?") ? "&" : "?";
      script.src =
        `${url}${sep}` +
        `action=${encodeURIComponent(action)}` +
        `&payload=${encodeURIComponent(b64)}` +
        `&callback=${encodeURIComponent(cb)}`;

      script.onerror = () => {
        try { delete window[cb]; } catch {}
        try { script.remove(); } catch {}
        reject(new Error("Network/API error calling Apps Script"));
      };

      document.head.appendChild(script);
    });
  }

  // ✅ IMPORTANT: expose helpers on window.DH.invite (NOT inviteApi)
  window.DH = window.DH || {};
  window.DH.invite = { api, base, q, esc, nl2br };
})();
