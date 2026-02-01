(function () {
  // ---------------------------
  // Small UI helpers
  // ---------------------------
  function toast(msg, type = "info") {
    const el = document.createElement("div");
    el.className = "dh-toast dh-toast-" + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 200);
    }, 2600);
  }

  function basePath() {
    // Prefer explicit config (best)
    if (window.DH && typeof window.DH.inviteBase === "string" && window.DH.inviteBase.trim()) {
      return window.DH.inviteBase.trim().replace(/\/$/, "");
    }
    // Fallback: current folder
    return location.pathname.replace(/\/(index\.html)?$/, "").replace(/\/$/, "");
  }

  function appBaseAbsolute() {
    // Absolute URL used by Apps Script to build full guest/host links
    return location.origin + basePath();
  }

  // ---------------------------
  // JSONP call to Apps Script
  // ---------------------------
  function api(action, payload) {
    return new Promise((resolve, reject) => {
      const url = window.DH && window.DH.inviteApi;

      if (typeof url !== "string" || !url.startsWith("https://")) {
        reject(new Error("Missing/invalid window.DH.inviteApi (check apps/invite/config.js)"));
        return;
      }

      const cbName = "DH_INVITE_CB_" + Math.random().toString(36).slice(2);
      const u = new URL(url);

      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload || {}))))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");

      u.searchParams.set("action", action);
      u.searchParams.set("payload", b64);
      u.searchParams.set("callback", cbName);

      const script = document.createElement("script");

      let done = false;
      const cleanup = () => {
        try { delete window[cbName]; } catch {}
        try { script.remove(); } catch {}
      };

      const t = setTimeout(() => {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error("Timeout calling Apps Script"));
      }, 20000);

      window[cbName] = (data) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        cleanup();
        resolve(data);
      };

      script.onerror = () => {
        if (done) return;
        done = true;
        clearTimeout(t);
        cleanup();
        reject(new Error("Network/API error calling Apps Script"));
      };

      script.src = u.toString();
      script.async = true;
      document.head.appendChild(script);
    });
  }

  async function copyToClipboard(text, msgEl) {
    try {
      await navigator.clipboard.writeText(text);
      if (msgEl) {
        msgEl.textContent = "Copied ✅";
        setTimeout(() => (msgEl.textContent = ""), 1500);
      } else {
        toast("Copied ✅", "ok");
      }
    } catch {
      if (msgEl) {
        msgEl.textContent = "Copy failed (browser blocked)";
        setTimeout(() => (msgEl.textContent = ""), 2500);
      } else {
        toast("Copy failed (browser blocked)", "err");
      }
    }
  }

  function normalizeLinksFromResponse(res, fallbackHostEmail) {
    // Your Apps Script might return different shapes:
    // 1) { ok:true, data:{ guestLink, hostLink } }
    // 2) { ok:true, data:{ guestUrl, hostUrl } }
    // 3) { ok:true, guestLink, hostLink }  (no data wrapper)
    const data = (res && res.data) ? res.data : res;

    const guestLink =
      data?.guestLink || data?.guestURL || data?.guestUrl || data?.guestURLLink || "";

    const hostLink =
      data?.hostLink || data?.hostURL || data?.hostUrl || data?.hostURLLink || "";

    const emailedTo =
      data?.emailedTo || data?.email || data?.hostEmail || fallbackHostEmail || "";

    return { guestLink, hostLink, emailedTo };
  }

  async function onCreate() {
    const title = document.getElementById("title").value.trim();
    const dt = document.getElementById("dt").value;
    const locationText = document.getElementById("location").value.trim();
    const message = document.getElementById("message").value.trim();
    const deadline = document.getElementById("deadline").value;
    const hostEmail = document.getElementById("hostEmail").value.trim();

    if (!title) return toast("Event title required", "warn");
    if (!dt) return toast("Date/time required", "warn");
    if (!hostEmail) return toast("Host email required", "warn");

    const status = document.getElementById("status");
    const btn = document.getElementById("createBtn");

    btn.disabled = true;
    status.textContent = "Creating…";

    try {
      // IMPORTANT: send BOTH appBase (absolute) and inviteBase (path)
      // so Apps Script can build links reliably.
      const payload = {
        title,
        datetimeISO: dt,
        location: locationText,
        message,
        deadlineISO: deadline || "",
        hostEmail,

        // absolute base for full URLs:
        appBase: appBaseAbsolute(),

        // path base (some server versions expect this name):
        inviteBase: basePath()
      };

      const res = await api("createEvent", payload);

      if (!res || res.ok !== true) {
        throw new Error((res && res.error) ? res.error : "Unknown server error");
      }

      const { guestLink, hostLink, emailedTo } = normalizeLinksFromResponse(res, hostEmail);

      // If server returned relative links, make them absolute
      const fixLink = (link) => {
        if (!link) return "";
        if (link.startsWith("http://") || link.startsWith("https://")) return link;
        if (link.startsWith("/")) return location.origin + link;
        // relative like "guest.html?..."
        return appBaseAbsolute().replace(/\/$/, "") + "/" + link.replace(/^\//, "");
      };

      const guest = fixLink(guestLink);
      const host = fixLink(hostLink);

      if (!guest || !host) {
        console.log("Full response from Apps Script:", res);
        throw new Error("Server did not return guest/host links. Check Apps Script response fields.");
      }

      document.getElementById("result").style.display = "";
      document.getElementById("sentMsg").textContent =
        "Dashboard link emailed to: " + (emailedTo || hostEmail);

      document.getElementById("guestLink").value = guest;
      document.getElementById("hostLink").value = host;

      document.getElementById("copyGuest").onclick = () =>
        copyToClipboard(guest, document.getElementById("copyGuestMsg"));

      document.getElementById("copyHost").onclick = () =>
        copyToClipboard(host, document.getElementById("copyHostMsg"));

      toast("Invitation created!", "ok");
    } catch (e) {
      console.error(e);
      toast(e.message || String(e), "err");
    } finally {
      btn.disabled = false;
      status.textContent = "";
    }
  }

  // Wire up
  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("createBtn");
    if (btn) btn.addEventListener("click", onCreate);
  });

  // Export for debugging
  window.DH = window.DH || {};
  window.DH.invite = { api, toast, basePath, appBaseAbsolute };
})();
