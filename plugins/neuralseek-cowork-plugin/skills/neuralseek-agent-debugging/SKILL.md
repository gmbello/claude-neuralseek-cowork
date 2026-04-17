---
name: neuralseek-agent-debugging
description: Use when a NeuralSeek agent run fails, returns unexpected output, or the user wants to trace what happened inside a multi-agent chain. Uses get_logs to find the run, then replay_run to see every node, variable, sub-agent call, and REST result. Triggers on "debug agent", "why did my agent fail", "replay run", "show agent logs", "trace this run", "what happened in the agent", "agent returned wrong output".
---

# NeuralSeek Agent Debugging

Diagnose failed or unexpected agent runs using the NeuralSeek mAIstro log and replay system. Every agent invocation — including every sub-agent call inside a multi-agent chain — creates its own log entry with its own run ID. Sub-agents can be replayed independently of their parent.

## When to use this skill

- Agent returned wrong output or empty response
- User reports a timeout or runtime error
- Multi-agent chain behaved unexpectedly
- User asks to "see the steps" of a past run

## Debugging workflow

1. **Reproduce or identify the failing run.** Ask the user: did this just happen, or is it a previous run? If just now, the run is at the top of the logs.

2. **List recent runs** with `get_logs`:
   ```
   get_logs | limit: 20
   ```
   Each entry includes: run ID, agent name, date, timing. Find the run matching the agent name and timestamp.

3. **Replay the run** with `replay_run`:
   ```
   replay_run | run_id: <id from get_logs>
   ```
   This returns the full step-by-step render trace: every NTL node executed, variable values at each step, LLM prompts and completions, REST request/response payloads, sub-agent call boundaries.

4. **Analyze the trace** for common failure signatures (see below).

5. **Form a diagnosis.** Explain to the user: which node failed, what value was wrong, and why. Cite specific nodes from the trace.

6. **Hand off to `neuralseek-agent-development`** if the fix requires NTL changes.

## Multi-agent chain debugging

When a user's agent calls sub-agents, each sub-agent invocation has its own run ID. If the failure is inside a sub-agent:

1. Replay the parent run first with `replay_run` to find which sub-agent was called and what params were passed.
2. Look at the timestamp of that sub-agent call.
3. Call `get_logs` again — the sub-agent will have its own log entry near that timestamp.
4. Replay the sub-agent's run ID independently. Its trace shows the sub-agent's internal steps without the parent's noise.

Iterate this pattern to drill into any depth of the chain.

## Common failure signatures

Before deep analysis, consult the MCP resource `ntl://gotchas` — it documents silent failure modes that do not raise clear errors in the trace.

- **Postgres param binding.** Trace shows the query executed but returned no rows. Likely unbound or incorrectly named params. Check `ntl://gotchas` for Postgres param syntax.
- **REST call returns empty.** Trace shows a 200 response with empty body. Check the URL interpolation, headers, and response parsing node.
- **Variable is undefined at a later node.** Scope issue. Variables defined inside a loop or conditional are often not visible after. Confirm with `ntl://gotchas` on variable scoping.
- **Sub-agent returned wrong output.** Do not debug from the parent trace alone — isolate the sub-agent run and replay it directly.
- **LLM node returned generic or empty output.** The prompt was likely too long or had unresolved `<< >>` variables. Check for literal variable references leaking into the rendered prompt.

## Reading a replay trace

A replay trace is chronological. Work through it step by step:

- Note each node's type and output.
- Track the flowing variables — which ones are set, what their values are, and whether they change as expected.
- When output stops matching expectations, you have found the failing node.

If the trace is long (more than ~50 steps), ask the user which intermediate variable or output they expect — then jump directly to the node that produces or consumes it.

## After fixing

Once you identify the broken node and the user wants to fix it:

1. Route to `neuralseek-agent-development`.
2. `get_agent` to pull current NTL.
3. Apply the targeted fix.
4. `create_agent` → `upload_agent` → `call_agent` to validate.
5. Replay the new run to confirm the failure is gone.
