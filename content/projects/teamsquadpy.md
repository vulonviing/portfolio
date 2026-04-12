# Manager Squad

Manager Squad is an agentic football analysis system built around a simple idea:
instead of asking one model to explain an entire match in one shot, we let a
structured team of specialist AI agents study the same match data through
different tactical lenses, then escalate their findings through a coaching
pyramid.

This repository is the current implementation of that broader TeamSquad vision.
It is still evolving, and the design will continue to be updated, but the core
direction is already clear:

- one football problem
- many specialized agents
- one shared data packet
- layered reasoning instead of one flat answer
- a final coaching decision produced through synthesis

## Vision

The long-term goal is to build a true AI football staff: a TeamSquad made of
specialist, opinionated, agentic roles that can read the same match from
different perspectives and argue toward a more useful conclusion.

The project is not trying to simulate "chat for the sake of chat." The real aim
is to create a structured analytical organization:

- leaf analysts read raw football patterns
- upper departments convert those findings into tactical concepts
- assistant coaches reinterpret the whole picture through different game models
- the head coach makes the final football decision

Over time, this system is expected to become richer, more opinionated, and more
useful as an exploratory research tool for tactical analysis.

## Core Idea

StatsBomb event data is valuable, but limited. Because of that, Manager Squad
does not rely on one monolithic prompt. Instead, it uses a hierarchy:

1. lower departments produce specialized readings
2. upper departments synthesize those readings into bigger football concepts
3. assistant coaches reinterpret the synthesis through distinct philosophies
4. the head coach delivers the final technical verdict

This makes the pipeline easier to debug, easier to extend, and much closer to
the idea of a real coaching staff than a single generic LLM response.

## The Pyramid

The default pyramid has four layers.

### 1. Leaf Departments

Leaf agents are the first readers of the shared match context. Each one is a
separate LLM call with its own identity and markdown prompt.

Examples:

- defense
- midfield
- attack
- pressing
- transition play
- forward analysis
- midfielder analysis
- defender analysis
- team identity
- opponent analysis
- diagonal passing
- passing
- surprise player
- set pieces
- tempo
- width
- ball winning
- discipline and risk
- goalkeeper

Each leaf agent returns structured JSON with:

- `summary`
- `verdict`
- `observations`
- `evidence`
- `risks`
- `recommendations`

### 2. Upper Departments

Upper departments do not simply repeat leaf outputs. They combine them into
higher-level football concepts.

Examples:

- shape and formation interpretation
- player profile synthesis
- matchup interpretation
- game model synthesis
- special situations synthesis

### 3. Assistant Coaches

Assistant coaches read the upper layer through distinct football ideologies.

Current default assistants:

- control-oriented assistant
- attack-oriented assistant
- defense-oriented assistant

They look at the same tactical picture, but prioritize different tradeoffs.

### 4. Head Coach

The head coach reads the full assistant layer and produces the final decision.

The final report includes:

- `summary`
- `verdict`
- `tactical_identity`
- `match_narrative`
- `executive_summary`
- `assistant_takeaways`
- `strategic_priorities`
- `risk_management`
- `final_message`

## Agentic Design

This project is intentionally agentic.

That means:

- every department is an explicit role
- every role has its own markdown prompt contract
- every role runs as its own LLM session/call
- outputs move upward through the pyramid
- upper layers consume full structured JSON, not just short summaries

This is important. The system is not just a list of prompts. It is an
orchestrated team structure.

## Prompt Architecture

Prompts are stored as markdown files instead of large inline strings in Python.
That keeps the system easier to inspect, edit, and evolve.

```text
manager_squad/agents/prompts/
├── leaf/
├── upper/
├── assistants/
└── head_coach/
```

Each prompt file defines the role's:

- character
- task
- tactical lens
- interpretation rules
- output contract

This setup was inspired by prompt-as-files best practices and fits the
TeamSquad idea much better than embedding all behavior inside code.

## Shared Match Context

All agents read the same base context, but interpret it differently.

The shared context currently includes:

- match window summary
- operational metrics
- performance metrics
- behavioral feature layers
- department briefs
- player leaders
- player units
- player profiles
- team patterns
- data availability notes

