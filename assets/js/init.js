document.addEventListener("DOMContentLoaded", () => {
  const A = window.AffordAct || {};
  A.initTheme?.();
  A.initStickyNav?.();
  A.initHome?.();
  A.initGlobalSearch?.();
  A.initTOC?.();
  A.initPageSearch?.();
  A.initAnchors?.();
});