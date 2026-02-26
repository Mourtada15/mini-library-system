const fetch = require('node-fetch');

async function generateText({ prompt }) {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const model = process.env.AI_MODEL || 'gpt-4.1-mini';

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required');
  }

  const maxLength = 2000;
  const trimmedPrompt = prompt.slice(0, maxLength);

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 512,
        messages: [{ role: 'user', content: trimmedPrompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const content =
      data.content && data.content[0] && data.content[0].text
        ? data.content[0].text
        : '';
    return { text: content, provider: 'anthropic', model };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: trimmedPrompt }],
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content =
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content
      ? data.choices[0].message.content
      : '';

  return { text: content, provider: 'openai', model };
}

module.exports = { generateText };

