# deyuanyang.github.io

Deyuan's personal website
Quick preview
-------------

To preview locally (simple):
1. Use an HTTP server from the repository root. For example, with Python 3:

```cmd
cd %USERPROFILE%\Documents\GitHub\deyuanyang.github.io
python -m http.server 8000

:: then open http://localhost:8000 in your browser
Deployment (GitHub Pages)
-------------------------

1. Push this `main` branch to GitHub.
Notes
-----
- The site loads `resume.md` and `resume_full_version.md` at runtime and renders them using a client-side markdown renderer.
- If you want the resume rendered into static HTML instead, I can convert and inline them.

Chatbot (demo & real integration)
--------------------------------

A simple chat widget is included as a demo. By default it runs in a mock mode (no API key required) and responds with canned answers.

Files added:

- `assets/chat.js` — frontend chat widget (launcher, panel, mock fallback). Set `MOCK_MODE = false` in this file to attempt calling a real API endpoint.
- `api/chat.example.js` — example serverless handler showing how to securely proxy requests to an LLM provider (OpenAI). This is an example only and should be deployed server-side.

To enable a real LLM-backed chatbot (recommended secure flow):

1. Deploy a serverless function on your hosting platform (Netlify Functions, Vercel Serverless, Azure Functions, etc.). Copy or adapt `api/chat.example.js` and place it in your functions/api folder as required by the platform.
2. Set your provider API key in the server environment variables (e.g. `OPENAI_API_KEY`). Do NOT put the key in client-side code.
3. Update the example handler's model and endpoint to match your provider and any required parameters.
4. Ensure the function is reachable at `/api/chat` (or change `API_PATH` in `assets/chat.js` to match your endpoint).

Quick local test (no server required):

1. Start the local static server:

```cmd
python -m http.server 8000
```

2. Open `http://localhost:8000` and click the chat launcher (bottom-right). The widget will run in mock mode and answer common questions about the resume and projects.

Security note: Never embed provider API keys in client-side JavaScript. Always proxy LLM calls through a server-side function that stores secrets in environment variables.

If you want, I can:
- Wire the frontend to call your deployed `/api/chat` endpoint and add streaming/typing UX.
- Convert the example serverless function to a specific platform format (Netlify, Vercel, Azure) and test it locally.

````
# deyuanyang.github.io

Deyuan's personal website

Quick preview
-------------

To preview locally (simple):

1. Use an HTTP server from the repository root. For example, with Python 3:

```cmd
cd %USERPROFILE%\Documents\GitHub\deyuanyang.github.io
python -m http.server 8000

:: then open http://localhost:8000 in your browser
```

Deployment (GitHub Pages)
-------------------------

1. Push this `main` branch to GitHub.
2. In the repository Settings -> Pages, set the source to `main` branch and the root folder.
3. Save; your site will be available at `https://<your-username>.github.io/deyuanyang.github.io/`.

Notes
-----
- The site loads `resume.md` and `resume_full_version.md` at runtime and renders them using a client-side markdown renderer.
- If you want the resume rendered into static HTML instead, I can convert and inline them.
