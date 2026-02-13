import Anthropic from '@anthropic-ai/sdk';

let apiKey = '';
let client = null;

export const PhishingDetector = {
  setApiKey: (key) => {
    apiKey = key;
    client = new Anthropic({ apiKey: key });
  },

  detectPhishing: async (email) => {
    if (!client) {
      throw new Error('API key not set. Call setApiKey() first.');
    }

    const prompt = `Analyze this email for phishing indicators. Return a JSON response with these exact fields:
{
  "isPhishing": boolean,
  "confidence": number (0-1),
  "reason": string (brief explanation)
}

Email details:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.snippet}

Focus on:
- Unusual sender domain vs claimed company
- Urgent language or threats
- Requests for credentials or personal data
- Suspicious links or formatting
- Grammar/spelling errors typical of phishing

Respond ONLY with valid JSON, no markdown.`;

    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const result = JSON.parse(content.text);
      return {
        isPhishing: result.isPhishing,
        confidence: result.confidence,
        reason: result.reason,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse Claude response');
      }
      throw error;
    }
  },

  analyzeMultiple: async (emails) => {
    const results = {};

    for (const email of emails) {
      try {
        results[email.id] = await PhishingDetector.detectPhishing(email);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results[email.id] = {
          isPhishing: false,
          confidence: 0,
          reason: `Analysis failed: ${error.message}`,
        };
      }
    }

    return results;
  },
};
