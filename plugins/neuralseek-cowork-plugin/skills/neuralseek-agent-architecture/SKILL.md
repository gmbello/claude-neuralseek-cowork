---
name: neuralseek-agent-architecture
description: Use when the user wants to inventory, explore, or understand the structure of agents in their NeuralSeek instance — listing agents, viewing agent NTL source, mapping dependencies between agents, finding orchestrators vs. leaf agents, or generating a visual flow map. Triggers on "show all agents", "list agents", "what agents do I have", "map agent dependencies", "agent architecture", "show me the NTL for...", "visualize agent flow", "which agent calls which".
---

# NeuralSeek Agent Architecture

Inventory and map the structure of agents on the active NeuralSeek instance. Use this skill to help the user understand what exists, how agents relate to each other, and where the orchestrators and leaf agents live.

## When to use this skill

- User wants a listing of all agents
- User wants to see the NTL source of a specific agent
- User wants to understand which agents call which (dependency graph)
- User is about to modify a multi-agent chain and needs to see the architecture first

## Listing agents

Two listing tools exist. Pick based on need:

- **`list_agents`** — name + description only. Fast. Use when the user just wants to know what exists.
- **`list_agents_full`** — full NTL source, schedules, registries, metadata. Heavier. Use when the user wants to inspect or export agent contents at scale.

Default to `list_agents` and offer to pull full details for any agent the user wants to inspect.

```
list_agents | limit: 50
```

For larger inventories:

```
list_agents_full | limit: 500
```

## Viewing a single agent

Pull the full NTL source and metadata of a named agent:

```
get_agent | agent_name: "<exact name>"
```

Agent names are case-sensitive and must match exactly. If the user does not remember the exact name, call `list_agents` first to find it.

When presenting NTL source to the user:

- Show the full NTL in a code block so it renders cleanly.
- Summarize at the top: what the agent does, what params it takes, what nodes it uses, whether it calls sub-agents.
- Call out any sub-agent calls explicitly — they are the foundation of chain architecture.

## Dependency mapping

When the user wants to understand how agents relate:

```
map_agents
```

This parses all `.ntl` files in the workspace `agents/` directory and returns the full dependency graph as text:

- **Orchestrators** — agents with outgoing calls, not called by others
- **Intermediate agents** — called by others AND call others
- **Leaf agents** — endpoints, called but call nothing

It also regenerates two files:

- `agents/_flow.md` — Mermaid diagram (view in VS Code with Mermaid preview)
- `agents/_flow.html` — interactive vis.js graph (open in browser, click nodes for vscode:// navigation)

Point the user to `agents/_flow.html` for the richest view — it supports zoom, drag, subgraph filtering by orchestrator, and a click-to-inspect node panel showing callers, callees, and params.

### Node colors in the flow map

- Red — orchestrator
- Yellow — intermediate
- Green — leaf

### Prerequisite

`map_agents` only reads **local** `.ntl` files. If the user has not synced, agents on the instance will not appear in the map. Run `sync_agents` first if the workspace is stale (see `neuralseek-instance-ops`).

## Pre-modification architectural review

Before the user starts changing a multi-agent chain, always:

1. `map_agents` to see the current graph
2. Identify orchestrators and the user's target agent's role (orchestrator, intermediate, leaf)
3. Note who calls the target agent — those callers may break if params or return shape change
4. Tell the user which downstream agents will be affected by their edit

This prevents silent breakage of chains.

## Exporting the full inventory

If the user wants a flat file export of all agents:

1. `list_agents_full | limit: 500` to pull everything
2. Save the output to a structured file (JSON or Markdown catalog) in their workspace
3. Include name, description, NTL source, and any scheduling metadata

## Handoff

- To modify an agent you inventoried: route to `neuralseek-agent-development`
- To debug a chain you mapped: route to `neuralseek-agent-debugging`
- To pull additional templates from a shared staging library: route to `neuralseek-agent-library`
