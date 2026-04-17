---
name: neuralseek-instance-ops
description: Use for operational NeuralSeek tasks — backing up the instance configuration before big changes, syncing agents from the instance into the local workspace, deleting agents, or regenerating the interactive flow map. Triggers on "back up NeuralSeek", "snapshot the instance", "sync agents", "pull latest agents", "delete agent", "regenerate flow map", "before I refactor".
---

# NeuralSeek Instance Operations

Handle operational tasks against the active NeuralSeek instance: backups, syncing, deletion, and flow map regeneration. These are administrative actions that affect the instance or the local workspace state.

## When to use this skill

- User wants to snapshot instance config before a refactor
- User wants to pull latest agents from the instance into the local workspace
- User needs to delete one or more agents
- User wants a fresh flow map after editing agents

## Backups

Always back up before:

- Large refactors
- Deleting agents in bulk
- Changing orchestrator chains
- Testing destructive operations

Run:

```
backup_instance
```

This exports the full instance configuration via the `packConfig` endpoint to `backups/<instance>_<timestamp>.nsconfig` in the workspace.

With a label:

```
backup_instance | label: "before-refactor"
```

→ `backups/<instance>_before-refactor_<timestamp>.nsconfig`

Backups are plain JSON files. Suggest to the user that they commit these to version control or store them somewhere safe.

## Syncing agents

`sync_agents` pulls all agents from the instance into the local workspace under `agents/defaults/` (example agents, always overwritten) and `agents/custom/` (user agents).

Default sync — safe, only adds missing files:

```
sync_agents
```

Force sync — overwrites local edits with the instance's current state:

```
sync_agents | force: true
```

**Warn the user before forcing a sync.** If they have uncommitted local NTL edits in `agents/custom/`, a force sync will overwrite them. Ask them to confirm, and suggest they commit or back up first.

### When to sync

- Before starting work in a project folder (pull latest)
- When another team member adds or modifies agents in the UI
- Before generating a fresh flow map

## Deleting agents

```
delete_agent | agent_names: "agent_name"
```

Or batch delete:

```
delete_agent | agent_names: ["a", "b", "c"]
```

**Always confirm deletion before executing.** Deletion is not recoverable from inside the tool — only the `backup_instance` snapshot can restore. Before deleting:

1. Run `backup_instance | label: "before-delete"` as a safety net.
2. Confirm with the user the exact names to delete.
3. Warn the user if any of the target agents are called by others (use `map_agents` to check). Deleting an agent that is still called will break its callers.
4. Execute the delete.

## Regenerating the flow map

Whenever the user edits `.ntl` files locally, the flow map goes stale. Regenerate:

```
map_agents
```

This updates both `agents/_flow.md` (Mermaid) and `agents/_flow.html` (interactive vis.js). Point the user at the HTML file for the rich view.

Note: `mcpns sync` also auto-regenerates the flow map. If the user just synced, no separate regeneration is needed.

## Multi-instance workflows

The active instance is determined by the `NS_INSTANCE` / `NS_API_KEY` environment variables. Instance-level ops (`backup_instance`, `sync_agents`, `delete_agent`) act on whichever instance those env vars point to.

To run ops against a different instance:

1. Update the `NS_INSTANCE` and `NS_API_KEY` env vars at the user/system level.
2. Fully quit and restart Cowork so the new values are picked up.

See `neuralseek-setup` for the full env-var workflow. Warn the user before they switch — any in-flight agent development context may be against the old instance.

## Handoff

- To understand dependencies before deleting or refactoring: route to `neuralseek-agent-architecture`
- To diagnose issues with a synced agent: route to `neuralseek-agent-debugging`
- To pull additional agent templates from the shared KB staging library: route to `neuralseek-agent-library`
