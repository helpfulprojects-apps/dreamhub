(function () {
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
    // MUST be the folder path where this app lives (no trailing slash)
    // Prefer config.js override:
    if (window.DH && typeof window.DH.inviteBase === "string" && window.DH.inviteBase.trim()) {
      return window.DH.inviteBase.replace(/\/+$/, "");
    }
    // Fallback: derive from current URL path
    return location.pathname.replace(/\/(index\.html)?$/, "").replace(/\/+$/, "");
  }

  function inviteBaseAbsolute() {
    // Absolute base needed so Apps Script can generate full links
    // Example: https://helpfulprojects-apps.github.io/dreamhub/apps/invite
    return (location.origin + basePath()).replace(/\/+$/, "");
  }

  // JSONP call (script tag)
  function api(action, payloadObj) {
    return new Promise((resolve, reject) => {
      const url = window.DH && window.DH.inviteApi;

      if (typeof url !== "string" || !url.startsWith("https://")) {
        reject(new Error("Missing/invalid window.DH.inviteApi (check apps/invite/config.js)"));
        return;
      }

      const cb = "DH_INVITE_CB_" + Math.random().toString(36).slice(2);
      let finished = false;

      const cleanup = (scriptEl) => {
        try { delete window[cb]; } catch {}
        if (scriptEl && scriptEl.parentNode) scriptEl.parentNode.removeChild(scriptEl);
      };

      window[cb] = (data) => {
        if (finished) return;
        finished = true;
        cleanup(script);
        resolve(data);
      };

      const u = new URL(url);

      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payloadObj || {}))))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");

      u.searchParams.set("action", action);
      u.searchParams.set("payload", b64);
      u.searchParams.set("callback", cb);

      const script = document.createElement("script");
      script.onerror = () => {
        if (finished) return;
        finished = true;
        cleanup(script);
        reject(new Error("Network/API error calling Apps Script"));
      };
      script.src = u.toString();
      script.async = true;
      document.head.appendChild(script);

      // safety timeout
      setTimeout(() => {
        if (finished) return;
        finished = true;
        cleanup(script);
        reject(new Error("Timeout calling Apps Script"));
      }, 20000);
    });
  }

  async function copyToClipboard(text, msgEl) {
    try {
      await navigator.clipboard.writeText(text);
      msgEl.textContent = "Copied ✅";
      setTimeout(() => (msgEl.textContent = ""), 1500);
    } catch {
      msgEl.textContent = "Copy failed (browser blocked)";
      setTimeout(() => (msgEl.textContent = ""), 2500);
    }
  }

  function normalizeLink(x) {
    const s = String(x || "").trim();
    if (!s) return "";
    // If something accidentally became "https://ahttps://a/...", fix by taking the LAST https:// occurrence
    const last = s.lastIndexOf("https://");
    if (last > 0) return s.slice(last);
    return s;
  }

  async function onCreate() {
    const title = document.getElementById("title").value.trim();
    const dt = document.getElementById("dt").value; // datetime-local -> "YYYY-MM-DDTHH:mm"
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
      const payload = {
        title,
        eventDateTime: dt,          // match your Apps Script field name
        location: locationText,
        message,
        rsvpDeadline: deadline || "",
        hostEmail,

        // IMPORTANT: Apps Script expects inviteBase in payload
        // and it should be ABSOLUTE (full URL), not just "/dreamhub/..."
        inviteBase: inviteBaseAbsolute()
      };

      const res = await api("createEvent", payload);

      if (!res || res.ok !== true) {
        throw new Error((res && res.error) ? res.error : "Unknown server error");
      }

      // Apps Script may return links either at top-level or in res.data (older versions)
      const guestLink = normalizeLink((res.data && res.data.guestLink) || res.guestLink);
      const hostLink  = normalizeLink((res.data && res.data.hostLink)  || res.hostLink);
      const emailedTo = (res.data && res.data.emailedTo) || res.emailedTo || res.hostEmail || hostEmail;

      if (!guestLink || !hostLink) {
        throw new Error("Server did not return guestLink/hostLink. Check Apps Script createEvent_ return object.");
      }

      document.getElementById("result").style.display = "";
      document.getElementById("sentMsg").textContent =
        "Dashboard link emailed to: " + emailedTo;

      document.getElementById("guestLink").value = guestLink;
      document.getElementById("hostLink").value = hostLink;

      document.getElementById("copyGuest").onclick = () =>
        copyToClipboard(guestLink, document.getElementById("copyGuestMsg"));

      document.getElementById("copyHost").onclick = () =>
        copyToClipboard(hostLink, document.getElementById("copyHostMsg"));

      toast("Invitation created!", "ok");
    } catch (e) {
      console.error(e);
      toast(e.message || String(e), "err");
    } finally {
      btn.disabled = false;
      status.textContent = "";
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("createBtn");
    if (btn) btn.addEventListener("click", onCreate);
  });

  // export (optional debugging)
  window.DH = window.DH || {};
  window.DH.invite = { api, toast, inviteBaseAbsolute };
})();
