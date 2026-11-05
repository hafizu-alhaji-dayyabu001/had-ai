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

    const defaultPrompt = "You are HAD AI, a helpful assistant.";
    const activePrompt = systemInstruction || defaultPrompt;
    
    // Triple-model fallback pipeline to bypass high demand spikes
    const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite'];
    let lastErrorDetails = null;

    for (const model of models) {
      const payload = {
        contents,
        systemInstruction: { parts: [{ text: activePrompt }] }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      if (response.ok) return res.status(200).json(data);

      lastErrorDetails = data.error?.message || JSON.stringify(data);
    }

    return res.status(500).json({ error: `Gemini API Error: ${lastErrorDetails}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
