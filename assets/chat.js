// Simple chat widget with mock fallback and serverless API hook
(function(){
  const ROOT_ID = 'chat-root';
  const API_PATH = '/api/chat'; // expected serverless endpoint (example provided)
  const MOCK_MODE = true; // set to false to call real API if available

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

    // launcher
    const launcher = el('button',{class:'chat-launcher',title:'Chat with me', onclick:togglePanel}, ['💬']);
    root.appendChild(launcher);

    // panel
    const panel = el('div',{class:'chat-panel',hidden:'true'});
    const header = el('div',{class:'chat-header'}, [ el('div',{}, ['Chat with Doreen']) , el('button',{onclick:closePanel,title:'Close'}, ['✕']) ]);
    const messages = el('div',{class:'chat-messages',id:'chat-messages'}, [ el('div',{class:'chat-empty'}, 'Ask me about my work, projects, or resume.') ] );
    const inputRow = el('div',{class:'chat-input'}, [ el('input',{id:'chat-input',placeholder:'Say hi — e.g. "Tell me about Sendback"'}), el('button',{id:'chat-send',onclick:onSend}, ['Send']) ]);

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(inputRow);
    root.appendChild(panel);
  }

  function togglePanel(){
    const panel = qs('.chat-panel');
    if(!panel) return;
    const hidden = panel.hasAttribute('hidden');
    if(hidden) openPanel(); else closePanel();
  }
  function openPanel(){ const panel = qs('.chat-panel'); if(panel){ panel.removeAttribute('hidden'); qs('.chat-messages').scrollTop = qs('.chat-messages').scrollHeight } }
  function closePanel(){ const panel = qs('.chat-panel'); if(panel) panel.setAttribute('hidden','true') }

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
    if(/resume|cv|experience/.test(l)) return "You can view my CS resume at /resume_cs.html and my full resume at /resume_full.html. I focus on backend systems, analytics, and ML tooling.";
    if(/sendback|sustain|project|lstm|ecotag/.test(l)) return "I worked on Sendback (analytics pipelines), Sustain-a-Plate (dashboard), and an LSTM forecasting pipeline. Ask me which project you want details about.";
    if(/hello|hi|hey/.test(l)) return "Hi — I'm Doreen's assistant. Ask about projects, tools, or my experience.";
    if(/skills|tools|languages/.test(l)) return "Languages: Python, JavaScript/TypeScript, C++. Tools: FastAPI, React, PostgreSQL, AWS, Docker.";
    return "Sorry — I don't have a detailed answer for that yet. You can email doreenyang02@gmail.com for more.";
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
    appendMessage(val,'user'); input.value='';

    // optimistic bot typing
    appendMessage('…','bot');
    const placeholder = qs('.chat-messages .chat-msg.bot:last-child');

    let reply = null;
    if(!MOCK_MODE){ reply = await sendToApi(val); }
    if(!reply) reply = mockReply(val);

    // replace placeholder
    if(placeholder) placeholder.textContent = reply;
    else appendMessage(reply,'bot');
  }

  // init
  document.addEventListener('DOMContentLoaded', ()=>{
    // create root if doesn't exist
    if(!document.getElementById(ROOT_ID)){
      const r = document.createElement('div'); r.id = ROOT_ID; document.body.appendChild(r);
    }
    buildUI();
    // wire enter key
    document.addEventListener('keydown', e=>{
      if(e.key === 'Enter' && document.activeElement && document.activeElement.id === 'chat-input'){
        onSend();
      }
    });
  });
})();
