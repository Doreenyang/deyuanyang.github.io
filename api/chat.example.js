// Example Node.js serverless handler for /api/chat
// This is an example for Netlify Functions, Vercel Serverless Functions, or any small Express handler.
// IMPORTANT: Do NOT expose your API key in client-side code. Store it in server environment variables.

const fetch = require('node-fetch'); // in serverless you may use native fetch

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).send({error:'Method not allowed'});
  const { message } = req.body || {};
  if (!message) return res.status(400).send({error:'Missing message'});

  // Example using OpenAI Chat Completions (replace with your provider)
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if(!OPENAI_KEY) return res.status(500).send({error:'Server not configured with OPENAI_API_KEY'});

  try{
    const payload = {
      model: 'gpt-4o-mini', // replace with desired model available to you
      messages: [ { role: 'system', content: 'You are an assistant for Doreen Yang. Answer briefly and point to resume pages.' }, { role: 'user', content: message } ],
      max_tokens: 400,
      temperature: 0.2
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify(payload)
    });

    if(!r.ok){
      const text = await r.text();
      console.error('Upstream error', text);
      return res.status(502).send({ error: 'Upstream API error' });
    }

    const data = await r.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return res.json({ reply: reply || 'Sorry, no reply available' });
  }catch(err){
    console.error(err);
    return res.status(500).send({error:'Internal server error'});
  }
};