Recent improvements added richer player-level and pattern-level context so
agents can reason more concretely about:

- named players
- zones and corridors
- pass directions and pass types
- passing links
- carry profiles
- shooting profiles
- defensive action locations
- shape clues from lineups and event positions

## Data Limits

Manager Squad is grounded in StatsBomb-style event data, not tracking data.

The system can use:

- player names and nominal lineup positions
- event locations
- pass start/end points, angles, lengths, heights, recipients
- switches, through balls, crosses, cut-backs
- carry geometry
- shot xG and shot context
- pressures, recoveries, interceptions
- possession and buildup summaries

The system should not pretend to know:

- player height
- body weight
- maximum sprint speed
- acceleration and deceleration
- tracking-based off-ball running speed
- exact inter-line distances from tracking data

This limitation is now explicitly exposed to agents through the context so they
can avoid inventing unsupported claims.

## Why This Matters

A normal match-analysis prompt often collapses into vague language:
"technically strong players," "good attacking quality," "dangerous transitions."

Manager Squad is trying to move away from that. The current design pushes agents
to be more concrete:

- name the players
- mention the corridor
- mention the mechanism
- mention the pass or carry pattern
- mention the tactical risk

The system is still a work in progress, but that is the direction.

## Current Runtime

Default model:

- `gemma4:e4b`

Default local runtime:

- `Ollama`
- `http://127.0.0.1:11434`

## Progress Tracking

Long runs can be monitored step by step.

The package includes:

- progress callbacks
- live stage updates
- notebook-friendly loading UI
- per-agent started/completed/failed events

This makes it much easier to understand where the pyramid is spending time and
which analyst is currently running.

## Department Selection

You do not need to run the full pyramid every time.

Examples:

- `department_selection="all"` runs the full default pyramid
- `department_selection=["athena_defense_department", "gaia_ball_winning_department"]`
  runs only those selected departments
- `department_selection=["gaia_ball_winning_department", "mnemosyne_game_model_department"]`
  runs a narrow debug path across tiers

This is especially useful for prompt debugging and fast iteration.

## Notebook Demo

The main notebook is:

- `pyramid_showcase.ipynb`

It is meant to be both a walkthrough and a working demo. It currently shows:

- environment preflight
- Ollama/model readiness
- data source and cache checks
- team selection
- match-window collection
- shared context preview
- department selection
- live pyramid execution with progress monitoring
- verdict-focused outputs
- raw/debug views when needed

## Project Structure

```text
manager_squad/
├── core/
├── data/
├── features/
├── llm/
├── agents/
│   ├── base.py
│   ├── llm.py
│   └── prompts/
├── orchestration/
│   ├── context.py
│   ├── progress.py
│   ├── squad.py
│   └── team_analysis_service.py
└── tests/
```

## Quick Start

### 1. Start Ollama and pull the model

```bash
ollama serve
ollama pull gemma4:e4b
ollama list
```

### 2. Create the default orchestrator

```python
from manager_squad import DepartmentPyramidOrchestrator, OllamaChatConfig

config = OllamaChatConfig(model="gemma4:e4b")
orchestrator = DepartmentPyramidOrchestrator.from_ollama(
    config,
    department_selection="all",
)
```

### 3. Run an analysis

```python
from manager_squad import MatchRepository, TeamAnalysisService, TeamQueryScope

service = TeamAnalysisService(repository=repository, orchestrator=orchestrator)
run = service.analyze_team_name("Team A", scope=TeamQueryScope(match_limit=3))
report = run.report
```

### 4. Use the outputs

Useful report fields:

- `report.leaf_reports`
- `report.upper_reports`
- `report.assistant_reports`
- `report.head_coach_report`
- `report.tactical_identity`
- `report.executive_summary`
- `report.to_markdown()`

## Validation

For local verification:

```bash
pytest
ruff check manager_squad tests
```

## Status

This README reflects the current state of the project, not its final form.
Manager Squad is still being shaped into a stronger TeamSquad system with better
reasoning, richer tactical detail, and more reliable football interpretation.

The architecture is already in place.
The prompts, data layers, and analysis quality will continue to evolve.
