---
name: neuralseek-knowledge-base
description: Use when the user wants a grounded answer from their NeuralSeek knowledge base — RAG question-answering with confidence scores and source citations. Triggers on "ask NeuralSeek", "search knowledge base", "RAG query", "what does the KB say about...", "find documentation for...", "look this up in NeuralSeek", "seek this".
---

# NeuralSeek Knowledge Base Search

Answer questions by querying the NeuralSeek knowledge base via the `seek` tool. This is a RAG-grounded lookup — the response is derived from indexed documents in the user's configured instance, returned with a confidence score and source passages.

## When to use this skill

- User asks a factual question that should be answered from their company's indexed documentation
- User explicitly asks Claude to "ask NeuralSeek" or "check the KB"
- User wants source citations for an answer

Do **not** use this for general web questions or questions unrelated to the user's domain — `seek` only searches the configured instance's KB.

## Calling `seek`

Standard call:

```
seek | question: "<the user's question, rephrased as a clear standalone question>"
```

Always pass `include_sources: true` when the user will act on the answer — it returns the passages used to generate the response so they can verify.

```
seek | question: "How do we process overdue invoices?" | include_sources: true
```

### Optional parameters

- `language` — 2-char ISO code (e.g., `en`, `es`, `fr`, `de`, `ja`). Omit to use the instance default. Set when the user is querying in a non-default language or wants the answer in a specific language.
- `filter` — filter string to isolate a document subset. Use when the user specifies a scope (e.g., "search only the HR docs", "check only the 2024 policy set"). Ask the user what filter value to use if unclear; filters are instance-specific.

## Interpreting the response

The response contains:

- **Answer** — the generated, grounded reply
- **Confidence score** — a value indicating how well the KB supported the answer
- **Sources** (when `include_sources: true`) — the passages retrieved

Handling by confidence:

- **High confidence.** Present the answer directly. If sources are included, list them so the user can verify.
- **Medium confidence.** Present the answer but flag the uncertainty. Offer to widen or narrow the query, or to search with a different phrasing.
- **Low confidence.** Do not present the answer as fact. Tell the user the KB does not strongly support any answer, show what was retrieved (if anything), and ask if they want to rephrase or search a different source.

## Rephrasing questions for better retrieval

Before calling `seek`, rephrase the user's question for clarity if it is ambiguous, conversational, or missing context. Good `seek` queries are:

- Standalone (no pronouns referring to earlier conversation)
- Specific (include the domain noun, time period, or entity name)
- Stated as a complete question, not a keyword list

Example rewrites:

- User: "What's the policy on that?" → `seek` query: "What is the expense reimbursement policy?"
- User: "how about returns" → `seek` query: "What is our customer return policy?"

## Citing sources

When sources are returned, present them to the user cleanly. Include the passage title (if the instance provides one) and the relevant excerpt. Do not dump raw passage JSON — summarize and link.

## When `seek` returns nothing useful

If the KB has no match:

1. Tell the user honestly that the KB did not return a useful result.
2. Offer to:
   - Rephrase the question
   - Try a different `filter`
   - Look elsewhere (another instance, web, other docs)

Do not fabricate a grounded answer when the KB did not support one.

## Handoff

- If the user wants to **build an agent** that calls `seek` as part of a larger workflow, route to `neuralseek-agent-development`.
- If the user wants to **search a different instance** (e.g., a staging KB), the active instance is set via `NS_INSTANCE` / `NS_API_KEY` env vars. Follow `neuralseek-setup` to change them and restart Cowork.
