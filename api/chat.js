export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { contents, systemInstruction } = req.body;
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is missing in Vercel.' });
    }

    const activePrompt = systemInstruction || "You are HAD AI, a fast personal assistant.";
    
    // Using official Google Gemini model identifiers
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastErrorDetails = null;

    for (const model of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: activePrompt }] }
          })
        });

        const data = await response.json();
        if (response.ok && data.candidates) {
          return res.status(200).json(data);
        }

        lastErrorDetails = data.error?.message || JSON.stringify(data);
      } catch (err) {
        lastErrorDetails = err.message;
      }
    }

    return res.status(500).json({ error: `API Model Error: ${lastErrorDetails}` });
  } catch (err) {
    return res.status(500).json({ error: 'Server Exception: ' + err.message });
  }
}
