(() => {
  window.AffordAct = window.AffordAct || {};

  window.AffordAct.initSubmitForm = () => {
    const kind = document.getElementById("fb_kind");
    const billWrap = document.getElementById("bill_picker_wrap");
    const billPick = document.getElementById("bill_picker");
    const section = document.getElementById("fb_section");

    if (!kind || !billWrap || !billPick || !section) return;

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
  };
})();