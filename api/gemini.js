export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, isJson } = req.body;
  
  // Securely get the API key from Vercel's environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel.' });
  }
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    // Reconstruct the payload exactly as your frontend used to do it
    let payload = { contents: [{ parts: [{ text: prompt }] }] };
    if (isJson) {
      payload.generationConfig = { responseMimeType: "application/json" };
    }

    // Call the Gemini 3 preview model using the hidden API key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' });
    }

    // Extract the text and send it back to the frontend
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
        return res.status(500).json({ error: 'Invalid response format received from Gemini.' });
    }

    return res.status(200).json({ reply });
    
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}