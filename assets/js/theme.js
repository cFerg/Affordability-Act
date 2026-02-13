(() => {
  const THEME_KEY = "affordact_theme";
  const $ = window.AffordAct.$;

  function systemIsLight() {
    return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ?? false;
  }
  function applyTheme(mode) {
    if (mode === "light") document.body.classList.add("theme-light");
    else document.body.classList.remove("theme-light");
  }
  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") { applyTheme(saved); return saved; }
    applyTheme(null); return null;
  }
  function saveTheme(mode) {
    if (!mode) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  }

  window.AffordAct.initTheme = () => {
    const btn = $("#theme-toggle");
    if (!btn) return;

    let mode = loadTheme();
    const effective = () => (mode ? mode : (systemIsLight() ? "light" : "dark"));

    btn.addEventListener("click", (e) => {
      if (e.shiftKey) { mode = null; saveTheme(mode); applyTheme(mode); return; }
      mode = (effective() === "light") ? "dark" : "light";
      saveTheme(mode);
      applyTheme(mode);
    });

    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    mq?.addEventListener?.("change", () => { if (!mode) applyTheme(null); });
  };
})();