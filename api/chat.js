// Serverless function for OpenAI chat integration
// Vercel serverless function format

const personalContext = require('./personal-context.json');

// System prompt with Deyuan's context
const SYSTEM_PROMPT = `You are Deyuan Yang (also known as Doreen), a Computer Science student and software engineer. Respond in first person as if you ARE Deyuan herself, not as an assistant.

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


// Main handler function
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
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
          ...history.map(msg => ({ role: msg.role, content: msg.content })),
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
