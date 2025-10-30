document.addEventListener('DOMContentLoaded', async () => {
  /* ============= Theme toggle ============= */
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    const setTheme = (t) => document.documentElement.classList.toggle('theme-light', t === 'light');
    const saved = localStorage.getItem('aa-theme') || 'dark';
    setTheme(saved);
    themeBtn.addEventListener('click', () => {
      const next = document.documentElement.classList.contains('theme-light') ? 'dark' : 'light';
      setTheme(next); localStorage.setItem('aa-theme', next);
    });
  }

  /* ============= Back to top chip ============= */
  const backTop = document.getElementById('backTop');
  if (backTop) {
    const onScroll = () => { backTop.style.display = (window.scrollY > 400) ? 'block' : 'none'; };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============= Sections dropdown on home ============= */
  const btn = document.getElementById('toggleSections');
  const list = document.getElementById('sectionsList');
  if (btn && list) {
    try {
      const res = await fetch('/search.json', { cache: 'no-store' });
      const items = await res.json();
      const sections = items.filter(x => x.url && x.url.startsWith('/policy/sections/') && !x.heading);
      list.innerHTML = '<ul>' + sections.map(s => `<li><a href="${s.url}">${s.title}</a></li>`).join('') + '</ul>';
    } catch {
      list.innerHTML = '<div class="nores">Sections unavailable.</div>';
    }
    btn.addEventListener('click', () => {
      const open = list.style.display === 'block';
      list.style.display = open ? 'none' : 'block';
      btn.textContent = open ? '📂 View individual sections' : '📁 Hide individual sections';
    });
  }

  /* ============= Search box with subsection matches ============= */
  const box = document.getElementById('searchBox');
  const results = document.getElementById('searchResults');
  if (box && results) {
    let index = [];
    try {
      const res = await fetch('/search.json', { cache: 'no-store' });
      index = await res.json();
    } catch {}
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hi = (text, q) => {
      if (!q) return text;
      const rx = new RegExp(esc(q), 'ig');
      return (text || '').replace(rx, m => `<mark>${m}</mark>`);
    };
    const render = (q) => {
      const qq = (q || '').trim().toLowerCase();
      if (!qq) { results.hidden = true; results.innerHTML = ''; return; }
      const hits = index.filter(it =>
        (it.title||'').toLowerCase().includes(qq) ||
        (it.summary||'').toLowerCase().includes(qq) ||
        (it.heading||'').toLowerCase().includes(qq)
      ).slice(0, 12);
      results.innerHTML = hits.map(h => `
        <a href="${h.url}">
          <strong>${hi(h.title, qq)}</strong>
          ${h.heading ? `<div class="mini">${hi(h.heading, qq)}</div>` : ''}
          <div class="excerpt">${hi(h.summary || '', qq)}</div>
        </a>
      `).join('') || '<div class="nores">No results</div>';
      results.hidden = false;
    };
    box.addEventListener('input', () => render(box.value));
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const first = results.querySelector('a');
        if (first) window.location.href = first.href;
      } else if (e.key === 'Escape') {
        results.hidden = true;
      }
    });
    document.addEventListener('click', (e) => {
      if (!results.contains(e.target) && e.target !== box) results.hidden = true;
    });
  }

  /* ============= Bill sidebar: mobile toggle + highlight on scroll ============= */
  const sb = document.querySelector('.sidebar-bill[data-collapsible]');
  if (sb) {
    const btnT = sb.querySelector('.sb-toggle');
    const navLinks = Array.from(sb.querySelectorAll('#billNav a'));
    const targets = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

    if (btnT) {
      btnT.addEventListener('click', () => {
        const open = sb.getAttribute('data-open') === 'true';
        sb.setAttribute('data-open', open ? 'false' : 'true');
        btnT.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    }

    const onScroll = () => {
      const y = window.scrollY + 140; // header offset
      let active = 0;
      for (let i=0; i<targets.length; i++) {
        if (targets[i] && targets[i].offsetTop <= y) active = i;
      }
      navLinks.forEach(a => a.classList.remove('active'));
      navLinks[active]?.classList.add('active');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
});