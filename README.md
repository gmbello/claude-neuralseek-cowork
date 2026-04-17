# claude-neuralseek-cowork

A Claude Code / Cowork plugin marketplace for NeuralSeek integrations.

## Install the marketplace

In Claude Code or Cowork:

```
/plugin marketplace add gmbello/claude-neuralseek-cowork
```

Or by URL:

```
/plugin marketplace add https://github.com/gmbello/claude-neuralseek-cowork
```

## Plugins

### neuralseek-cowork-plugin (v0.3.0)

NeuralSeek integration for Cowork. Interactive form-based setup — credentials are collected via `AskUserQuestion` and written to `~/.neuralseek-cowork.json`. Ships seven skills:

- `neuralseek-setup` — first-run credential form and config verification
- `neuralseek-agent-architecture` — inventory and map agent dependencies
- `neuralseek-agent-development` — draft, write, upload, and test NTL agents
- `neuralseek-agent-debugging` — replay runs and trace failures
- `neuralseek-agent-library` — browse and pull templates from a KB instance
- `neuralseek-knowledge-base` — grounded RAG question-answering
- `neuralseek-instance-ops` — backup, sync, delete, regenerate flow map

Install (after adding the marketplace):

```
/plugin install neuralseek-cowork-plugin@claude-neuralseek-cowork
```

Then run the `neuralseek-setup` skill and follow the prompts.

## Layout

```
.claude-plugin/
  marketplace.json          # marketplace manifest
plugins/
  neuralseek-cowork-plugin/
    .claude-plugin/
      plugin.json
    .mcp.json
    bin/launcher.js
    skills/
      neuralseek-setup/
      neuralseek-agent-architecture/
      neuralseek-agent-development/
      neuralseek-agent-debugging/
      neuralseek-agent-library/
      neuralseek-knowledge-base/
      neuralseek-instance-ops/
    README.md
```
