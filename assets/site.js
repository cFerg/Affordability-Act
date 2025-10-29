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

document.addEventListener('DOMContentLoaded', async () => {
  const btn = document.getElementById('toggleSections');
  const list = document.getElementById('sectionsList');
  if (btn && list) {
    // populate once from search.json (uses the same titles/urls)
    try {
      const res = await fetch('/search.json', { cache: 'no-store' });
      const items = await res.json();
      // only sections (recognize by URL prefix)
      const sections = items.filter(x => x.url && x.url.startsWith('/policy/sections/'));
      list.innerHTML = '<ul>' + sections.map(s =>
        `<li><a href="${s.url}">${s.title}</a></li>`
      ).join('') + '</ul>';
    } catch (e) {
      list.innerHTML = '<div class="nores">Sections unavailable.</div>';
    }

    btn.addEventListener('click', () => {
      const open = list.style.display === 'block';
      list.style.display = open ? 'none' : 'block';
      btn.textContent = open ? '📂 View individual sections' : '📁 Hide individual sections';
    });
  }
});


document.addEventListener('DOMContentLoaded', async () => {
  const box = document.getElementById('searchBox');
  const results = document.getElementById('searchResults');
  if (!box || !results) return;

  let index = [];
  try {
    const res = await fetch('/search.json', { cache: 'no-store' });
    index = await res.json();
  } catch (e) { /* ignore */ }

  function render(q){
    const qq = q.trim().toLowerCase();
    if (!qq) { results.hidden = true; results.innerHTML = ''; return; }
    const hits = index.filter(it =>
      it.title.toLowerCase().includes(qq) ||
      it.summary.toLowerCase().includes(qq)
    ).slice(0, 10);

    results.innerHTML = hits.map(h => `
      <a href="${h.url}"><strong>${h.title}</strong><br><span>${h.summary}</span></a>
    `).join('') || '<div class="nores">No results</div>';
    results.hidden = false;
  }

  box.addEventListener('input', () => render(box.value));
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there is exactly one result, go to it; else keep the list open.
      const first = results.querySelector('a');
      if (first) window.location.href = first.href;
    } else if (e.key === 'Escape') {
      results.hidden = true;
    }
  });

  document.addEventListener('click', (e) => {
    if (!results.contains(e.target) && e.target !== box) {
      results.hidden = true;
    }
  });
});
