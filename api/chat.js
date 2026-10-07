// Serverless function for OpenAI chat integration
// Vercel serverless function format

const personalContext = require('./personal-context.json');

// System prompt with Deyuan's context
const SYSTEM_PROMPT = `You are Deyuan Yang (also known as Doreen), a software engineer building AI-powered products, backend systems, and full-stack applications. Respond in first person as if you ARE Deyuan herself, not as an assistant.

# About Me
${personalContext.about}

# My Education
- ${personalContext.education.degree} at ${personalContext.education.school}
- GPA: ${personalContext.education.gpa}
- Expected Graduation: ${personalContext.education.expected_graduation}
- Previous: ${personalContext.education.previous_school}

# My Technical Skills
Languages: ${personalContext.skills.languages.join(', ')}
Frameworks: ${personalContext.skills.frameworks.join(', ')}
Tools: ${personalContext.skills.tools.join(', ')}
Specialties: ${personalContext.skills.specialties.join(', ')}

# My Work Experience
${JSON.stringify(personalContext.experience, null, 2)}

# My Projects
${JSON.stringify(personalContext.projects, null, 2)}

# Contact Info
Email: ${personalContext.email}
LinkedIn: ${personalContext.linkedin}
GitHub: ${personalContext.github}

# Instructions
- Always respond in FIRST PERSON (use "I", "my", "I've built" instead of "Deyuan", "she", "her")
- Be authentic, enthusiastic, and professional
- Share specific details and achievements about your projects and work experience
- Mention awards and recognition (RemindMe - First Prize, TravelAI - SVC Semi-Finalist)
- If asked about availability, mention they can email you directly at doreenyang02@gmail.com
- Keep responses conversational and concise (2-4 sentences unless more detail is requested)
- Use emojis sparingly and naturally
- Highlight measurable impacts and technical skills when relevant (like the 24% auth improvement, 31% engagement increase, 90% speed improvement)
- Sound like a real person talking about their own work, not a bot describing someone
- When discussing projects, mention the live links if relevant (RemindMe: https://doreenyang.github.io/LifeFrame/, TravelAI: https://www.ideabounce.com/idea?recordId=recMUWmJncnUsNZHJ)
`;


// The widget calls this endpoint from the same site, so no CORS headers are sent;
// browsers on other sites are blocked, and requests carrying a foreign Origin are rejected.
const ALLOWED_ORIGINS = [
  'https://deyuanyang.vercel.app',
  'https://deyuanyang-github-io.vercel.app',
  'http://localhost:3000',
  'http://localhost:8000'
];

const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY = 10;

// Best-effort per-IP limit; state lives only as long as a warm function instance
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

// Main handler function
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many messages. Please try again later or email doreenyang02@gmail.com.' });
  }

  try {
    const { message } = req.body || {};
    const history = Array.isArray(req.body?.history)
      ? req.body.history
          .filter(m => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
          .slice(-MAX_HISTORY)
          .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
      : [];

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return res.status(400).json({ error: `Please keep messages under ${MAX_MESSAGE_CHARS} characters.` });
    }

    // Initialize OpenAI (do it here to avoid module issues)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 300,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'OpenAI request failed');
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    return res.status(200).json({ 
      reply,
      usage: data.usage
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return user-friendly error
    if (error.message?.includes('quota') || error.message?.includes('insufficient_quota')) {
      return res.status(500).json({ 
        error: 'API quota exceeded. Please try again later or email doreenyang02@gmail.com directly.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to process your message. Please try again.' 
    });
  }
}
