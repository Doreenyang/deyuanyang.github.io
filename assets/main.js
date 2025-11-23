// Main site JS: theme toggle, resume markdown loader, small UI helpers
(function(){
  function qs(sel){return document.querySelector(sel)}

  // Theme (unified stored key: 'site-theme')
  const storedSiteTheme = localStorage.getItem('site-theme');
  if(storedSiteTheme) document.documentElement.classList.add(storedSiteTheme);
  // optional toggle
  const themeToggle = qs('#themeToggle');
  if(themeToggle){
    themeToggle.checked = storedSiteTheme === 'dark';
    themeToggle.addEventListener('change', e=>{
      if(e.target.checked){
        document.documentElement.classList.add('dark');
        localStorage.setItem('site-theme','dark')
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('site-theme','light')
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
    
    // Show loading state
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = '<p class="loading">Loading resume...</p>';
    
    fetch(mdFile).then(r=>{
      if(!r.ok) throw new Error(`Failed to fetch ${mdFile}: ${r.status}`);
      return r.text();
    }).then(markdown=>{
      // render
      if(window.marked){
        container.innerHTML = marked.parse(markdown);
      } else {
        container.textContent = markdown;
      }
      container.removeAttribute('aria-busy');
      if(window.hljs) {
        try { hljs.highlightAll(); } catch(e) { console.warn('Highlight failed', e); }
      }
      const downloadBtn = qs('#download-btn');
      if(downloadBtn){
        downloadBtn.href = mdFile;
        downloadBtn.setAttribute('download', `resume_${type}.md`);
      }
    }).catch(err=>{
      container.innerHTML = '<p class="error">Could not load resume. Please try again later.</p>';
      container.removeAttribute('aria-busy');
      console.error('Resume load error:', err);
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
        }, {threshold: 0.12, rootMargin: '50px'});
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
  // Typewriter simple loop with cleanup
  const phrases = ['build scalable analytics.', 'design delightful UX.', 'ship reliable backend systems.', 'experiment with ML models.'];
  let pIndex = 0, cIndex = 0, typing = true, timeoutId = null;
  const el = document.getElementById('typewriter');
  function tick(){
    if(!el || !document.body.contains(el)) {
      if(timeoutId) clearTimeout(timeoutId);
      return;
    }
    const current = phrases[pIndex];
    if(typing){
      el.textContent = current.slice(0, cIndex+1);
      cIndex++;
      if(cIndex === current.length){ typing = false; timeoutId = setTimeout(tick, 1200); return }
    } else {
      el.textContent = current.slice(0, cIndex-1);
      cIndex--;
      if(cIndex === 0){ typing = true; pIndex = (pIndex+1) % phrases.length }
    }
    timeoutId = setTimeout(tick, typing ? 60 : 36);
  }
  document.addEventListener('DOMContentLoaded', ()=>{ if(el) timeoutId = setTimeout(tick,400) });

  // Palette chooser with keyboard navigation
  document.addEventListener('DOMContentLoaded', ()=>{
    const paletteBtn = document.getElementById('paletteBtn');
    const paletteMenu = document.getElementById('paletteMenu');
    if(!paletteBtn || !paletteMenu) return;

    function closeMenu(){
      paletteMenu.hidden = true;
      paletteBtn.setAttribute('aria-expanded', 'false');
    }

    function openMenu(){
      paletteMenu.hidden = false;
      paletteBtn.setAttribute('aria-expanded', 'true');
      paletteMenu.querySelector('[data-theme]')?.focus();
    }

    paletteBtn.addEventListener('click', ()=>{ 
      paletteMenu.hidden ? openMenu() : closeMenu();
    });

    // Escape key to close
    paletteMenu.addEventListener('keydown', e=>{
      if(e.key === 'Escape'){
        closeMenu();
        paletteBtn.focus();
      }
    });

    // Click outside to close
    document.addEventListener('click', e=>{
      if(!paletteBtn.contains(e.target) && !paletteMenu.contains(e.target)){
        closeMenu();
      }
    });

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
      closeMenu();

      // update active state for buttons
      Array.from(paletteMenu.querySelectorAll('[data-theme]')).forEach(b=> b.setAttribute('aria-pressed', b === opt ? 'true' : 'false'));
    });

    // restore active from storage
    const saved = localStorage.getItem('site-theme') || '';
    if(saved) document.documentElement.classList.add(saved);
    const initial = paletteMenu.querySelector(`[data-theme="${saved}"]`) || paletteMenu.querySelector('[data-theme=""]');
    if(initial) initial.setAttribute('aria-pressed','true');
  });

  // project tilt handlers (optimized with RAF)
  const projects = document.querySelectorAll('.project');
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if(!prefersReduced){
    projects.forEach(p=>{
      const inner = document.createElement('div');
      inner.className = 'project-inner';
      while(p.firstChild) inner.appendChild(p.firstChild);
      p.appendChild(inner);
      
      let rafId = null;
      p.addEventListener('mousemove', e=>{
        if(rafId) return;
        rafId = requestAnimationFrame(()=>{
          const rect = p.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          inner.style.transform = `rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*8).toFixed(2)}deg) translateZ(6px)`;
          rafId = null;
        });
      });
      p.addEventListener('mouseleave', ()=>{ 
        if(rafId) cancelAnimationFrame(rafId);
        inner.style.transform = '';
      });
    });
  }
})();


