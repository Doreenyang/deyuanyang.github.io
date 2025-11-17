// Main site JS: theme toggle, resume markdown loader, small UI helpers
(function(){
  function qs(sel){return document.querySelector(sel)}

  // Theme (unified stored key: 'site-theme')
  const storedSiteTheme = localStorage.getItem('site-theme');
  if(storedSiteTheme) document.documentElement.classList.add(storedSiteTheme);
  // optional toggle
  const themeToggle = qs('#themeToggle');
  if(themeToggle){
    themeToggle.checked = storedTheme === 'dark';
    themeToggle.addEventListener('change', e=>{
      if(e.target.checked){
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme','dark')
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme','light')
      }
    })
  }

  // Resume loader for resume.html
  function loadResume(){
    const container = qs('#resume-content');
    if(!container) return;
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'cs';
    const mdFile = (type === 'full') ? 'resume_full_version.md' : 'resume.md';
    fetch(mdFile).then(r=>{
      if(!r.ok) throw new Error('Failed to fetch');
      return r.text();
    }).then(markdown=>{
      // render
      if(window.marked){
        container.innerHTML = marked.parse(markdown);
      } else {
        container.textContent = markdown;
      }
      if(window.hljs) hljs.highlightAll();
      const downloadBtn = qs('#download-btn');
      if(downloadBtn){
        downloadBtn.href = mdFile;
        downloadBtn.setAttribute('download','');
      }
    }).catch(err=>{
      container.textContent = 'Could not load resume.';
      console.error(err);
    })
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    loadResume();

    // Animated reveals using IntersectionObserver (respecting reduced motion)
    try {
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!prefersReduced && 'IntersectionObserver' in window){
        const els = document.querySelectorAll('.hero-text, .hero-card, .section, .project, .card-inner, .resume-container, .resume-static');
        const io = new IntersectionObserver((entries, obs)=>{
          entries.forEach(e=>{
            if(e.isIntersecting){
              e.target.classList.add('reveal','show');
              obs.unobserve(e.target);
            }
          })
        }, {threshold: 0.12});
        els.forEach(el=>{
          // ensure starting state
          el.classList.add('reveal');
          io.observe(el);
        });

        // small initial hero pulse for CTAs
        const ctas = document.querySelectorAll('.cta');
        if(ctas.length) ctas[0].classList.add('pulse');
      }
    } catch (err){ console.warn('Animation init failed', err) }
  });
})();

/* Creative UI: typewriter, palette chooser, and tilt on project cards */
(function(){
  // Typewriter simple loop
  const phrases = ['build scalable analytics.', 'design delightful UX.', 'ship reliable backend systems.', 'experiment with ML models.'];
  let pIndex = 0, cIndex = 0, typing = true;
  const el = document.getElementById('typewriter');
  function tick(){
    if(!el) return;
    const current = phrases[pIndex];
    if(typing){
      el.textContent = current.slice(0, cIndex+1);
      cIndex++;
      if(cIndex === current.length){ typing = false; setTimeout(tick, 1200); return }
    } else {
      el.textContent = current.slice(0, cIndex-1);
      cIndex--;
      if(cIndex === 0){ typing = true; pIndex = (pIndex+1) % phrases.length }
    }
    setTimeout(tick, typing ? 60 : 36);
  }
  document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(tick,400) });

  // Palette chooser
  document.addEventListener('DOMContentLoaded', ()=>{
    const paletteBtn = document.getElementById('paletteBtn');
    const paletteMenu = document.getElementById('paletteMenu');
    if(!paletteBtn || !paletteMenu) return;

    paletteBtn.addEventListener('click', ()=>{ paletteMenu.hidden = !paletteMenu.hidden; });

    // click a palette option
    paletteMenu.addEventListener('click', e=>{
      const opt = e.target.closest('[data-theme]');
      if(!opt) return;
      const theme = opt.getAttribute('data-theme') || '';

      // clear known theme classes then apply selected
      document.documentElement.classList.remove('theme-alt','theme-vivid');
      if(theme) document.documentElement.classList.add(theme);

      // persist (empty string means default/dark)
      localStorage.setItem('site-theme', theme);
      paletteMenu.hidden = true;

      // update active state for buttons
      Array.from(paletteMenu.querySelectorAll('[data-theme]')).forEach(b=> b.setAttribute('aria-pressed', b === opt ? 'true' : 'false'));
    });

    // restore active from storage
    const saved = localStorage.getItem('site-theme') || '';
    if(saved) document.documentElement.classList.add(saved);
    const initial = paletteMenu.querySelector(`[data-theme="${saved}"]`) || paletteMenu.querySelector('[data-theme=""]');
    if(initial) initial.setAttribute('aria-pressed','true');
  });

  // project tilt handlers
  const projects = document.querySelectorAll('.project');
  projects.forEach(p=>{
    const inner = document.createElement('div');
    inner.className = 'project-inner';
    while(p.firstChild) inner.appendChild(p.firstChild);
    p.appendChild(inner);
    p.addEventListener('mousemove', e=>{
      const rect = p.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      inner.style.transform = `rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*8).toFixed(2)}deg) translateZ(6px)`;
    });
    p.addEventListener('mouseleave', ()=>{ inner.style.transform = '' });
  });
})();


