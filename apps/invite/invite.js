(function () {
  function toast(msg, type = "info") {
    const el = document.createElement("div");
    el.className = "dh-toast dh-toast-" + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 200); }, 2600);
  }

  function basePath() {
    // must be the folder containing the app
    if (window.DH && window.DH.inviteBase) return window.DH.inviteBase;
    return location.pathname.replace(/\/(index\.html)?$/, "");
  }

  function appBaseAbsolute() {
    // absolute base needed so Apps Script can build full links
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
      window[cb] = (data) => {
        try { delete window[cb]; } catch {}
        resolve(data);
      };

      const u = new URL(url);
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload || {}))))
        .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

      u.searchParams.set("action", action);
      u.searchParams.set("payload", b64);
      u.searchParams.set("callback", cb);

      const script = document.createElement("script");
      script.onerror = () => reject(new Error("Network/API error calling Apps Script"));
      script.src = u.toString();
      script.async = true;
      document.head.appendChild(script);

      // safety timeout
      setTimeout(() => reject(new Error("Timeout calling Apps Script")), 20000);
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
        datetimeISO: dt,
        location: locationText,
        message,
        deadlineISO: deadline || "",
        hostEmail,
        appBase: appBaseAbsolute() // ✅ THIS FIXES “undefined” LINKS
      };

      const res = await api("createEvent", payload);

      if (!res || res.ok !== true) {
        throw new Error((res && res.error) ? res.error : "Unknown server error");
      }

      const data = res.data || {};
      if (!data.guestLink || !data.hostLink) {
        throw new Error("Server did not return guestLink/hostLink (check Apps Script appBase + deployment access)");
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
  window.DH.invite = { api, toast, appBaseAbsolute };
})();
