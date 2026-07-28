# AI Best Practices -- A Practical Guide from Anthropic Courses

**Language:** English | [Turkish](https://github.com/vulonviing/ai-best-practices/blob/main/tr/README.md)

This repo is a distilled summary of 10 courses from Anthropic's [Skilljar](https://anthropic.skilljar.com/) training platform. The goal is not to pile up theory; it is to give someone who wants to use AI **better than average, without spending hours watching videos** a consistent, practical reference they can keep close.

## What Is This Repo Based On?

The concepts were extracted from notes across these 10 courses:

| Course | What It Teaches |
|--------|-----------------|
| **AI Capabilities and Limitations** | How models work (next-token prediction), what they cannot do (hallucination, knowledge cutoff, working memory), and how to diagnose which mechanism caused a mistake. |
| **AI Fluency Framework and Foundations** | The 4D Framework: Delegation, Description, Discernment, Diligence. A universal frame for responsible, effective AI work. |
| **Claude 101** | Claude's core capabilities: Projects, Artifacts, Connectors, Research mode, custom instructions, memory. |
| **Claude Code 101** | The agentic loop in the terminal: explore -> plan -> code -> commit. CLAUDE.md, context management, plan mode. |
| **Claude Code in Action** | Claude Code in real projects: MCP server setup, UI testing with Playwright, GitHub Actions, hooks, SDK. |
| **Introduction to Claude Cowork** | Cowork as a delegation environment that handles files, scheduled tasks, and plugins. |
| **Introduction to agent skills** | Skills: reusable, automatically triggered instruction packages built around SKILL.md. |
| **Introduction to subagents** | Subagents: specialized helpers that run in a separate context without polluting the main chat. |
| **Introduction to Model Context Protocol** | MCP fundamentals: tools, resources, prompts, and client-server architecture. |
| **Model Context Protocol Advanced Topics** | Sampling, logging, transport (stdio / HTTP / streamable), roots, progress notifications. |

## Language Structure

The main repository structure is English. Turkish is kept as an optional mirrored version under [`tr/`](https://github.com/vulonviing/ai-best-practices/blob/main/tr):

- English entry point: [`README.md`](https://github.com/vulonviing/ai-best-practices/blob/main/README.md)
- Turkish entry point: [`tr/README.md`](https://github.com/vulonviing/ai-best-practices/blob/main/tr/README.md)
- English docs stay in the root folders: [`concepts/`](https://github.com/vulonviing/ai-best-practices/blob/main/concepts), [`checker/`](https://github.com/vulonviing/ai-best-practices/blob/main/checker), [`starter-template/`](https://github.com/vulonviing/ai-best-practices/blob/main/starter-template)
- Turkish docs mirror the same structure under [`tr/`](https://github.com/vulonviing/ai-best-practices/blob/main/tr)

## How To Use This Repo

There are three layers:

1. **Skimmable:** [how-to-write-better.md](https://github.com/vulonviing/ai-best-practices/blob/main/how-to-write-better.md) -- all concepts in one file, with real-world examples, without going too deep. Read it over a tea break.
2. **Detailed:** [concepts/](https://github.com/vulonviing/ai-best-practices/blob/main/concepts) -- focused documents for each concept, deep enough without drowning you.
3. **Applied:**
   - [checker/](https://github.com/vulonviing/ai-best-practices/blob/main/checker) -- a drop-in folder that audits an existing project against AI best practices.
   - [starter-template/](https://github.com/vulonviing/ai-best-practices/blob/main/starter-template) -- a fill-in template for starting a new project from zero.

## Navigator

### Quick Start
- **[how-to-write-better.md](https://github.com/vulonviing/ai-best-practices/blob/main/how-to-write-better.md)** -- A skimmable walkthrough of all concepts + examples
- **[prompt-examples.md](https://github.com/vulonviing/ai-best-practices/blob/main/prompt-examples.md)** -- Real-world prompt + follow-up examples you can copy and adapt

### Concept Deep Dives
- **[concepts/prompt-engineering.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/prompt-engineering.md)** -- Prompt writing, few-shot examples, chain-of-thought, XML tagging
- **[concepts/4d-framework.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/4d-framework.md)** -- Delegation, Description, Discernment, Diligence
- **[concepts/ai-capabilities-and-limits.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/ai-capabilities-and-limits.md)** -- What models actually do, hallucination, context windows
- **[concepts/context-management.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/context-management.md)** -- Managing the context window well: compact, clear, @file
- **[concepts/claude-md.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/claude-md.md)** -- CLAUDE.md: how to write project memory
- **[concepts/skills.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/skills.md)** -- Agent Skills: SKILL.md, frontmatter, progressive disclosure
- **[concepts/subagents.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/subagents.md)** -- When to use subagents, and when not to
- **[concepts/mcp.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/mcp.md)** -- Model Context Protocol: tools, resources, transport
- **[concepts/hooks.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/hooks.md)** -- Automation with pre/post-tool-use hooks
- **[concepts/slash-commands.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/slash-commands.md)** -- Custom slash commands
- **[concepts/modes-chat-cowork-code.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/modes-chat-cowork-code.md)** -- Which mode fits which job
- **[concepts/projects-and-memory.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/projects-and-memory.md)** -- Projects, Artifacts, memory, custom instructions
- **[concepts/connectors.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/connectors.md)** -- Google Drive, Slack, Gmail integrations
- **[concepts/file-organization.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/file-organization.md)** -- Folder structure and organization for AI-ready projects
- **[concepts/workflow-patterns.md](https://github.com/vulonviing/ai-best-practices/blob/main/concepts/workflow-patterns.md)** -- Sustainable workflows, iteration, scheduled tasks

### Applied
- **[checker/](https://github.com/vulonviing/ai-best-practices/blob/main/checker)** -- Audit an existing project
- **[starter-template/](https://github.com/vulonviing/ai-best-practices/blob/main/starter-template)** -- Start a new project by filling in the template

---

> This repo is designed as a living document. As the concepts change, the related files should be updated. Each file starts with a short "what this is for / when to read it" section.
