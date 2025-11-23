// Simple chat widget with mock fallback and serverless API hook
(function(){
  const ROOT_ID = 'chat-root';
  const API_PATH = '/api/chat'; // expected serverless endpoint (example provided)
  const MOCK_MODE = false; // set to false to call real API if available

  function qs(sel, root=document){ return root.querySelector(sel) }

  function el(tag, attrs={}, children=[]){
    const e = document.createElement(tag);
    for(const k in attrs){
      if(k === 'class') e.className = attrs[k]; else if(k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach(c=>{
      if(typeof c === 'string') e.appendChild(document.createTextNode(c)); else if(c) e.appendChild(c);
    });
    return e;
  }

  function buildUI(){
    const root = document.getElementById(ROOT_ID);
    if(!root) return;

    // launcher button (always visible)
    const launcher = el('button',{class:'chat-launcher',title:'Chat with Doreen', onclick:togglePanel,'aria-label':'Open chat','aria-expanded':'false'}, ['💬']);
    root.appendChild(launcher);

    // panel (starts hidden)
    const panel = el('div',{class:'chat-panel',hidden:'true','aria-hidden':'true'});
    const header = el('div',{class:'chat-header'}, [ 
      el('div',{class:'chat-title'}, [
        el('strong',{}, ['Doreen Yang']),
        el('span',{class:'chat-subtitle'}, [' • Ask me anything!'])
      ]) , 
      el('button',{class:'chat-close',onclick:closePanel,title:'Close chat','aria-label':'Close chat'}, ['✕']) 
    ]);
    const messages = el('div',{class:'chat-messages',id:'chat-messages'}, [ 
      el('div',{class:'chat-empty'}, ['👋 Hi! I\'m Doreen (Deyuan) Yang, a CS student at WashU. Ask me about my projects, skills, or experience!']) 
    ]);
    const inputRow = el('div',{class:'chat-input'}, [ 
      el('input',{id:'chat-input',placeholder:'Ask about projects, skills, experience...','aria-label':'Chat message'}), 
      el('button',{id:'chat-send',onclick:onSend,'aria-label':'Send message'}, ['Send']) 
    ]);

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(inputRow);
    root.appendChild(panel);
  }

  function togglePanel(){
    const panel = qs('.chat-panel');
    const launcher = qs('.chat-launcher');
    if(!panel || !launcher) return;
    const hidden = panel.hasAttribute('hidden');
    if(hidden) {
      openPanel();
    } else {
      closePanel();
    }
  }
  
  function openPanel(){ 
    const panel = qs('.chat-panel');
    const launcher = qs('.chat-launcher');
    const input = qs('#chat-input');
    if(panel){ 
      panel.removeAttribute('hidden');
      panel.setAttribute('aria-hidden', 'false');
      if(launcher) launcher.setAttribute('aria-expanded', 'true');
      const msgs = qs('.chat-messages');
      if(msgs) msgs.scrollTop = msgs.scrollHeight;
      // Focus input for accessibility
      setTimeout(() => input?.focus(), 100);
    }
  }
  
  function closePanel(){ 
    const panel = qs('.chat-panel');
    const launcher = qs('.chat-launcher');
    if(panel) {
      panel.setAttribute('hidden','true');
      panel.setAttribute('aria-hidden', 'true');
      if(launcher) {
        launcher.setAttribute('aria-expanded', 'false');
        launcher.focus(); // Return focus to launcher
      }
    }
  }

  function appendMessage(text, who='bot'){
    const container = qs('.chat-messages');
    if(!container) return;
    // remove placeholder
    const ph = container.querySelector('.chat-empty'); if(ph) ph.remove();
    const msg = el('div',{class:'chat-msg '+(who==='user' ? 'user' : 'bot')}, [ text ]);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  // Simple canned mock responses for offline demo
  function mockReply(input){
    const l = input.toLowerCase();
    if(/resume|cv|experience|background/.test(l)) return "I'm currently pursuing my B.S. in Computer Science at Washington University in St. Louis (GPA: 3.9/4.0). You can check out my CS resume at /resume_cs.html or my full resume at /resume_full.html. I focus on backend systems, analytics, and ML tooling.";
    if(/sendback/.test(l)) return "Sendback is one of my favorite projects! I built event pipelines handling 10k+ events, integrated AWS services, and designed A/B testing frameworks. I worked with FastAPI, PostgreSQL, and React.";
    if(/sustain|plate/.test(l)) return "For Sustain-a-Plate, I built an interactive dashboard and optimized backend performance, increasing user engagement by 31%. I used React, Node.js, and PostgreSQL.";
    if(/lstm|forecasting|time.?series/.test(l)) return "My LSTM Time-Series Analyzer is a production-grade training pipeline with diagnostics and visualizations for multivariate forecasting. I built it with PyTorch and included comprehensive evaluation metrics.";
    if(/ecotag/.test(l)) return "EcoTag was a sustainability product scanner that made it to semi-finals at WashU Skandalaris Venture Competition. It helps users make eco-conscious purchasing decisions.";
    if(/project/.test(l)) return "I've worked on several projects: Sendback (analytics pipelines), Sustain-a-Plate (dashboard), an LSTM forecasting pipeline, and EcoTag (sustainability scanner). Which one interests you?";
    if(/hello|hi|hey/.test(l)) return "Hi there! 👋 I'm Doreen (Deyuan) Yang. I'm a CS student at WashU who loves building scalable systems. What would you like to know about my work?";
    if(/skills?|tools?|tech|stack|languages?/.test(l)) return "I work with Python, JavaScript/TypeScript, C++, and SQL. My go-to frameworks are FastAPI, React, Node.js, and PyTorch. I specialize in backend systems, analytics pipelines, and ML tooling.";
    if(/contact|email|reach/.test(l)) return "You can reach me at doreenyang02@gmail.com or connect on LinkedIn: linkedin.com/in/deyuan-yang-ba7680222/";
    if(/education|school|university|washu/.test(l)) return "I'm pursuing a B.S. in Computer Science at Washington University in St. Louis with a 3.9/4.0 GPA, graduating May 2026.";
    return "That's a great question! Feel free to check out my resume or email me at doreenyang02@gmail.com. Is there something specific about my projects, skills, or experience I can help with?";
  }

  async function sendToApi(message){
    try{
      const resp = await fetch(API_PATH, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});
      if(!resp.ok) throw new Error('Non-OK response');
      const data = await resp.json();
      return data.reply || 'No reply';
    }catch(err){
      console.warn('API chat failed',err);
      return null;
    }
  }

  async function onSend(){
    const input = qs('#chat-input');
    if(!input) return;
    const val = input.value.trim(); if(!val) return;
    appendMessage(val,'user'); 
    input.value='';
    input.disabled = true;

    // Show typing indicator
    const typingMsg = el('div',{class:'chat-msg bot typing'}, [
      el('span',{class:'typing-dot'}),
      el('span',{class:'typing-dot'}),
      el('span',{class:'typing-dot'})
    ]);
    const container = qs('.chat-messages');
    container.appendChild(typingMsg);
    container.scrollTop = container.scrollHeight;

    let reply = null;
    if(!MOCK_MODE){ 
      reply = await sendToApi(val); 
    }
    if(!reply) reply = mockReply(val);

    // Remove typing indicator
    typingMsg.remove();
    appendMessage(reply,'bot');
    input.disabled = false;
    input.focus();
  }

  // init
  document.addEventListener('DOMContentLoaded', ()=>{
    // create root if doesn't exist
    if(!document.getElementById(ROOT_ID)){
      const r = document.createElement('div'); r.id = ROOT_ID; document.body.appendChild(r);
    }
    buildUI();
    
    // Add attention-grabbing effects to chat button
    setTimeout(() => {
      const launcher = qs('.chat-launcher');
      if(launcher) {
        launcher.classList.add('pulse-attention');
        // Remove pulse after a few cycles, keep subtle pulse
        setTimeout(() => launcher.classList.remove('pulse-attention'), 5000);
      }
    }, 1500);
    
    // wire enter key
    document.addEventListener('keydown', e=>{
      if(e.key === 'Enter' && document.activeElement && document.activeElement.id === 'chat-input'){
        onSend();
      }
    });
  });
})();
