---
name: neuralseek-setup
description: Use when the user wants to configure NeuralSeek credentials, connect to a NeuralSeek MCP server, switch instances, or troubleshoot auth / connection errors. Triggers on "set up NeuralSeek", "configure NeuralSeek", "connect NeuralSeek", "switch NeuralSeek instance", "check NeuralSeek connection", "401 from NeuralSeek", "NeuralSeek not working", "enter NeuralSeek credentials".
---

# NeuralSeek Setup

The plugin connects to a NeuralSeek MCP server over HTTP. The `.mcp.json` reads credentials from four environment variables at startup. Your job in this skill is to **collect the required values from the user** and set them as environment variables so the MCP server picks them up on the next session.

## Variables required

| Env var | Description | Example |
|---|---|---|
| `NS_MCP_URL` | Full HTTP URL of the NeuralSeek MCP endpoint | `https://api.neuralseek.com/mcp` |
| `NS_INSTANCE` | NeuralSeek instance identifier | `my-company` |
| `NS_API_KEY` | NeuralSeek API key (UUID format) | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `NS_BASE_URL` | NeuralSeek REST API base URL | `https://api.neuralseek.com/v1` |

## Setup flow

### Step 1 — Collect parameters

Ask the user for each value (one prompt or all at once):

1. **MCP Server URL** → `NS_MCP_URL`
2. **Instance name** → `NS_INSTANCE`
3. **API key** → `NS_API_KEY`
4. **REST base URL** → `NS_BASE_URL` (same host as MCP URL but ending in `/v1` instead of `/mcp`)

### Step 2 — Set environment variables

Run the appropriate commands for the user's OS.

**Windows (persistent, current user):**
```bash
setx NS_MCP_URL "<value>"
setx NS_INSTANCE "<value>"
setx NS_API_KEY "<value>"
setx NS_BASE_URL "<value>"
```

**macOS / Linux (add to shell profile):**
```bash
cat >> ~/.bashrc << 'EOF'
export NS_MCP_URL="<value>"
export NS_INSTANCE="<value>"
export NS_API_KEY="<value>"
export NS_BASE_URL="<value>"
EOF
```

Replace each `<value>` with the actual value provided by the user. Run the commands using the Bash tool.

### Step 3 — Reload and verify

Tell the user to **fully restart their Claude Code session** (close and reopen) so the new env vars are loaded. Then verify the connection:

```
list_agents | limit: 3
```

Interpret the result:

- **Agents returned** — connected. Confirm which instance from the response.
- **Empty array** — credentials work, the instance just has no agents yet.
- **401 Unauthorized** — `NS_API_KEY` is wrong or revoked. Repeat setup.
- **404 Not Found** — `NS_BASE_URL` or `NS_INSTANCE` is wrong.
- **Connection refused / DNS error** — `NS_MCP_URL` is unreachable. Ask the user to confirm it.

## Switching instances or rotating a key

Repeat Steps 1–2 with the new values (`setx` on Windows overwrites the existing value), then restart the session and verify.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `401 Unauthorized` | Bad or revoked API key | Re-run setup with a valid `NS_API_KEY`. |
| `404 Not Found` | Wrong REST base URL or instance name | Re-run setup with correct `NS_BASE_URL` / `NS_INSTANCE`. |
| Connection refused / DNS error | MCP URL unreachable | Confirm `NS_MCP_URL` is live. |
| Variables show as `${NS_MCP_URL}` literally | Env vars not set or session not restarted | Run setup again and fully restart Claude Code. |
| "No NeuralSeek tools available" | Plugin not installed or env vars missing | Reinstall the plugin and run setup. |

## After setup

Once the connection is verified, point the user at the skill that fits their next step:

- Build a new agent → `neuralseek-agent-development`
- Inventory / map existing agents → `neuralseek-agent-architecture`
- Ask a grounded question from the KB → `neuralseek-knowledge-base`
- Debug a failed run → `neuralseek-agent-debugging`
- Back up / sync / delete → `neuralseek-instance-ops`
