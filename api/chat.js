const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']; // check current names
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN; // e.g. https://your-app.vercel.app

export default async function handler(req, res) {
  if (ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel settings.' });

  const { contents, systemInstruction } = req.body || {};
  if (!Array.isArray(contents) || contents.length === 0) {
    return res.status(400).json({ error: 'contents must be a non-empty array.' });
  }

  const payload = { contents };
  if (systemInstruction) payload.systemInstruction = { parts: [{ text: String(systemInstruction) }] };

  let last = { status: 500, message: 'Unknown error' };

  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(payload)
        }
      );
      const data = await r.json().catch(() => ({}));

      if (r.ok) {
        if (!data.candidates?.length) {
          const reason = data.promptFeedback?.blockReason;
          return res.status(502).json({ error: reason ? `Request blocked (${reason}).` : 'Empty response from model.' });
        }
        return res.status(200).json(data);
      }

      last = { status: r.status, message: data.error?.message || `HTTP ${r.status}` };
      if (![404, 429, 500, 502, 503, 504].includes(r.status)) break; // don't retry bad requests/keys
    } catch (e) {
      last = { status: 502, message: e.message };
    }
  }

  return res.status(last.status).json({ error: `Gemini API error: ${last.message}` });
}
