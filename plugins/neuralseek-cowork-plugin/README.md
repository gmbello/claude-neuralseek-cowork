# NeuralSeek Cowork Plugin

NeuralSeek integration for Claude Cowork. Connects to a hosted NeuralSeek MCP server over HTTPS and bundles skills that cover the full mAIstro agent development lifecycle — NTL authoring, testing, debugging, RAG knowledge-base search, architecture mapping, and instance operations.

## What's included

### MCP server

| Server | Transport | Description |
|---|---|---|
| `neuralseek` | Stateless HTTP (HTTPS) | Remote NeuralSeek MCP endpoint. Cowork POSTs each JSON-RPC call to `${ns_mcp_url}/mcp` with the instance name, API key, and REST base URL sent as `x-ns-instance`, `x-ns-apikey`, and `x-ns-url` headers. Every request is fully independent — no session handshake, no persistent connection. |

### Skills

| Skill | Purpose |
|---|---|
| `neuralseek-setup` | Verify connectivity and walk the user through updating credentials when they need to switch instances. |
| `neuralseek-agent-development` | Full NTL development cycle: draft → create → upload → test. Bundles the complete NTL reference under `references/`. |
| `neuralseek-agent-debugging` | Diagnose failed runs with `get_logs` and `replay_run`, including multi-agent chain drill-down. |
| `neuralseek-knowledge-base` | RAG Q&A via `seek` with confidence scoring and source citations. |
| `neuralseek-agent-architecture` | Inventory and map agent dependencies; visualize with `agents/_flow.html`. |
| `neuralseek-instance-ops` | Backups, syncing, deletion, flow map regeneration. |

## Setup

The plugin ships with the MCP endpoint URL baked in (`https://hedgiest-lashaunda-contractedly.ngrok-free.dev/mcp`). Users who run their own MCP server can edit `.mcp.json` after install to point at it. Three environment variables supply the per-user credentials — set them either through **Cowork's plugin settings UI** (after install) or as OS-level environment variables in your shell (`.zshrc`, `.bashrc`, Windows System Properties, etc.) before installing:

| Variable | Example | Purpose |
|---|---|---|
| `NS_INSTANCE` | `MyInstance` | NeuralSeek instance name. Sent as `x-ns-instance`. |
| `NS_API_KEY` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | NeuralSeek API key. Sent as `x-ns-apikey`. |
| `NS_URL` | `https://api.neuralseek.com/v1` | NeuralSeek REST API base. Sent as `x-ns-url`. |

No local config file, launcher script, or credentials are stored inside the plugin. Cowork substitutes the header values from your environment on every MCP request.

### How the connection works

Each tool call is a self-contained POST:

```
POST https://hedgiest-lashaunda-contractedly.ngrok-free.dev/mcp
Content-Type:   application/json
x-ns-instance:  <your-instance>
x-ns-apikey:    <your-api-key>
x-ns-url:       <your-ns-rest-base>

{ "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { ... } }
```

Stateless — there is no session handshake, no persistent connection, no `sessionId` to track. Terminate the client and the next request starts clean. For HTTPS, the server is typically fronted by nginx or Caddy with a TLS cert; credentials travel inside the TLS tunnel.

### Verify

Once installed, ask Claude: *"list my NeuralSeek agents"* — the `neuralseek-agent-architecture` skill will call `list_agents` and confirm the connection works.

If you see a 401, the API key is wrong or revoked. If you see a 404, the `NS_URL` or `NS_INSTANCE` is wrong. If you see a connection error, the baked-in MCP URL is unreachable — edit `.mcp.json` to point at your own MCP host.

## Switching instances

Update the env vars (either through Cowork's plugin settings or in your OS environment) and reload the plugin. The plugin itself holds no state — all credentials come from the environment at request time.

## Typical flows

- **Build a new agent** — *"Create a NeuralSeek agent that checks credit risk for a company name"* → `neuralseek-agent-development` drafts with `generate_ntl`, refines, writes, uploads, tests.
- **Fix a broken agent** — *"My `OverdueInvoices` agent is returning empty"* → `neuralseek-agent-debugging` pulls logs, replays, diagnoses.
- **Search the KB** — *"What does our policy say about expense reimbursement?"* → `neuralseek-knowledge-base` calls `seek` with sources.
- **Map the architecture** — *"Show me which agents call the Orchestrator"* → `neuralseek-agent-architecture` runs `map_agents` and renders `agents/_flow.html`.
- **Pre-refactor snapshot** — *"Back up before I change this chain"* → `neuralseek-instance-ops` runs `backup_instance`.

## NTL reference

The full NTL node catalog is bundled inside `skills/neuralseek-agent-development/references/ntl-reference.md`. Claude loads it automatically before writing any NTL.

## Version

`0.2.0` — stateless HTTP MCP transport with `x-ns-instance`, `x-ns-apikey`, and `x-ns-url` headers. Dropped the legacy launcher / config-file / SSE-session modes. Removed the `neuralseek-agent-library` skill (depended on a second set of KB credentials that doesn't fit a single stateless MCP connection; reintroduce as a separate plugin if needed).