---
name: neuralseek-agent-development
description: Use when the user wants to create, write, edit, generate, upload, or test a NeuralSeek (mAIstro) agent. Covers the full NTL development cycle — draft with generate_ntl, write to disk with create_agent, save to the instance with upload_agent, and test with call_agent or run_agent. Triggers on "create a NeuralSeek agent", "build an NTL agent", "write an agent that...", "generate NTL", "upload this agent", "test my agent", "fix the NTL in...".
---

# NeuralSeek Agent Development

Guide the user through the full agent development lifecycle on NeuralSeek mAIstro. Agents are built in **NTL (NeuralSeek Template Language)** — a pipe-delimited, node-based DSL.

## Before writing any NTL

Always load the bundled NTL reference into context before drafting or editing an agent. It contains the complete 140+ node catalog, correct parameter names, syntax rules, and integration patterns:

- Read `references/ntl-reference.md` (bundled in this skill).

For known silent failure modes (Postgres param binding, variable scoping, REST call quirks, sub-agent pitfalls), also read the MCP resource:

- `ntl://gotchas` — read this before writing any agent that uses Postgres, REST calls, or sub-agents.

Do not skip either step. Agents written without consulting the reference and gotchas have a high failure rate.

## The six-step development cycle

Every time the user is creating, fixing, testing, or touching any agent, follow this cycle exactly:

1. **Find** — Use `list_agents` or `get_agent` to retrieve the current state of named agents. If modifying an existing agent, pull its NTL source with `get_agent` first.
2. **Edit** — Use `create_agent` to write or overwrite a local `.ntl` file in `agents/custom/`. Do not stream raw NTL inline as a response — always write to a file.
3. **Upload** — Use `upload_agent` to save the local file to the NeuralSeek instance. Never skip this step. Without uploading, `call_agent` cannot reach the new version.
4. **Run** — Use `call_agent` with the agent's saved name to test the uploaded version. For local-file testing during rapid iteration (before uploading), `run_agent` is acceptable, but the canonical test is against the saved named agent.
5. **Debug** — If the output is wrong, hand off to the `neuralseek-agent-debugging` workflow: call `get_logs` to find the run ID, then `replay_run` for the full step trace.
6. **Iterate** — If broken, return to step 2 and repeat. Do not try to patch in place from memory.

## Drafting a new agent

If the user is starting fresh and has only a plain-English description:

1. Call `generate_ntl` with the description to produce a syntactically valid draft using the latest platform functions.
2. **Refine the draft** — never ship the raw output as-is. Apply these passes:
   - Tighten verbose LLM prompts to one instruction per node.
   - Chain outputs with `=> {{ variable | name: "x" }}` instead of re-prompting.
   - Remove redundant nodes.
   - Apply any gotchas from `ntl://gotchas` (especially Postgres and REST).
3. Pass the refined NTL to `create_agent`, then `upload_agent`, then `call_agent`.

## Editing an existing agent

1. `get_agent` with the exact agent name to retrieve current NTL.
2. Read the NTL carefully before changing anything. Identify what node types are in use, what variables flow through the graph, and whether sub-agents are called.
3. Make targeted edits. Preserve the overall node structure unless the user asked for a redesign.
4. `create_agent` to write the updated file, `upload_agent` to save, `call_agent` to test.

## Naming conventions

- Agent names: alphanumeric + underscores (e.g. `my_report_agent`, `credit_check_v2`).
- Keep names descriptive and versioned when substantially redesigning (`v1`, `v2`) to avoid silently breaking callers of a prior version.

## Parameter passing

NeuralSeek agents accept key-value parameters via the `params` field. When calling an agent:

- Pass params as a flat object of string keys and string values.
- Complex objects must be serialized to JSON strings before passing.
- Document the agent's expected params in the NTL comments so the calling side knows what to supply.

## Streaming vs. synchronous runs

- `call_agent` and `run_agent` — synchronous, returns complete response. Use for short agents (< 30 seconds).
- `run_agent_stream` — SSE-based, collects all chunks and returns the full answer. Use when an agent does long-running work (multi-step chains, large LLM prompts, heavy REST calls).

Default to `call_agent` for saved agents. Use `run_agent_stream` when the user reports timeouts or when the agent is expected to run long.

## Common pitfalls

- **Skipping `upload_agent`.** A local file change is invisible to the instance until uploaded. `call_agent` will run the old version.
- **Editing from memory.** Always `get_agent` first to pull current NTL. The local `agents/custom/<name>.ntl` may be stale if someone else edited on the instance.
- **Streaming raw NTL inline.** Write files. Never paste a giant NTL block as a chat response and call it done.
- **Ignoring gotchas for Postgres/REST/sub-agents.** Read `ntl://gotchas` every time.

## Handoff

If the user's agent is failing at runtime and the NTL looks correct, hand off to `neuralseek-agent-debugging`.
