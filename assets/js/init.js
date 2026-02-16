document.addEventListener("DOMContentLoaded", () => {
  const A = window.AffordAct || {};
  A.initTheme?.();
  A.initStickyNav?.();
  A.initHome?.();
  A.initGlobalSearch?.();
  A.initSearchJump?.();
  A.initTOC?.();
  A.initPageSearch?.();
  A.initAnchors?.();
  A.initSubmitForm?.();
});