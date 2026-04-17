# NeuralSeek Cowork Plugin

NeuralSeek integration for Claude Cowork. Provides the full agent development lifecycle on NeuralSeek mAIstro — NTL authoring, testing, debugging, RAG knowledge-base search, architecture mapping, instance operations, and pulling templates from a shared KB staging library.

**Configuration model: an in-Cowork setup form.** Credentials are collected interactively by the `neuralseek-setup` skill and written to `~/.neuralseek-cowork.json`. A bundled launcher script reads that config file at MCP startup and injects the values into the MCP server process. No OS env vars, no `.neuralseekrc.json`, no `mcpns init`.

## What's included

### MCP server

- `@osuna0102/mcp` — NeuralSeek MCP server. Runs via `npx -y @osuna0102/mcp` under a small launcher (`bin/launcher.js`). No global install required.

### Skills

| Skill | Purpose |
|---|---|
| `neuralseek-setup` | Interactive form-based setup: collects credentials and writes `~/.neuralseek-cowork.json` |
| `neuralseek-agent-development` | Full NTL development cycle: draft → create → upload → test. Bundles the complete NTL reference under `references/`. |
| `neuralseek-agent-debugging` | Diagnose failed runs with `get_logs` and `replay_run`, including multi-agent chain drill-down |
| `neuralseek-knowledge-base` | RAG Q&A via `seek` with confidence scoring and source citations |
| `neuralseek-agent-architecture` | Inventory and map agent dependencies; visualize with `agents/_flow.html` |
| `neuralseek-instance-ops` | Backups, syncing, deletion, flow map regeneration |
| `neuralseek-agent-library` | Browse and import template agents from a shared KB staging instance |

## Configuration file

All credentials live in a single JSON file at `~/.neuralseek-cowork.json` (i.e. `$HOME/.neuralseek-cowork.json`, or `%USERPROFILE%\.neuralseek-cowork.json` on Windows).

### Schema

| Key | Required | Description |
|---|---|---|
| `NS_INSTANCE` | yes | NeuralSeek instance name |
| `NS_API_KEY` | yes | API key for the instance |
| `NS_BASE_URL` | no | Base URL override (default: `https://api.neuralseek.com/v1`) |
| `KB_URL` | conditional | Base URL of the shared NeuralSeek KB staging instance (only for `neuralseek-agent-library`) |
| `KB_API_KEY` | conditional | Read-capable API key for the KB instance (only for `neuralseek-agent-library`) |

Example:

```json
{
  "NS_INSTANCE": "MyInstance",
  "NS_API_KEY": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "NS_BASE_URL": "https://api.neuralseek.com/v1",
  "KB_URL": "https://stagingapi.neuralseek.com/v1",
  "KB_API_KEY": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
}
```

### Custom config path

Set the `NEURALSEEK_COWORK_CONFIG` env var to an absolute path if the config must live somewhere other than the default.

## Setup

Run the `neuralseek-setup` skill in Cowork — it will:

1. Check whether a config already exists and offer to keep / edit / replace it
2. Collect `NS_INSTANCE`, `NS_API_KEY`, optional `NS_BASE_URL`, and optional `KB_URL` / `KB_API_KEY` through `AskUserQuestion` prompts
3. Write the values to `~/.neuralseek-cowork.json`
4. Remind you to fully quit and restart Cowork so the launcher picks up the new credentials
5. Verify connectivity with a `list_agents` call after the restart

### Restart Cowork

**Fully quit and relaunch Cowork** after creating or editing the config. The launcher reads `~/.neuralseek-cowork.json` once at MCP server startup; existing Cowork processes won't pick up changes until they restart.

### Verify

Ask Claude: "check which NeuralSeek instance I'm connected to" — the `neuralseek-setup` skill will confirm the config loaded correctly and test connectivity.

## Switching instances

Either re-run `neuralseek-setup` (it offers to replace the existing config) or edit `~/.neuralseek-cowork.json` directly. Fully quit and restart Cowork after the change.

## How the launcher works

`.mcp.json` points Cowork at `bin/launcher.js`. The launcher:

1. Reads `~/.neuralseek-cowork.json` (or the path in `NEURALSEEK_COWORK_CONFIG`)
2. Copies `NS_INSTANCE`, `NS_API_KEY`, `NS_BASE_URL`, `KB_URL`, `KB_API_KEY` from the JSON into the child process env
3. Spawns `npx -y @osuna0102/mcp` with `stdio: inherit` so the MCP server speaks directly to Cowork
4. Forwards `SIGINT` / `SIGTERM` / `SIGHUP` and propagates the exit code

Values from the config file override `process.env` entries, but any key not in the config falls through to `process.env` — so power users who prefer OS env vars can still set them directly.

## NTL reference

The full NTL node catalog (140+ nodes with syntax, parameters, integration patterns) is bundled inside `skills/neuralseek-agent-development/references/ntl-reference.md`. Claude loads it automatically before writing any NTL.

NTL gotchas (silent failure modes with Postgres, REST, sub-agents, variable scoping) are read at runtime from the `ntl://gotchas` MCP resource.

## Typical flows

- **Build a new agent** — "Create a NeuralSeek agent that checks credit risk for a company name" → `neuralseek-agent-development` drafts with `generate_ntl`, refines, writes, uploads, tests.
- **Fix a broken agent** — "My `OverdueInvoices` agent is returning empty" → `neuralseek-agent-debugging` pulls logs, replays, diagnoses, hands off for fix.
- **Search the KB** — "What does our policy say about expense reimbursement?" → `neuralseek-knowledge-base` calls `seek` with sources.
- **Map the architecture** — "Show me which agents call the Orchestrator" → `neuralseek-agent-architecture` runs `map_agents` and renders `agents/_flow.html`.
- **Pre-refactor snapshot** — "Back up before I change this chain" → `neuralseek-instance-ops` runs `backup_instance`.
- **Start from a template** — "Is there an existing agent for customer segmentation?" → `neuralseek-agent-library` queries the KB staging instance.

## Version

`0.3.0` — form-based setup with `~/.neuralseek-cowork.json`. OS env vars and `.neuralseekrc.json` are no longer part of the primary setup flow (though OS env vars still work as a fallback for power users).
