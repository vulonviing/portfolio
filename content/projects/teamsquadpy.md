# Manager Squad

Manager Squad is a football analytics package built around event data, typed domain models, a tactical feature pipeline, and a department-style agent architecture for team analysis.

The project has moved into **Phase 3**. The data and feature layers are in place, and the first football department has been implemented on top of them.

## Project Status

### Phase 1
- Core domain models for competitions, teams, players, matches, lineups, and event types
- Provider-agnostic data interfaces
- StatsBomb Open Data integration
- Raw JSON parsing into typed Python objects
- Local JSON cache support

### Phase 2
- Event-level annotations
- Possession-level feature extraction
- Team-match tactical feature extraction
- Feature registry and pipeline orchestration
- Unit tests for parsing, repository behavior, and feature computation

### Phase 3
- Department-style orchestration is now live
- The first department, `TeamUnderstandingDepartment`, is implemented
- Team-name driven analysis flow is implemented
- Notebook-driven test drive is implemented
- Cache inspection CLI is implemented

## What Is Implemented

### Data Layer
- Provider-agnostic `DataLoader` interface
- `StatsBombLoader` for remote or local StatsBomb Open Data access
- `MatchRepository` for competitions, matches, events, and lineups
- `CacheManager` for file-based JSON caching
- Team-name driven scoped collection via `TeamMatchCollector`

### Domain Layer
- Typed dataclass models for competitions, teams, players, lineups, matches, and event subclasses such as passes, shots, carries, pressures, duels, recoveries, and goalkeeper actions

### Feature Layer
- Event annotations: progressive passes, progressive carries, final-third entries, penalty-area entries, pressing height flags, zone labels, and channel labels
- Possession features: chain length, duration, pass count, carry distance, territorial progression, and possession end type
- Team-match features: build-up patterns, pressing and PPDA, transition metrics, and progression metrics

