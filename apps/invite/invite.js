(function () {
  function base() {
    if (window.DH && window.DH.inviteBase) return window.DH.inviteBase;
    return location.origin + location.pathname.replace(/\/(index\.html)?$/, "");
  }
  function q(name) { return new URL(location.href).searchParams.get(name); }

  function api(action, payload) {
    return new Promise((resolve, reject) => {
      const url = window.DH && window.DH.inviteApi;
      if (typeof url !== "string" || url.indexOf("https://") !== 0) {
        reject(new Error("Missing/invalid window.DH.inviteApi (apps/invite/config.js)"));
        return;
      }
      const cb = "DH_INVITE_CB_" + Math.random().toString(36).slice(2);
      const u = new URL(url);
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload || {}))))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
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
      const t = setTimeout(() => { cleanup(); reject(new Error("Timeout calling Apps Script")); }, 15000);

      window[cb] = (res) => {
        clearTimeout(t);
        cleanup();
        if (res && res.ok) resolve(res.data);
        else reject(new Error((res && res.error) || "API error"));
      };
      script.onerror = () => { clearTimeout(t); cleanup(); reject(new Error("Network/API error calling Apps Script")); };
      script.src = u.toString();
      script.async = true;
      document.head.appendChild(script);
    });
  }

  function toast(msg, kind) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "dh-toast show " + (kind || "");
    clearTimeout(window.__dh_toast_timer);
    window.__dh_toast_timer = setTimeout(() => el.className = "dh-toast", 2300);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly",""); ta.style.position="fixed"; ta.style.left="-9999px";
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch (e2) { return false; }
    }
  }

  window.DH = window.DH || {};
  window.DH.invite = { api, base, q, toast, copyText };
})(); 
