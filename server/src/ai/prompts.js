function buildSmartSearchPrompt(query) {
  return `
You are an assistant that converts natural language library search queries into strict JSON filters.

User query: "${query}"

Return ONLY a JSON object with this structure, no extra text:
{
  "filters": {
    "title": string | null,
    "author": string | null,
    "isbn": string | null,
    "genre": string | null,
    "tags": string[] | null,
    "year": number | null,
    "availability": "AVAILABLE" | "BORROWED" | null
  },
  "explanation": string
}

Use partial strings where appropriate (for fuzzy match). If a field is not specified, set it to null.
`;
}

function buildEnrichBookPrompt(book) {
  return `
You are helping a librarian enrich book metadata.

Book:
- Title: ${book.title}
- Author: ${book.author}
- Description: ${book.description || 'N/A'}

Return ONLY a JSON object with this structure, no extra text:
{
  "tags": string[],
  "genre": string,
  "summary": string
}

Tags should be 3-8 short keywords. Summary should be 2-4 sentences.
`;
}

module.exports = {
  buildSmartSearchPrompt,
  buildEnrichBookPrompt,
};