### Phase 3 Layer
- `TeamUnderstandingDepartment`
- SVG-inspired hierarchy with controller, manager, staff analysts, and validators
- Decision-circle trace: `sense -> analyze -> decide -> act -> validate`
- Team-name analysis service via `TeamUnderstandingService`
- Notebook test drive in [phase3_test_drive.ipynb](https://github.com/vulonviing/TeamSquadpy/blob/main/phase3_test_drive.ipynb)
- Available-data CLI via `python -m manager_squad available-data`

## Architecture

```text
StatsBomb Open Data / Local Cache
                |
                v
         StatsBombLoader
                |
                v
         StatsBombParser
                |
                v
          Domain Models
                |
                v
         MatchRepository
                |
                v
         FeaturePipeline
                |
                v
   Structured Football Feature Layers
                |
                v
   Department-Style Agent Orchestration
                |
                v
 Team Understanding Department
```

## Department Catalog

### Implemented Department

#### Team Understanding Department

Purpose:
Understands a team by combining match context, player usage, tactical features, event patterns, and validation into one department report.

Hierarchy:
- `TeamUnderstandingDepartment`: top-level decision orchestrator
- `TeamUnderstandingController`: builds shared context and publishes the department output
- `TeamUnderstandingManager`: synthesizes all analyst reports into the final team identity
- `EvidenceAuditValidator`: checks evidence coverage and support quality
- `ConsistencyWatchdog`: checks whether the analyst outputs are coherent together

Staff analysts:
- `press_analyst`: analyzes pressing behavior and disruption profile
- `transition_analyst`: analyzes transition speed, regain behavior, and carrying profile
- `defense_analyst`: analyzes defensive access conceded, ball-winning, and box protection
- `midfield_analyst`: analyzes midfield control, progression, and tempo access
- `attack_analyst`: analyzes shot production, xG, and finishing profile
- `set_piece_analyst`: analyzes set-piece event volume and threat
- `penalty_analyst`: analyzes penalty sample and taker visibility
- `goalkeeper_analyst`: analyzes goalkeeper involvement and build-up footprint
- `squad_analyst`: analyzes trusted starters, squad usage, and player involvement

Current behavior:
- Each analyst is currently deterministic
- Analysts read structured football features and produce role-specific reports
- The manager synthesizes those reports into one team identity
- An optional GPT-5.4 review can be run at the end of the notebook as an extra pass

### Planned Departments

These are not implemented yet, but they are the intended next department families:
- `TeamAnalysisDepartment`
- `TeamCharacterDepartment`
- `PlayerUnderstandingDepartment`
- `PlayerAnalysisDepartment`
- `OpponentTeamAnalysisDepartment`
- `OpponentPlayerDepartment`

The long-term goal is to connect these departments into a circle of communicating football analysis agents.

## Current Phase 3 Limitation

The current staff analysts are not yet individually powered by an LLM. Right now:
- department analysts are deterministic
- the manager synthesis is deterministic
- GPT-5.4 is only used in the notebook as an optional final review

This is intentional for the first Phase 3 step because it stabilizes the department contracts, report schema, and hierarchy before introducing live LLM reasoning.

## Next Step

The next major step is:

### LLM-Backed Staff Analysts

Goal:
Move from deterministic analyst reports to true role-based football agents.

Planned direction:
- Each staff analyst will get its own GPT-5.4-backed prompt and reasoning pass
- The manager will synthesize analyst outputs with a second GPT-5.4 pass
- The existing structured feature layer will remain the evidence base for those prompts
- Notebook output will show per-analyst LLM responses directly, not only the final optional review

This is the main planned upgrade for the current department before additional departments are added.

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

If you want optional OpenAI notebook calls:

```bash
pip install -e .[llm]
export OPENAI_API_KEY="your_api_key_here"
```

## Quick Start

### 1. Explore Available Cached Data

```bash
python -m manager_squad available-data --cache-dir test_cache
```

Example filters:

```bash
python -m manager_squad available-data --cache-dir test_cache --team Portugal
python -m manager_squad available-data --cache-dir test_cache --competition "World Cup" --show-teams
python -m manager_squad available-data --cache-dir test_cache --format json
```

### 2. Run The Team Understanding Department By Team Name

```python
from pathlib import Path

from manager_squad import TeamUnderstandingService
from manager_squad.agents import TeamUnderstandingDepartment
from manager_squad.data.cache import CacheManager
from manager_squad.data.repository import MatchRepository
from manager_squad.data.statsbomb import StatsBombLoader
from manager_squad.data.team_collection import TeamQueryScope

cache = CacheManager(cache_dir=Path("test_cache"))
loader = StatsBombLoader(cache=cache)
repository = MatchRepository(loader=loader)

department = TeamUnderstandingDepartment()
service = TeamUnderstandingService(repository=repository, department=department)

run = service.analyze_team_name(
    team_name="Portugal",
    scope=TeamQueryScope(match_limit=3, require_cached_payloads=False),
)

report = run.report
scope = run.collection.scope.to_dict()

print(report.identity_label)
print(report.executive_summary)
print(scope)
```

### 3. Run The Notebook Test Drive

Use [phase3_test_drive.ipynb](https://github.com/vulonviing/TeamSquadpy/blob/main/phase3_test_drive.ipynb) to:
- inspect available competitions, teams, and matches
- insert an API key at the top if desired
- enter a team name in a single `TEAM NAME?` cell
- run all staff analysts one by one
- read the final manager summary
- optionally run a GPT-5.4 review

## Notebook Flow

The Phase 3 notebook is organized in this order:
- OpenAI API key cell
- Available-data CLI output
- Available competitions, teams, and sampled matches
- Department hierarchy introduction
- `TEAM NAME?` input cell
- Team scope and selected match window
- Staff analyst markdown Q&A
- Manager summary
- Optional GPT-5.4 review

If a team is not already cached, the notebook is designed to try downloading missing match payloads and cache them locally. If the remote request fails, the notebook will explain that clearly.

## Development

Run tests:

```bash
pytest -q
```

Run linting:

```bash
ruff check .
```

Run type checks:

```bash
mypy manager_squad
```

## Repository Notes

- `test_cache/` contains local cached data for experimentation and should usually stay out of Git
- [phase3_test_drive.ipynb](https://github.com/vulonviing/TeamSquadpy/blob/main/phase3_test_drive.ipynb) is the current Phase 3 walkthrough notebook
- `__pycache__/` and `.pytest_cache/` are generated artifacts and should be ignored

## License

MIT
