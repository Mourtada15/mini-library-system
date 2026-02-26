## AI workflow during development

### Tools used

- Cursor (Auto mode for inline edits, multi-file changes, and quick navigation)
- GPT-5.2 for implementation and integration work
- Claude Opus for review passes (spotting missing edge cases, tightening prompts and error handling)

### Example prompts used

- “Implement Google OAuth with Passport sessions for Express + Mongo connect-mongo and return `/api/auth/me`.”
- “Build Joi schemas for create/update book and checkout body; add a validate middleware.”
- “Add search + filters + pagination for a Mongoose Book model; include q across title/author/isbn/tags/genre.”
- “Implement checkout/checkin rules with roles and override support; log to CheckoutLog.”
- “Create an AI provider abstraction `generateText(prompt)` supporting OpenAI and Anthropic via env vars.”
- “Write a strict JSON prompt for natural-language search -> filters and explanation, then parse safely.”
- “Create a Bootstrap React UI for books list/detail/form and admin users page with role guards.”
- “Write Jest + Supertest tests that don’t require real OAuth or AI keys.”

### Manual validation

- AI output parsing was tested with malformed/extra-text responses to ensure safe fallbacks.
- Rate limiting and “no sensitive logging” were verified by checking AI logs store only metadata (lengths/provider/model).
- Auth + role protection was validated by verifying ADMIN/LIBRARIAN/MEMBER behaviors on key routes and UI actions.

