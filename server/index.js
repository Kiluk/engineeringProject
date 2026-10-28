const http = require('node:http');

const port = Number(process.env.ANALYSIS_SERVER_PORT || 3001);

const sendJson = (response, status, payload) => {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': response.allowedOrigin || 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(payload));
};

const readJson = (request) => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1024 * 1024) {
      reject(new Error('Request body is too large'));
      request.destroy();
    }
  });
  request.on('end', () => {
    try {
      resolve(JSON.parse(body));
    } catch {
      reject(new Error('Invalid JSON request'));
    }
  });
  request.on('error', reject);
});

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin) {
    try {
      const { hostname } = new URL(origin);
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        sendJson(response, 403, { error: 'Requests must come from the local app' });
        return;
      }
      response.allowedOrigin = origin;
    } catch {
      sendJson(response, 403, { error: 'Invalid request origin' });
      return;
    }
  }

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== 'POST' || request.url !== '/api/analyze') {
    sendJson(response, 404, { error: 'Endpoint not found' });
    return;
  }

  try {
    const { apiKey, email } = await readJson(request);
    if (!apiKey?.trim() || !email?.from || !email?.subject) {
      sendJson(response, 400, { error: 'API key and email details are required' });
      return;
    }

    const normalizedApiKey = apiKey.trim();
    if (!/^[\x21-\x7E]+$/.test(normalizedApiKey)) {
      sendJson(response, 400, {
        error: 'Klucz API zawiera niedozwolone znaki. Wklej ponownie klucz skopiowany z Anthropic.',
      });
      return;
    }

    const emailBody = email.body || email.snippet || '';
    const prompt = `Analyze this email for phishing indicators. Return a JSON response with these exact fields:
{
  "isPhishing": boolean,
  "confidence": number (0-1),
  "reason": string (brief explanation)
}

Email details:
From: ${email.from}
Subject: ${email.subject}
Body: ${emailBody}

Focus on:
- Unusual sender domain vs claimed company
- Urgent language or threats
- Requests for credentials or personal data
- Suspicious links or formatting
- Grammar/spelling errors typical of phishing

Respond ONLY with valid JSON, no markdown.`;

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': normalizedApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const result = await apiResponse.json();
    if (!apiResponse.ok) {
      sendJson(response, apiResponse.status, {
        error: result.error?.message || `Anthropic request failed (${apiResponse.status})`,
      });
      return;
    }

    const text = result.content?.find((item) => item.type === 'text')?.text;
    if (!text) {
      sendJson(response, 502, { error: 'Anthropic returned no analysis text' });
      return;
    }

    sendJson(response, 200, JSON.parse(text));
  } catch (error) {
    sendJson(response, 500, { error: error.message || 'Analysis request failed' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Analysis proxy listening on http://127.0.0.1:${port}`);
});