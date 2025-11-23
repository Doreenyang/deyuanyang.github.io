# Chat Widget with OpenAI Integration

## Setup Instructions

### 1. Get OpenAI API Key
- Go to https://platform.openai.com/api-keys
- Create a new API key
- Copy the key (starts with `sk-...`)

### 2. Deploy Options

#### Option A: Deploy to Vercel (Recommended)
1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel`
3. Add environment variable in Vercel dashboard:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
4. Your API endpoint will be: `https://your-site.vercel.app/api/chat`

#### Option B: Deploy to Netlify
1. Create `netlify.toml`:
```toml
[build]
  functions = "api"

[functions]
  node_bundler = "esbuild"
```
2. Add environment variable in Netlify dashboard:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
3. Deploy via Netlify CLI or GitHub integration

#### Option C: Local Testing
1. Install dependencies: `npm install openai`
2. Create `.env` file: `OPENAI_API_KEY=your-key-here`
3. Run: `node api/chat.js`
4. Test at: `http://localhost:3000/api/chat`

### 3. Update Frontend
In `assets/chat.js`, change:
```javascript
const MOCK_MODE = false; // Enable real API
const API_PATH = '/api/chat'; // Or your deployed URL
```

### 4. Test the Chat
- Open your site
- Click the chat button (💬)
- Ask questions about your background!

## Cost Estimates (OpenAI)
- Using `gpt-4o-mini`: ~$0.0001 per message (very cheap!)
- Using `gpt-4`: ~$0.01 per message
- 1000 conversations ≈ $0.10-$10 depending on model

## Security Notes
- Never commit your API key to Git
- Always use environment variables
- Consider adding rate limiting for production
- Monitor usage in OpenAI dashboard

## Customize
Edit `api/personal-context.json` to update your information!
