// apps/invite/host.js
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
  
        const cb = "DH_HOST_CB_" + Math.random().toString(36).slice(2);
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
  
    function getQs(name) {
      const qs = new URLSearchParams(location.search);
      const eventId = qs.get("eventId") || qs.get("eventid") || "";
      const hostKey = qs.get("k") || "";
      return qs.get(name) || qs.get(name.toLowerCase()) || qs.get(name.toUpperCase()) || "";
    }
  
    function renderSummary(rows) {
      let yesPeople = 0, maybePeople = 0, noCount = 0;
  
      for (const r of rows) {
        const st = String(r.status || "").toUpperCase();
        const adults = Number(r.adults || 0) || 0;
        const kids = Number(r.kids || 0) || 0;
  
        if (st === "YES") yesPeople += (adults + kids);
        else if (st === "MAYBE") maybePeople += (adults + kids);
        else if (st === "NO") noCount += 1;
      }
  
      if ($("sumYes")) $("sumYes").textContent = String(yesPeople);
      if ($("sumMaybe")) $("sumMaybe").textContent = String(maybePeople);
      if ($("sumNo")) $("sumNo").textContent = String(noCount);
    }
  
    function renderList(rows) {
      const box = $("rsvpList");
      if (!box) return;
  
      if (!rows.length) {
        box.textContent = "No RSVPs yet.";
        return;
      }
  
      box.innerHTML = "";
      rows.forEach((r) => {
        const div = document.createElement("div");
        div.className = "dh-rsvp-row";
        div.innerHTML = `
          <div><b>${escapeHtml(r.guestName || "")}</b> (${escapeHtml(r.status || "")})</div>
          <div>Adults: ${Number(r.adults || 0)} | Kids: ${Number(r.kids || 0)} | Food: ${escapeHtml(r.food || "")}</div>
          <div class="muted">${escapeHtml(r.note || "")}</div>
        `;
        box.appendChild(div);
      });
    }
  
    function escapeHtml(s) {
      return String(s || "").replace(/[&<>"']/g, (c) => ({
        "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
      }[c]));
    }
  
    async function refresh(eventId, k) {
      try {
        const res = await api("listRsvps", { eventId, k });
        if (!res || res.ok !== true) throw new Error(res?.error || "Failed to load RSVPs");
        const rows = res.rsvps || [];
        renderSummary(rows);
        renderList(rows);
      } catch (e) {
        console.error(e);
        toast(e.message || String(e), "err");
      }
    }
  
    window.addEventListener("DOMContentLoaded", () => {
      const eventId = getQs("eventId") || getQs("eventid");
      const k = getQs("k"); // host secret key
  
      if (!eventId) return toast("Missing eventId in URL", "err");
      if (!k) return toast("Missing host key (k) in URL", "err");
  
      $("refreshBtn")?.addEventListener("click", () => refresh(eventId, k));
      refresh(eventId, k);
    });
  
    window.DH = window.DH || {};
    window.DH.host = { api };
  })();
  