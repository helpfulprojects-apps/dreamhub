// apps/invite/invite.js
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
    // Prefer config.js value so links are correct even if user opens /index.html etc.
    if (window.DH && typeof window.DH.inviteBase === "string" && window.DH.inviteBase.trim()) {
      return window.DH.inviteBase.trim();
    }
    // Fallback: folder of current page
    return location.pathname.replace(/\/(index\.html)?$/, "");
  }

  function inviteBaseAbsolute() {
    // Absolute base needed so Apps Script can build full links with https://host/...
    return location.origin + basePath();
  }

  // JSONP call (script tag)
  function api(action, payload) {
    return new Promise((resolve, reject) => {
      const url = window.DH && window.DH.inviteApi;

      if (typeof url !== "string" || !url.startsWith("https://")) {
        reject(new Error("Missing/invalid window.DH.inviteApi (check apps/invite/config.js)"));
        return;
      }

      const cb = "DH_INVITE_CB_" + Math.random().toString(36).slice(2);
      let done = false;

      const cleanup = () => {
        if (done) return;
        done = true;
        try { delete window[cb]; } catch {}
        try { script.remove(); } catch {}
      };

      window[cb] = (data) => {
        cleanup();
        resolve(data);
      };

      const u = new URL(url);
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload || {}))))
        .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

      u.searchParams.set("action", action);
      u.searchParams.set("payload", b64);
      u.searchParams.set("callback", cb);

      const script = document.createElement("script");
      script.onerror = () => {
        cleanup();
        reject(new Error("Network/API error calling Apps Script"));
      };
      script.src = u.toString();
      script.async = true;
      document.head.appendChild(script);

      // safety timeout
      setTimeout(() => {
        if (!done) {
          cleanup();
          reject(new Error("Timeout calling Apps Script"));
        }
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
        // IMPORTANT: match Apps Script keys exactly:
        eventDateTime: dt,
        location: locationText,
        message,
        rsvpDeadline: deadline || "",
        hostEmail,

        // IMPORTANT: Apps Script expects inviteBase
        inviteBase: inviteBaseAbsolute(),

        // Backward compatibility (safe to keep)
        appBase: inviteBaseAbsolute(),
      };

      const res = await api("createEvent", payload);

      if (!res || res.ok !== true) {
        throw new Error((res && res.error) ? res.error : "Unknown server error");
      }

      // Your Apps Script returns guestLink/hostLink at top-level (not res.data)
      const guestLink = res.guestLink || (res.data && res.data.guestLink) || "";
      const hostLink  = res.hostLink  || (res.data && res.data.hostLink)  || "";
      const emailedTo = res.hostEmail || (res.data && res.data.emailedTo) || hostEmail;

      if (!guestLink || !hostLink) {
        throw new Error("Server did not return guestLink/hostLink. Check Apps Script createEvent_ return values.");
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
