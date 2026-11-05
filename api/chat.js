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
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing in Vercel.' });
    }

    const defaultInternalPrompt = `You are HAD AI Pro Companion, an advanced multi-modal AI assistant powered by Gemini, ChatGPT, and Claude capabilities. Always output web app code inside complete \`\`\`html blocks so the Canvas preview engine can execute it automatically. Maintain concise, structured Markdown responses.`;

    const activePrompt = systemInstruction || defaultInternalPrompt;
    
    // Updated to the latest stable Gemini API models
    const models = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
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
