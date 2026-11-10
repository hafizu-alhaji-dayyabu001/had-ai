export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { contents, systemInstruction } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel.' });
    }

    const activePrompt = systemInstruction || "You are HAD AI, a fast personal assistant.";
    
    // Using the REAL, active Gemini models 
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastErrorDetails = null;

    for (const model of models) {
      try {
        // 8.5 second timeout to prevent Vercel from crashing the app
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8500);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              systemInstruction: { parts: [{ text: activePrompt }] }
            }),
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        const data = await response.json();
        if (response.ok) return res.status(200).json(data);

        lastErrorDetails = data.error?.message || JSON.stringify(data);
      } catch (fetchErr) {
        lastErrorDetails = fetchErr.message;
      }
    }

    return res.status(500).json({ error: `API Error: ${lastErrorDetails}` });
  } catch (err) {
    return res.status(500).json({ error: 'Server Exception: ' + err.message });
  }
}
