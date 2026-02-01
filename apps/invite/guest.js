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
  
    function clampNonNeg(n) {
      n = Number(n);
      if (!Number.isFinite(n) || n < 0) return 0;
      return Math.floor(n);
    }
  
    function wireStepper(minusId, valueId, plusId) {
      const minus = $(minusId);
      const plus = $(plusId);
      const value = $(valueId);
  
      const get = () => clampNonNeg(value.value || 0);
      const set = (n) => { value.value = String(clampNonNeg(n)); };
  
      minus.addEventListener("click", () => set(get() - 1));
      plus.addEventListener("click", () => set(get() + 1));
      value.addEventListener("input", () => set(get()));
    }
  
    function getEventIdFromUrl() {
      const qs = new URLSearchParams(location.search);
      // support a few variants just in case
      return qs.get("eventId") || qs.get("eventid") || qs.get("event") || "";
    }
  
    function selectedStatus() {
      return document.querySelector("input[name='status']:checked")?.value || "";
    }
  
    async function loadEvent(eventId) {
      // Use the shared invite.js JSONP API
      const res = await window.DH.invite.api("getEvent", { eventId });
  
      if (!res || res.ok !== true) {
        throw new Error(res && res.error ? res.error : "Failed to load event");
      }
  
      // Support either res.event or res.data (depending on your Apps Script shape)
      const ev = res.event || res.data || res;
  
      // Populate header
      if ($("title")) $("title").textContent = ev.title || "Event";
      if ($("meta")) {
        const parts = [];
        if (ev.eventDateTime) parts.push(ev.eventDateTime);
        if (ev.location) parts.push(ev.location);
        $("meta").textContent = parts.join(" • ");
      }
      if ($("message")) $("message").textContent = ev.message || "";
  
      // Optional deadline note (support multiple possible field names)
      const deadline = ev.rsvpDeadline || ev.rsvpDeadlinePretty || ev.deadlinePretty || "";
      if ($("deadlineNote")) {
        $("deadlineNote").textContent = deadline ? ("Please respond by: " + deadline) : "";
      }
  
      // Optional: close RSVP if backend says so
      if (ev.closed === true) {
        $("submitBtn").disabled = true;
        $("status").textContent = "RSVP closed.";
      }
    }
  
    async function onSubmit(eventId) {
      const guestName = $("guestName").value.trim();
      const statusVal = selectedStatus();
      const adults = clampNonNeg($("adults").value);
      const kids = clampNonNeg($("kids").value);
      const food = $("food") ? $("food").value : "";
      const note = $("note") ? $("note").value.trim() : "";
  
      if (!guestName) return toast("Your name is required", "warn");
      if (!statusVal) return toast("Please select Yes/Maybe/No", "warn");
  
      const btn = $("submitBtn");
      btn.disabled = true;
      $("status").textContent = "Saving…";
  
      try {
        const res = await window.DH.invite.api("submitRsvp", {
          eventId,
          guestName,
          status: statusVal,
          adults,
          kids,
          food,
          note
        });
  
        if (!res || res.ok !== true) {
          throw new Error(res && res.error ? res.error : "Submit failed");
        }
  
        toast("RSVP saved ✅", "ok");
        $("status").textContent = "Saved ✅";
      } catch (e) {
        console.error(e);
        toast(e.message || String(e), "err");
        $("status").textContent = e.message || "Failed";
      } finally {
        btn.disabled = false;
      }
    }
  
    window.addEventListener("DOMContentLoaded", async () => {
      // If invite.js didn’t load, stop immediately (helps debugging)
      if (!window.DH || !window.DH.invite || typeof window.DH.invite.api !== "function") {
        console.error("invite.js not loaded or window.DH.invite.api missing");
        toast("Internal error: invite.js not loaded", "err");
        return;
      }
  
      const eventId = getEventIdFromUrl();
      if (!eventId) {
        $("title").textContent = "Invalid link";
        $("status").textContent = "Missing event id.";
        return;
      }
  
      // steppers
      wireStepper("adultsMinus", "adults", "adultsPlus");
      wireStepper("kidsMinus", "kids", "kidsPlus");
  
      try {
        await loadEvent(eventId);
      } catch (e) {
        console.error(e);
        $("title").textContent = e.message || "Error";
        return;
      }
  
      $("submitBtn").addEventListener("click", () => onSubmit(eventId));
    });
  
    // export for debugging
    window.DH = window.DH || {};
    window.DH.guest = { toast };
  })();
  