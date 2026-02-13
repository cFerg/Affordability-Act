(() => {
  const $ = window.AffordAct.$;

  window.AffordAct.initStickyNav = () => {
    const nav = document.querySelector("[data-sticky-nav]");
    if (!nav) return;

    const topBtn = nav.querySelector("[data-nav-top]");
    topBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const searchBtn = nav.querySelector("[data-nav-search]");
    searchBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      $("input[data-page-search]")?.focus();
    });
  };
})();