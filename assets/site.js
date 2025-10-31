document.addEventListener('DOMContentLoaded', () => {
  /* ------------------------
     Theme toggle
  -------------------------*/
  const toggle = document.getElementById('themeToggle');
  const current = localStorage.getItem('theme');
  if (current === 'dark') document.documentElement.setAttribute('data-theme','dark');

  toggle?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme')==='dark';
    document.documentElement.setAttribute('data-theme', isDark?'':'dark');
    localStorage.setItem('theme', isDark?'light':'dark');
  });

  /* ------------------------
     Back to top button
  -------------------------*/
  const backTop = document.getElementById('backTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) backTop.classList.add('show');
    else backTop.classList.remove('show');
  });

  /* ------------------------
     Toggle sections dropdown (home)
  -------------------------*/
  const toggleBtn = document.getElementById('toggleSections');
  const listDiv = document.getElementById('sectionsList');
  if (toggleBtn && listDiv) {
    toggleBtn.addEventListener('click', async () => {
      listDiv.style.display = listDiv.style.display==='none'?'block':'none';
      if (!listDiv.dataset.loaded) {
        try {
          const res = await fetch('/sections.json',{cache:'no-store'});
          const sections = await res.json();
          listDiv.innerHTML = '<ul>' + sections.map(s=>`<li><a href="${s.url}">${s.title}</a></li>`).join('') + '</ul>';
          listDiv.dataset.loaded = '1';
        } catch { listDiv.textContent='Unable to load sections.'; }
      }
    });
  }

  /* ------------------------
     Search functionality
  -------------------------*/
  const searchBox = document.getElementById('searchBox');
  const results = document.getElementById('searchResults');
  let searchIndex = [];

  async function loadSearch() {
    try {
      const res = await fetch('/search.json',{cache:'no-store'});
      searchIndex = await res.json();
    } catch(e){ console.error(e); }
  }
  if (searchBox) loadSearch();

  searchBox?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { results.hidden = true; return; }
    const matches = searchIndex.filter(i=>i.text.toLowerCase().includes(q));
    results.innerHTML = matches.slice(0,10).map(m=>`<a href="${m.url}">${m.title}</a>`).join('');
    results.hidden = matches.length===0;
  });
  searchBox?.addEventListener('blur', ()=> setTimeout(()=>results.hidden=true,150));

  /* ------------------------
     Header sections dropdown (bill-text page)
  -------------------------*/
  const headerSlot = document.getElementById('headerSections');
  if (headerSlot) {
    (async()=>{
      try{
        const res=await fetch('/sections.json',{cache:'no-store'});
        const list=await res.json();
        if(Array.isArray(list)&&list.length){
          const sel=document.createElement('select');
          sel.innerHTML=list.map(s=>`<option value="${s.url}">${s.title}</option>`).join('');
          const cur=location.pathname.replace(/\/index\.html$/,'');
          const found=list.find(s=>s.url===cur);
          if(found) sel.value=found.url;
          sel.addEventListener('change',()=>window.location.href=sel.value);
          headerSlot.appendChild(sel);
        }
      }catch{}
    })();
  }

  /* ------------------------
     Section nav (Prev/Next/Jump)
  -------------------------*/
  const sectionNav = document.querySelector('.section-nav');
  if (sectionNav) {
    (async()=>{
      try{
        const res=await fetch('/sections.json',{cache:'no-store'});
        const list=await res.json();
        const sel=document.getElementById('secJump');
        const prev=document.getElementById('prevSec');
        const next=document.getElementById('nextSec');
        const cur=location.pathname.replace(/\/index\.html$/,'');
        if(Array.isArray(list)&&list.length){
          sel.innerHTML=list.map(s=>`<option value="${s.url}" ${s.url===cur?'selected':''}>${s.title}</option>`).join('');
          const i=Math.max(0,list.findIndex(s=>s.url===cur));
          if(i>0){prev.hidden=false;prev.href=list[i-1].url;}
          if(i<list.length-1){next.hidden=false;next.href=list[i+1].url;}
          sel.addEventListener('change',()=>window.location.href=sel.value);
        }
      }catch{}
    })();
  }
});