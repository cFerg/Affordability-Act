// Base behaviors
(function(){
  // Smooth-scroll to top
  const toTop = document.querySelector('[data-scroll-top]');
  if (toTop){
    toTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Expand all sections if ?open=all
  const params = new URLSearchParams(location.search);
  if (params.get('open') === 'all'){
    document.querySelectorAll('details.section').forEach(d => d.open = true);
  }

  // Button baseline hardening
  document.querySelectorAll('.btn').forEach(btn => { btn.style.lineHeight = '1'; });
})();

// Section pager
(function(){
  const pager = document.getElementById('section-pager');
  const currentFile = document.body.getAttribute('data-section-file'); // e.g., "02_Housing_and_Land_Use.md"
  if (!pager || !currentFile) return;

  const root = document.documentElement.getAttribute('data-site-root') || '';

  // Strip extension
  const toSlug = (fname) => fname.replace(/\.md$/i, '');

  // Pretty permalink paths
  const sectionUrl = (slug) => `${root}/policy/sections/${slug}/`;
  const billUrl = () => `${root}/policy/bill-text/`;

  const loadSections = async () => {
    try {
      const res = await fetch(`${root}/sections.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP '+res.status);
      const arr = await res.json();
      if (Array.isArray(arr) && arr.length) return arr;
    } catch (_) {}
    // Fallback: infer from links on the page
    const guesses = Array.from(document.querySelectorAll('a[href*="/policy/sections/"]'))
      .map(a => a.getAttribute('href'))
      .filter(Boolean)
      .map(href => href.split('/').filter(Boolean).pop())
      .map(seg => seg.endsWith('/') ? seg.slice(0,-1) : seg)
      .map(seg => `${seg}.md`);
    const dedup = [...new Set(guesses)];
    return dedup.sort((a,b)=>{
      const A = a.toLowerCase().match(/\d+|[a-z]+/g) || [a];
      const B = b.toLowerCase().match(/\d+|[a-z]+/g) || [b];
      for (let i=0;i<Math.max(A.length, B.length);i++){
        const x = A[i], y = B[i];
        if (x===undefined) return -1;
        if (y===undefined) return 1;
        const xi = +x, yi = +y;
        if (!Number.isNaN(xi) && !Number.isNaN(yi) && xi!==yi) return xi-yi;
        if (x!==y) return x.localeCompare(y);
      }
      return 0;
    });
  };

  loadSections().then(files => {
    if (!files || !files.length) return;

    const idx = files.indexOf(currentFile);
    const prev = idx > 0 ? files[idx-1] : null;
    const next = idx >= 0 && idx < files.length-1 ? files[idx+1] : null;

    const frag = document.createDocumentFragment();

    const backBtn = document.createElement('a');
    backBtn.className = 'btn btn--ghost';
    backBtn.href = billUrl();
    backBtn.innerHTML = '<span>← Back to Full Bill</span>';
    frag.appendChild(backBtn);

    if (prev){
      const a = document.createElement('a');
      a.className = 'btn';
      a.href = sectionUrl(toSlug(prev));
      a.innerHTML = '<span>← Previous</span>';
      a.setAttribute('data-dir','prev');
      frag.appendChild(a);
    }

    if (next){
      const a = document.createElement('a');
      a.className = 'btn';
      a.href = sectionUrl(toSlug(next));
      a.innerHTML = '<span>Next →</span>';
      a.setAttribute('data-dir','next');
      frag.appendChild(a);
    }

    pager.appendChild(frag);
    pager.hidden = false;
  });
})();

// Floating mini-pager (mobile)
(function(){
  const pager = document.getElementById('section-pager');
  if (!pager) return;
  const mini = pager.cloneNode(true);
  mini.id = 'mini-pager';
  mini.classList.add('mini-pager');
  mini.hidden = true;
  document.body.appendChild(mini);

  let visible = false;
  const toggle = () => {
    const y = window.scrollY;
    const shouldShow = y > 400;
    if (shouldShow !== visible) {
      visible = shouldShow;
      mini.hidden = !shouldShow;
    }
  };
  window.addEventListener('scroll', toggle);
})();
