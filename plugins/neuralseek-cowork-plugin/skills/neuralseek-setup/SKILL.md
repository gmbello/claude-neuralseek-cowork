---
name: neuralseek-setup
description: Use when the user wants to verify their NeuralSeek plugin is connected, switch the NeuralSeek instance they are pointed at, or troubleshoot auth / connection errors from the NeuralSeek MCP. Triggers on "set up NeuralSeek", "configure NeuralSeek", "connect NeuralSeek", "switch NeuralSeek instance", "check NeuralSeek connection", "401 from NeuralSeek", "NeuralSeek not working".
---

# NeuralSeek Setup

The plugin ships with the MCP endpoint URL baked into `.mcp.json`. Per-user credentials are supplied via environment variables — either set at the OS level (`.zshrc` / `.bashrc` / Windows env vars) or through Cowork's plugin settings UI. Nothing is stored inside the plugin itself. Your job in this skill is to **verify the connection works** and help the user **update the env vars when they need to switch instances** or recover from a 401 / 404.

## How the connection works

The NeuralSeek MCP is a stateless HTTPS server. Every tool call is a self-contained POST to the baked-in MCP URL carrying three headers, all substituted from env vars at request time:

| Header | Env var | Example |
|---|---|---|
| `x-ns-instance` | `NS_INSTANCE` | `MyInstance` |
| `x-ns-apikey` | `NS_API_KEY` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `x-ns-url` | `NS_URL` | `https://api.neuralseek.com/v1` |

The MCP endpoint URL is hardcoded in `.mcp.json` (currently `https://hedgiest-lashaunda-contractedly.ngrok-free.dev/mcp`). If the user runs their own MCP server, they can edit `.mcp.json` in the installed plugin folder to point at it — then reload the plugin.

No session handshake, no persistent connection, no on-disk config file.

## Verifying the connection

Call `list_agents` with a small limit. If it returns agents (or an empty array), the plugin is wired up correctly.

```
list_agents | limit: 3
```

Interpret the result:

- **Agents returned** — connected. Confirm which instance by reading the response.
- **Empty array** — credentials work, the instance just has no agents yet.
- **401 Unauthorized** — `NS_API_KEY` is wrong or revoked.
- **404 Not Found** — `NS_URL` (REST base) is wrong or `NS_INSTANCE` doesn't exist on that host.
- **Connection refused / DNS error** — the baked-in MCP URL is unreachable (ngrok tunnel down, server offline). Edit `.mcp.json` in the installed plugin folder to point at a live MCP host.

## Switching instances or updating credentials

When the user asks to switch instances or rotate a key:

1. Tell them to open Cowork → Plugins → NeuralSeek and update the env vars through the plugin settings UI, **or** update the corresponding OS environment variables (`NS_INSTANCE`, `NS_API_KEY`, `NS_URL`) and restart the Cowork session.
2. If they need to point at a different MCP host, they must edit the `url` field in the plugin's `.mcp.json` directly — it is not driven by an env var.
3. Call `list_agents | limit: 3` again to confirm the new values are being picked up.

Do **not** attempt to write any local config file or hardcode credentials into the plugin.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `401 Unauthorized` on every call | Bad or revoked API key | Update `NS_API_KEY` in Cowork plugin settings or OS env. |
| `404 Not Found` on every call | Wrong REST base URL or instance name | Update `NS_URL` and/or `NS_INSTANCE`. |
| Tool calls hang or connection refused | MCP host in `.mcp.json` is unreachable | Confirm the baked-in URL (e.g. ngrok tunnel) is live, or edit `.mcp.json` to point at a running MCP host. |
| Works for some tools, not others | Server-side permission issue on the instance | API key may lack scope for that tool. Request a broader key. |
| Headers literally show `${NS_INSTANCE}` etc. in logs | Env vars not set — Cowork did not substitute them | Set all three env vars (`NS_INSTANCE`, `NS_API_KEY`, `NS_URL`) before the Cowork session starts. |
| "No NeuralSeek tools available" in Cowork | Plugin not installed, or env vars left blank | Reinstall the plugin and fill every env var. |

## After setup

Once the connection is verified, point the user at the skill that fits their next step:

- Build a new agent → `neuralseek-agent-development`
- Inventory / map existing agents → `neuralseek-agent-architecture`
- Ask a grounded question from the KB → `neuralseek-knowledge-base`
- Debug a failed run → `neuralseek-agent-debugging`
- Back up / sync / delete → `neuralseek-instance-ops`