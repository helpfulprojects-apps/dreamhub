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
    // This MUST be a PATH like "/dreamhub/apps/invite"
    // Prefer explicit config, else derive from current page path
    const b = window.DH && window.DH.inviteBase;
    if (typeof b === "string" && b.trim()) return b.trim();
    return location.pathname.replace(/\/(index\.html)?$/, "").replace(/\/$/, "");
  }

  function appBaseAbsolute() {
    // Absolute base so Apps Script can build full links
    // Example: "https://helpfulprojects-apps.github.io" + "/dreamhub/apps/invite"
    return location.origin + basePath();
  }

  // JSONP call (script tag)
  function api(action, payload) {
    return new Promise((resolve, reject) => {
      const url = window.DH && window.DH.inviteApi;

      if (typeof url !== "string" || !url.startsWith("https://")) {
        reject(
          new Error(
            "Missing/invalid window.DH.inviteApi (check apps/invite/config.js)"
          )
        );
        return;
      }

      const cb = "DH_INVITE_CB_" + Math.random().toString(36).slice(2);
      const u = new URL(url);

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

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout calling Apps Script"));
      }, 20000);

      window[cb] = (data) => {
        clearTimeout(timer);
        cleanup();
        resolve(data);
      };

      script.onerror = () => {
        clearTimeout(timer);
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
      msgEl.textContent = "Copied ✅";
      setTimeout(() => (msgEl.textContent = ""), 1500);
    } catch {
      msgEl.textContent = "Copy failed (browser blocked)";
      setTimeout(() => (msgEl.textContent = ""), 2500);
    }
  }

  function looksLikeEmail(s) {
    // simple validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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
    if (!looksLikeEmail(hostEmail)) return toast("Enter a valid host email", "warn");

    const status = document.getElementById("status");
    const btn = document.getElementById("createBtn");

    btn.disabled = true;
    status.textContent = "Creating…";

    try {
      const inviteBase = basePath();          // "/dreamhub/apps/invite"
      const appBase = appBaseAbsolute();      // "https://.../dreamhub/apps/invite"

      // IMPORTANT:
      // Your Apps Script expects inviteBase in payload (you saw "Missing inviteBase in payload")
      const payload = {
        title,
        datetimeISO: dt,
        location: locationText,
        message,
        deadlineISO: deadline || "",
        hostEmail,

        // REQUIRED fields for backend link generation + routing
        inviteBase,   // ✅ fixes "Missing inviteBase in payload"
        appBase       // ✅ helps backend build full URLs
      };

      const res = await api("createEvent", payload);

      if (!res || res.ok !== true) {
        throw new Error((res && res.error) ? res.error : "Unknown server error");
      }

      const data = res.data || {};
      if (!data.guestLink || !data.hostLink) {
        throw new Error(
          "Server did not return guestLink/hostLink. Check Apps Script: appBase/inviteBase and deployment permissions."
        );
      }

      document.getElementById("result").style.display = "";
      document.getElementById("sentMsg").textContent =
        "Dashboard link emailed to: " + (data.emailedTo || hostEmail);

      document.getElementById("guestLink").value = data.guestLink;
      document.getElementById("hostLink").value = data.hostLink;

      document.getElementById("copyGuest").onclick = () =>
        copyToClipboard(data.guestLink, document.getElementById("copyGuestMsg"));

      document.getElementById("copyHost").onclick = () =>
        copyToClipboard(data.hostLink, document.getElementById("copyHostMsg"));

      toast("Invitation created!", "ok");
    } catch (e) {
      console.error(e);
      toast(e.message || String(e), "err");
    } finally {
      btn.disabled = false;
      status.textContent = "";
    }
  }

  // wire up
  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("createBtn");
    if (btn) btn.addEventListener("click", onCreate);
  });

  // export (optional debugging)
  window.DH = window.DH || {};
  window.DH.invite = { api, toast, appBaseAbsolute, basePath };
})();
