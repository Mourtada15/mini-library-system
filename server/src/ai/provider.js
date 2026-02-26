function extractKeywords(text) {
  const stopwords = new Set([
    'the',
    'a',
    'an',
    'of',
    'and',
    'or',
    'for',
    'with',
    'about',
    'books',
    'book',
    'show',
    'me',
    'find',
    'all',
    'that',
    'are',
    'in',
    'on',
    'to',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !stopwords.has(w));
}

function detectYear(text) {
  const m = text.match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : undefined;
}

function detectStatus(text) {
  const lower = text.toLowerCase();
  if (lower.includes('available')) return 'AVAILABLE';
  if (lower.includes('borrowed') || lower.includes('checked out')) return 'BORROWED';
  return undefined;
}

function detectGenreFromText(text) {
  const lower = text.toLowerCase();
  if (lower.includes('space') || lower.includes('planet') || lower.includes('galaxy')) {
    return 'Science Fiction';
  }
  if (lower.includes('recipe') || lower.includes('cook')) {
    return 'Cooking';
  }
  if (lower.includes('history') || lower.includes('historical')) {
    return 'History';
  }
  if (lower.includes('business') || lower.includes('startup') || lower.includes('finance')) {
    return 'Business';
  }
  if (lower.includes('fantasy') || lower.includes('dragon')) {
    return 'Fantasy';
  }
  return 'General';
}

function generateMockSmartSearch(prompt) {
  const year = detectYear(prompt);
  const status = detectStatus(prompt) || 'ALL';
  const keywords = extractKeywords(prompt);
  const genre = detectGenreFromText(prompt);

  const filters = {
    q: keywords.join(' ') || undefined,
    status,
    genre,
    year,
  };

  return {
    filters,
    explanation: 'Results generated from mock smart-search based on your query.',
  };
}

function generateMockEnrichBook(context) {
  const title = context?.title || '';
  const author = context?.author || '';
  const description = context?.description || '';
  const baseText = `${title} ${author} ${description}`.trim();

  const keywords = extractKeywords(baseText);
  const tags = Array.from(new Set(keywords)).slice(0, 6);
  const genre = detectGenreFromText(baseText);

  let summary;
  if (description) {
    summary = `This book, "${title}" by ${author || 'an unknown author'}, is about ${description.slice(
      0,
      220
    )}.`;
  } else if (title || author) {
    summary = `"${title}" by ${author || 'an unknown author'} is a ${genre.toLowerCase()} book.`;
  } else {
    summary = 'A book with limited metadata available.';
  }

  return {
    tags,
    genre,
    summary,
  };
}

async function generateText({ prompt, endpoint, context }) {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const model = process.env.AI_MODEL || 'gpt-4.1-mini';

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required');
  }

  // Mock provider: deterministic local behavior, no network or API keys
  if (provider === 'mock') {
    let payload;
    if (endpoint === 'smart-search') {
      payload = generateMockSmartSearch(prompt);
    } else if (endpoint === 'enrich-book') {
      payload = generateMockEnrichBook(context);
    } else {
      payload = { message: 'Unknown endpoint for mock provider' };
    }
    return {
      text: JSON.stringify(payload),
      provider: 'mock',
      model: 'mock',
    };
  }

  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available. Use Node.js 18+.');
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

module.exports = { generateText, generateMockSmartSearch, generateMockEnrichBook };

