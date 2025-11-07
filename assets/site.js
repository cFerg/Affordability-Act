// Shared helpers
const AA = (() => {
  const root = document.documentElement.getAttribute('data-site-root') || '';
  const toSlug = (fname) => fname.replace(/\.md$/i,'');
  const prettyTitle = (slug) =>
    slug
      .replace(/^\d+_?/, '')   // drop leading numbers like "01_"
      .replace(/_/g, ' ')      // underscores -> spaces
      .trim();

  const urls = {
    bill: () => `${root}/policy/bill-text/`,
    section: (slug) => `${root}/policy/sections/${slug}/`,
    sectionsJson: () => `${root}/sections.json`,
  };

  const naturalSort = (a,b) => {
    const A=(a.toLowerCase().match(/\d+|[a-z]+/g))||[a];
    const B=(b.toLowerCase().match(/\d+|[a-z]+/g))||[b];
    for(let i=0;i<Math.max(A.length,B.length);i++){
      const x=A[i], y=B[i];
      if(x===undefined) return -1;
      if(y===undefined) return 1;
      const xi=+x, yi=+y;
      if(!Number.isNaN(xi) && !Number.isNaN(yi) && xi!==yi) return xi-yi;
      if(x!==y) return x.localeCompare(y);
    }
    return 0;
  };

  async function getSections() {
    try{
      const r = await fetch(urls.sectionsJson(), { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      const arr = await r.json();
      if (Array.isArray(arr)) return arr;
    }catch(_){}
    return [];
  }

  return { root, toSlug, prettyTitle, urls, naturalSort, getSections };
})();

// Base behaviors
(function(){
  // Smooth scroll to top
  const toTop = document.querySelector('[data-scroll-top]');
  if (toTop){
    toTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Expand all <details> if ?open=all
  const params = new URLSearchParams(location.search);
  if (params.get('open') === 'all'){
    document.querySelectorAll('details.section').forEach(d => d.open = true);
  }

  // Button baseline hardening
  document.querySelectorAll('.btn').forEach(btn => { btn.style.lineHeight = '1'; });
})();

// LANDING: toggle + auto-build section cards from sections.json
(function(){
  const toggleBtn = document.getElementById('toggle-sections');
  const grid = document.querySelector('.section-grid');

  if (toggleBtn && grid){
    toggleBtn.addEventListener('click', () => {
      const hidden = grid.hasAttribute('hidden');
      if (hidden) grid.removeAttribute('hidden'); else grid.setAttribute('hidden', '');
      toggleBtn.setAttribute('aria-expanded', String(hidden));
      const span = toggleBtn.querySelector('span');
      if (span) span.textContent = hidden ? 'Hide sections' : 'Show individual sections';
    });

    // Build cards
    AA.getSections().then(files => {
      grid.setAttribute('aria-busy', 'false');
      if (!files.length) return;

      // Keep input order (sections.json) for UX predictability
      const frag = document.createDocumentFragment();

      files.forEach(fname => {
        const slug = AA.toSlug(fname);
        const title = AA.prettyTitle(slug);

        const card = document.createElement('div');
        card.className = 'section-card';

        const h = document.createElement('div');
        h.className = 'section-card__title';
        h.textContent = title;

        const a = document.createElement('a');
        a.className = 'btn';
        a.href = AA.urls.section(slug);
        a.innerHTML = '<span>Open</span>';

        card.appendChild(h);
        card.appendChild(a);
        frag.appendChild(card);
      });

      grid.innerHTML = '';
      grid.appendChild(frag);
    });
  }
})();

// SECTIONS: inline pager + mini-pager + sidebar + simple in-section search
(function(){
  const currentFile = document.body.getAttribute('data-section-file'); // e.g. "02_Housing_and_Land_Use.md"
  const pager = document.getElementById('section-pager');

  // Sidebar hook (optional include)
  const sectionsList = document.getElementById('sections-list');

  // Search inside current section (optional include)
  const searchInput = document.getElementById('section-search');

  if (!currentFile && !pager && !sectionsList && !searchInput) return;

  function hydratePrevNext(files){
    const idx = files.indexOf(currentFile);
    const prev = idx>0 ? files[idx-1] : null;
    const next = (idx>=0 && idx<files.length-1) ? files[idx+1] : null;
    return { prev, next };
  }

  AA.getSections().then(files => {
    if (!files.length) return;

    // Optional sidebar list (alphabetical within numeric groups for readability)
    if (sectionsList){
      sectionsList.innerHTML = '';
      const ordered = files.slice().sort(AA.naturalSort);
      for (const f of ordered){
        const li = document.createElement('li');
        const a = document.createElement('a');
        const slug = AA.toSlug(f);
        a.href = AA.urls.section(slug);
        a.textContent = AA.prettyTitle(slug);
        li.appendChild(a);
        sectionsList.appendChild(li);
      }
    }

    // Inline pager on section pages
    if (currentFile && pager){
      const { prev, next } = hydratePrevNext(files);

      const frag = document.createDocumentFragment();

      const backBtn = document.createElement('a');
      backBtn.className = 'btn btn--ghost';
      backBtn.href = AA.urls.bill();
      backBtn.innerHTML = '<span>← Back to Full Bill</span>';
      frag.appendChild(backBtn);

      if (prev){
        const a = document.createElement('a');
        a.className = 'btn';
        a.href = AA.urls.section(AA.toSlug(prev));
        a.innerHTML = '<span>← Previous</span>';
        a.setAttribute('data-dir','prev');
        frag.appendChild(a);
      }

      if (next){
        const a = document.createElement('a');
        a.className = 'btn';
        a.href = AA.urls.section(AA.toSlug(next));
        a.innerHTML = '<span>Next →</span>';
        a.setAttribute('data-dir','next');
        frag.appendChild(a);
      }

      pager.appendChild(frag);
      pager.hidden = false;

      // Floating mini-pager (mobile)
      const mini = pager.cloneNode(true);
      mini.id = 'mini-pager';
      mini.classList.add('mini-pager');
      mini.hidden = true;
      document.body.appendChild(mini);

      let visible = false;
      const toggleMini = () => {
        const y = window.scrollY;
        const shouldShow = y > 400;
        if (shouldShow !== visible) {
          visible = shouldShow;
          mini.hidden = !shouldShow;
        }
      };
      window.addEventListener('scroll', toggleMini);
    }
  });

  // In-section quick filter (super lightweight)
  if (searchInput){
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const blocks = document.querySelectorAll('.main p, .main li');
      blocks.forEach(el=>{
        if (!q) { el.style.display=''; return; }
        const hit = el.textContent.toLowerCase().includes(q);
        el.style.display = hit ? '' : 'none';
      });
    });
  }
})();
