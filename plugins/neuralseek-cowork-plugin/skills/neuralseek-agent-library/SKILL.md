---
name: neuralseek-agent-library
description: Use when the user wants to browse, pull, or adapt agent templates from the shared NeuralSeek staging/KB library (a separate NeuralSeek instance used as a curated catalog of reusable agents). Fetches agents from the KB instance using the KB_URL and KB_API_KEY environment variables, without disturbing the user's active instance. Triggers on "find an agent template", "browse the agent library", "pull an agent from the staging KB", "is there an existing agent for...", "copy an agent from the library", "show KB agents".
---

# NeuralSeek Agent Library

Pull template agents from the shared NeuralSeek KB staging instance — a separate NeuralSeek instance used as a curated library of reusable agents — and adapt them for the user's active instance.

## Prerequisites

This skill depends on two environment variables being set on the MCP server:

- `KB_URL` — base URL of the shared KB staging instance (e.g., `https://stagingapi.neuralseek.com/v1`)
- `KB_API_KEY` — API key with read access to that instance

If either is missing, tell the user the library is not configured and point them at the plugin README to set the env vars. Do not attempt to proceed without them.

## Why a separate instance

The user's active NeuralSeek instance (configured by the `NS_INSTANCE` / `NS_API_KEY` env vars) holds their own agents. The KB instance (configured by `KB_URL` / `KB_API_KEY`) holds curated templates. The two are kept separate so pulling from the library never pollutes the user's live instance and never changes the active-instance env vars.

## Fetching from the KB instance

`@osuna0102/mcp` tools (`list_agents`, `get_agent`, etc.) operate on whichever instance is configured in the current folder. To query the KB instance without touching the user's active config, use direct REST calls from bash, passing `KB_URL` and `KB_API_KEY`.

### List agents in the KB

```bash
curl -sS -H "apikey: $KB_API_KEY" "$KB_URL/maistro/list" | jq '.[] | {name, description}'
```

Adjust the path (`/maistro/list` vs. `/agents`) if the instance uses a different route — ask the user or check the KB's OpenAPI spec if unsure.

### Fetch a single agent's NTL from the KB

```bash
curl -sS -H "apikey: $KB_API_KEY" "$KB_URL/maistro/get?agent_name=<name>"
```

Write the returned NTL to a local file in the user's workspace under `agents/library-imports/<name>.ntl` so it is clearly separated from agents pulled via `sync_agents`.

## Browsing workflow

1. Confirm `KB_URL` and `KB_API_KEY` are populated.
2. List the KB agents with the `curl` pattern above.
3. Present the list to the user — name + short description — grouped or filtered if they gave a domain hint.
4. Ask which one they want to pull.

## Import workflow

When the user picks a template to adapt:

1. **Fetch the template NTL** from the KB with `curl`.
2. **Save** to `agents/library-imports/<name>.ntl` in the user's workspace (create the folder if missing).
3. **Read the NTL** carefully. Note:
   - What params it expects
   - What sub-agents it references (by name)
   - What external calls it makes (REST URLs, Postgres queries, seek calls)
4. **Identify adaptations needed** for the user's instance:
   - Sub-agent names that don't exist locally — user must either create them or rewire to existing agents
   - Hardcoded URLs, credentials, or instance-specific values — replace with the user's equivalents
   - Postgres DSNs or REST endpoints — confirm they match the user's setup
5. **Rename** the agent to match the user's conventions (don't just keep the KB's name — it may collide).
6. **Hand off to `neuralseek-agent-development`** to:
   - Call `create_agent` with the adapted NTL → writes to `agents/custom/<new_name>.ntl`
   - Call `upload_agent` to push to the user's instance
   - Call `call_agent` to test

## Never upload KB agents directly to the user's instance

Do not call `upload_agent` on a template pulled straight from the KB without adaptation. It almost always needs renaming and parameter tweaking to fit the user's environment. Blindly uploading can:

- Collide with existing agents
- Reference nonexistent sub-agents (silent runtime failures)
- Hit external endpoints the user doesn't have credentials for

Always route through `neuralseek-agent-development` for the adaptation and upload.

## Keeping the import folder clean

`agents/library-imports/` is a staging area. Suggest to the user that they:

- Commit imports before adapting (so diffs show the adaptations clearly)
- Delete or archive imports once adapted and uploaded
- Never sync `library-imports/` to the user's instance

## Troubleshooting

- **`KB_URL` or `KB_API_KEY` unset.** See plugin README for env var setup.
- **`401 Unauthorized` from KB.** The `KB_API_KEY` is invalid or expired. Tell the user to request a fresh key.
- **Endpoint returns 404.** The KB instance may use a different REST path. Ask the user or check with the KB admin for the correct listing/fetch endpoint.
- **Agent references a sub-agent that doesn't exist locally.** Either pull that sub-agent from the KB too, or rewire the parent to use an existing local agent.

## Handoff

- To adapt and upload a pulled template: route to `neuralseek-agent-development`
- To see what already exists locally before importing: route to `neuralseek-agent-architecture`
