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
      return res.status(400).json({ error: 'GEMINI_API_KEY is missing in Vercel Environment Variables.' });
    }

    const activePrompt = systemInstruction || "You are HAD AI, a fast personal assistant.";
    const model = 'gemini-1.5-flash';
    const payload = {
      contents,
      systemInstruction: { parts: [{ text: activePrompt }] }
    };

    // Attach headers compatible with both AQ... and standard API key formats
    const headers = { 
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
      'Authorization': `Bearer ${apiKey}`
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ error: `Raw Response Error: ${responseText.substring(0, 150)}` });
    }

    if (!response.ok) {
      const errMsg = data.error?.message || data.error?.status || JSON.stringify(data);
      return res.status(response.status).json({ error: `Google API (${response.status}): ${errMsg}` });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server Exception: ' + err.message });
  }
}
