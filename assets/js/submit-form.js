(() => {
  window.AffordAct = window.AffordAct || {};

  function setStatus(statusEl, message, kind = "info") {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.style.color =
      kind === "error" ? "#b91c1c" :
      kind === "success" ? "#166534" :
      "";
  }

  function resetTurnstile() {
    if (!window.turnstile) return;
    const widget = document.querySelector(".cf-turnstile");
    if (widget) window.turnstile.reset(widget);
  }

  window.AffordAct.initSubmitForm = () => {
    const form = document.querySelector(".aff-form");
    const kind = document.getElementById("fb_kind");
    const billWrap = document.getElementById("bill_picker_wrap");
    const billPick = document.getElementById("bill_picker");
    const section = document.getElementById("fb_section");
    const statusEl = document.getElementById("form-status");
    const submitBtn = document.getElementById("submitBtn");

    if (!form || !kind || !billWrap || !billPick || !section || !submitBtn) {
      return;
    }

    function updateVisibility() {
      const isBill = (kind.value || "").toLowerCase().includes("bill");
      billWrap.hidden = !isBill;

      if (!isBill) {
        billPick.selectedIndex = 0;
      }
    }

    kind.addEventListener("change", updateVisibility);

    billPick.addEventListener("change", () => {
      const v = billPick.value || "";
      if (v && v !== "Other") section.value = v;
      else if (v === "Other") section.value = "";
    });

    updateVisibility();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus(statusEl, "");

      if (!form.reportValidity()) {
        setStatus(statusEl, "Please fill out the required fields.", "error");
        return;
      }

      submitBtn.disabled = true;
      setStatus(statusEl, "Sending...");

      try {
        const formData = new FormData(form);

        const response = await fetch(form.action, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        const contentType = response.headers.get("content-type") || "";
        let payload = null;

        if (contentType.includes("application/json")) {
          payload = await response.json().catch(() => null);
        } else {
          const text = await response.text().catch(() => "");
          payload = text ? { error: text } : null;
        }

        if (!response.ok) {
          setStatus(
            statusEl,
            payload?.error || "There was a problem sending your message. Please try again.",
            "error"
          );
          resetTurnstile();
          submitBtn.disabled = false;
          return;
        }

        setStatus(statusEl, "Message sent. Redirecting...", "success");
        form.reset();
        resetTurnstile();
        window.location.href = "/submit/thanks/";
      } catch (err) {
        setStatus(statusEl, "Network error. Please try again in a moment.", "error");
        resetTurnstile();
        submitBtn.disabled = false;
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (window.AffordAct?.initSubmitForm) {
        window.AffordAct.initSubmitForm();
      }
    });
  } else {
    if (window.AffordAct?.initSubmitForm) {
      window.AffordAct.initSubmitForm();
    }
  }
})();