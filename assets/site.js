(function() {
  const key = 'aa-theme';
  const btn = document.getElementById('themeToggle');
  const root = document.documentElement;

  function setTheme(mode) {
    root.classList.toggle('theme-light', mode === 'light');
    root.classList.toggle('theme-dark', mode !== 'light');
    if (btn) btn.textContent = mode === 'light' ? '🌞' : '🌙';
  }

  const stored = localStorage.getItem(key);
  if (stored) setTheme(stored);
  else {
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(prefersLight ? 'light' : 'dark');
  }

  if (btn) {
    btn.addEventListener('click', () => {
      const next = root.classList.contains('theme-light') ? 'dark' : 'light';
      localStorage.setItem(key, next);
      setTheme(next);
    });
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleSections');
  const list = document.getElementById('sectionsList');
  if (btn && list) {
    btn.addEventListener('click', () => {
      const open = !list.hasAttribute('hidden');
      if (open) {
        list.setAttribute('hidden', '');
        btn.textContent = 'Show individual sections';
      } else {
        list.removeAttribute('hidden');
        btn.textContent = 'Hide individual sections';
      }
    });
  }
});
