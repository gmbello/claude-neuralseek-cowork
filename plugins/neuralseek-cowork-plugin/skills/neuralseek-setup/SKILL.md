---
name: neuralseek-setup
description: Use when the user wants to set up NeuralSeek plugin credentials, switch which NeuralSeek instance they are pointed at, verify the plugin config is loaded correctly, or troubleshoot auth errors. Triggers on "set up NeuralSeek", "configure NeuralSeek credentials", "connect to NeuralSeek instance", "switch NeuralSeek instance", "check NeuralSeek config", "fill the NeuralSeek form", "401 from NeuralSeek".
---

# NeuralSeek Setup

Configure NeuralSeek credentials through an **in-Cowork form** — no OS-level environment variables, no `.neuralseekrc.json`, no `mcpns init`. The setup skill collects the values with `AskUserQuestion`, writes them to a single JSON config file in the user's home directory, and the plugin's launcher script injects them into the MCP server at startup.

## Config file location

- Default: `~/.neuralseek-cowork.json` (i.e. `$HOME/.neuralseek-cowork.json`, or `%USERPROFILE%\.neuralseek-cowork.json` on Windows)
- Override: set the `NEURALSEEK_COWORK_CONFIG` env var to a custom absolute path if the user has a strong reason to keep the file elsewhere

The file is plain JSON with the keys listed below.

## Config schema

| Key | Required | Description |
|---|---|---|
| `NS_INSTANCE` | yes | NeuralSeek instance name |
| `NS_API_KEY` | yes | API key for the instance |
| `NS_BASE_URL` | no | Base URL override (default: `https://api.neuralseek.com/v1`) |
| `KB_URL` | only for agent-library skill | Shared KB staging instance URL |
| `KB_API_KEY` | only for agent-library skill | API key for the KB staging instance |

## Setup workflow

### Step 1 — Ask whether a config already exists

Before prompting, read `~/.neuralseek-cowork.json` (via `Read` or `cat`). If it exists, show the user which `NS_INSTANCE` is currently set and ask whether to (a) keep it, (b) edit it, or (c) replace it. Use `AskUserQuestion`.

### Step 2 — Collect credentials with `AskUserQuestion`

Ask a sequence of short questions. Use one `AskUserQuestion` call with multiple questions when possible. Required fields first, then optional.

Suggested questions:

1. **NS_INSTANCE** — "Which NeuralSeek instance should this config point at? (e.g. `MyInstance`)" — free text.
2. **NS_API_KEY** — "Paste the API key for that instance." — free text. Treat as secret; do not echo back in full.
3. **NS_BASE_URL** — "Use the default `https://api.neuralseek.com/v1` or a custom base URL?" — options: `default`, `staging (https://stagingapi.neuralseek.com/v1)`, `custom (ask)`.
4. **Configure KB library?** — "Do you want to configure the shared KB staging library now?" — options: `yes`, `skip`.
5. If yes: **KB_URL** and **KB_API_KEY** — two free-text fields.

Skip any field the user says they don't need. Do not invent placeholder values.

### Step 3 — Write the config file

Write the collected values to `~/.neuralseek-cowork.json` as a single JSON object. Omit keys the user skipped — do not write empty strings.

Example final content:

```json
{
  "NS_INSTANCE": "MyInstance",
  "NS_API_KEY": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "NS_BASE_URL": "https://api.neuralseek.com/v1"
}
```

Use the `Write` tool with the expanded home path. On Windows, `$HOME` may not expand in bash — resolve it first (`cd ~ && pwd`) or use the `USERPROFILE` value.

After writing, tighten permissions on POSIX systems where possible (`chmod 600 ~/.neuralseek-cowork.json`). On Windows, skip — NTFS ACLs handle it per-user.

### Step 4 — Fully quit and restart Cowork

The launcher script reads the config file **once at MCP server startup**. Cowork boots the MCP server when the plugin is first loaded into a session; to pick up new or changed credentials, the user must fully quit Cowork (tray/menu bar, not just close the window) and relaunch.

Tell the user this plainly before closing out the form — the config file alone doesn't do anything until Cowork restarts.

### Step 5 — Verify the plugin can reach NeuralSeek

After Cowork restarts, call `list_agents | limit: 3`. If it returns agents, the plugin is connected.

- `401 Unauthorized` → `NS_API_KEY` is wrong or revoked. Re-run this skill to update.
- `404` or network error → `NS_BASE_URL` is wrong or the instance name doesn't exist on that host.
- Empty array → credentials work, instance just has no agents yet.

## Switching instances

To switch instances, either:

- Re-run this skill (it will offer to edit / replace the existing config), or
- Directly edit `~/.neuralseek-cowork.json` and update `NS_INSTANCE` / `NS_API_KEY`.

Either way, fully quit and restart Cowork after the change.

## Troubleshooting

- **Launcher logs "No config found at ..."** in Cowork MCP logs. The file was not written, or was written to a different path than the launcher expects. Confirm with `ls -la ~/.neuralseek-cowork.json`. On Windows, `~` in a bash mount may not point at the user real profile — resolve the absolute path.
- **Launcher logs "Failed to parse ..."**. The JSON is malformed. Re-run this skill to rewrite it cleanly.
- **Launcher logs "NS_INSTANCE and/or NS_API_KEY are not set"**. Required keys are missing from the JSON. Re-run this skill and fill them in.
- **`list_agents` returns 401.** API key invalid. Request a fresh key from the NeuralSeek UI and re-run this skill.
- **`list_agents` returns 404.** Base URL mismatch. Update `NS_BASE_URL` and restart Cowork.
- **Changes not taking effect.** Cowork was not fully quit between edits. Quit from tray/menu bar and relaunch.

## Alternative: direct env vars

Advanced users who prefer not to use the config file can still set `NS_INSTANCE`, `NS_API_KEY`, etc. as OS-level environment variables. The launcher prefers values from the config file but falls through to `process.env` for any missing key. Setting OS env vars is entirely optional.

## After setup

Suggest next steps:
- Developing a new agent → `neuralseek-agent-development`
- Exploring what exists → `neuralseek-agent-architecture`
- Pulling templates from staging → `neuralseek-agent-library`
- RAG queries → `neuralseek-knowledge-base`
