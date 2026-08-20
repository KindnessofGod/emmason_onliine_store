# Mobile capture uses gpt-4o-mini, not Claude Haiku

Ticket #8's spec extraction (reading a product box photo into structured specs) was deliberately built on Claude Haiku, chosen after comparing Claude/OpenAI/Gemini vision pricing — all three were found cheap enough (a few cents per 1,000 products) that cost wasn't the deciding factor, and Claude was picked as the model family this codebase and its assistant both already work with natively.

That preference doesn't survive contact with "no Anthropic credit yet, but there's an OpenAI key ready today." Switched `src/actions/product-capture.ts` to OpenAI's `gpt-4o-mini` via the `openai` SDK (`chat.completions.parse` + `zodResponseFormat`, replacing `@anthropic-ai/sdk`'s `messages.parse` + `zodOutputFormat`) so the feature can actually be used now rather than wait on a credit top-up. `.env.example` now documents `OPENAI_API_KEY` instead of `ANTHROPIC_API_KEY`. Nothing else about the ticket's design changed — same per-category schema-constrained extraction, same `pending_review` landing, same "AI drafts, human confirms" review gate.

If Anthropic credit becomes available later, swapping back is a same-shaped change to this one file — the extraction schema, prompt, and everything downstream of the parsed result are provider-agnostic.
