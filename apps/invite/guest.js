// apps/invite/guest.js
(function () {
    function $(id) { return document.getElementById(id); }
  
    function toast(msg, type = "info") {
      const el = document.createElement("div");
      el.className = "dh-toast dh-toast-" + type;
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.classList.add("show"), 10);
      setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 200); }, 2600);
    }
  
    function api(action, payload) {
      return new Promise((resolve, reject) => {
        const url = window.DH && window.DH.inviteApi;
        if (typeof url !== "string" || !url.startsWith("https://")) {
          reject(new Error("Missing/invalid window.DH.inviteApi (check apps/invite/config.js)"));
          return;
        }
  
        const cb = "DH_GUEST_CB_" + Math.random().toString(36).slice(2);
        let done = false;
  
        const cleanup = () => {
          if (done) return;
          done = true;
          try { delete window[cb]; } catch {}
          try { script.remove(); } catch {}
        };
  
        window[cb] = (data) => { cleanup(); resolve(data); };
  
        const u = new URL(url);
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload || {}))))
          .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  
        u.searchParams.set("action", action);
        u.searchParams.set("payload", b64);
        u.searchParams.set("callback", cb);
  
        const script = document.createElement("script");
        script.onerror = () => { cleanup(); reject(new Error("Network/API error calling Apps Script")); };
        script.src = u.toString();
        script.async = true;
        document.head.appendChild(script);
  
        setTimeout(() => {
          if (!done) { cleanup(); reject(new Error("Timeout calling Apps Script")); }
        }, 20000);
      });
    }
  
    function clampNonNeg(n) {
      n = Number(n);
      if (!Number.isFinite(n) || n < 0) return 0;
      return Math.floor(n);
    }
  
    function wireStepper(minusId, valueId, plusId) {
      const minus = $(minusId);
      const plus = $(plusId);
      const value = $(valueId);
  
      const get = () => clampNonNeg(value.value || value.textContent || 0);
      const set = (n) => {
        n = clampNonNeg(n);
        if ("value" in value) value.value = String(n);
        else value.textContent = String(n);
      };
  
      minus.addEventListener("click", () => set(get() - 1));
      plus.addEventListener("click", () => set(get() + 1));
  
      // if user types manually, keep non-negative
      if ("value" in value) {
        value.addEventListener("input", () => set(get()));
      }
    }
  
    function getEventIdFromUrl() {
      const qs = new URLSearchParams(location.search);
      return qs.get("eventId") || qs.get("eventid") || "";
    }
  
    async function loadEvent(eventId) {
      const res = await api("getEvent", { eventId });
      if (!res || res.ok !== true) throw new Error(res && res.error ? res.error : "Failed to load event");
      return res.event;
    }
  
    async function onSubmit(eventId) {
      const guestName = $("guestName").value.trim();
      const guestEmail = ($("guestEmail") ? $("guestEmail").value.trim() : "");
      const status = document.querySelector("input[name='status']:checked")?.value || "";
      const adults = clampNonNeg($("adults").value);
      const kids = clampNonNeg($("kids").value);
      const food = ($("food") ? $("food").value : "");
      const note = ($("note") ? $("note").value.trim() : "");
  
      if (!guestName) return toast("Your name is required", "warn");
      if (!status) return toast("Please select Yes/Maybe/No", "warn");
  
      const btn = $("submitBtn");
      btn.disabled = true;
      btn.textContent = "Submitting…";
  
      try {
        const res = await api("submitRsvp", {
          eventId, guestName, guestEmail, status, adults, kids, food, note
        });
  
        if (!res || res.ok !== true) {
          throw new Error(res && res.error ? res.error : "Submit failed");
        }
  
        toast("RSVP saved ✅", "ok");
        btn.textContent = "Submitted ✅";
        setTimeout(() => { btn.textContent = "Submit RSVP"; btn.disabled = false; }, 1500);
      } catch (e) {
        console.error(e);
        toast(e.message || String(e), "err");
        btn.disabled = false;
        btn.textContent = "Submit RSVP";
      }
    }
  
    window.addEventListener("DOMContentLoaded", async () => {
      const eventId = getEventIdFromUrl();
      if (!eventId) {
        toast("Missing eventId in URL", "err");
        return;
      }
  
      // steppers (IDs must match your guest.html)
      wireStepper("adultsMinus", "adults", "adultsPlus");
      wireStepper("kidsMinus", "kids", "kidsPlus");
  
      // Load event -> remove Loading...
      try {
        const ev = await loadEvent(eventId);
        if ($("loading")) $("loading").style.display = "none";
        if ($("eventTitle")) $("eventTitle").textContent = ev.title || "Event";
        if ($("eventMeta")) $("eventMeta").textContent =
          [ev.eventDateTime, ev.location].filter(Boolean).join(" • ");
        if ($("eventMessage")) $("eventMessage").textContent = ev.message || "";
      } catch (e) {
        console.error(e);
        toast(e.message || String(e), "err");
        return;
      }
  
      $("submitBtn").addEventListener("click", () => onSubmit(eventId));
    });
  
    window.DH = window.DH || {};
    window.DH.guest = { api };
  })();
  