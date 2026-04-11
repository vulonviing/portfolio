# Mini Finance Dashboard

Production-oriented macroeconomic and financial dashboard built with Python and Dash, enhanced with a multi-agent AI intelligence system for daily market analysis.

---

## Features

- Compare macro indicators across 10 supported countries.
- Track market assets and sector ETFs with daily cached data.
- Simulate historical investments in FX, gold, indices, ETFs, and interest-bearing products.
- **Agentic AI System** — 20 AI agents gather real-time news, produce analyst signals, and generate a sector summary snapshot.
- Modular architecture easy to extend with additional data providers or storage backends.

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Macro indicators, market board, ETF performance |
| Agentic AI | `/agents` | AI agent system — news gathering + analyst reports |

---

## Agentic AI System

The dashboard includes a three-phase multi-agent pipeline. News agents browse the internet for current developments, analyst agents convert those conclusions into investment signals, and a summary agent compresses the sector calls into a top-of-page snapshot.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PHASE 1: NEWS AGENTS                    │
│                  (Web Search — Real-Time)                   │
│                                                             │
│  Atlas  Machiavelli  Cicero  Hippocrates  Enzo              │
│  Aegis  Turing  Silicon  Pixel  Ada                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ conclusions passed as context
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   PHASE 2: ANALYST AGENTS                   │
│                  (No Web Search — Analysis)                 │
│                                                             │
│  Spartan  Quantum  Nexus  Torque  Muse                      │
│  Vitalis  Volt  Oracle  Keynes                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   PHASE 3: SUMMARY AGENT                    │
│                 (Sector Snapshot — No Search)               │
│                                                             │
│  Beacon                                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
            Dashboard — Sector Summary + Final Reports
```

News agents run in parallel (2 workers) with automatic retry on rate limits. Once all complete, their combined output is fed as a single context block to the analyst agents, which also run in parallel. After the analyst phase finishes, the summary agent creates the sector snapshot shown at the top of the Agentic AI page.

---

### News Agents

These agents use the OpenAI web search API to fetch **real-time news** from the internet before generating their reports.

| Agent | Character | Coverage |
|-------|-----------|----------|
| **Atlas** | Veteran war correspondent — 30+ years in conflict zones, analytical and cold-blooded | Geopolitical wars, armed conflicts, military tensions, NATO/UN statements |
| **Machiavelli** | International relations strategist and think-tank advisor — reads power beneath diplomacy | Trade wars, US-China rivalry, EU internal tensions, sanctions, tech wars |
| **Cicero** | Political commentator and former economics editor — evaluates politics through market impact | Central bank decisions, fiscal policy, elections, domestic regulations |
| **Hippocrates** | Health sector editor and biotech analyst — separates real clinical progress from hype | Pandemics, FDA/EMA approvals, drug trials, biotech M&A, digital health |
| **Enzo** | Automotive industry analyst — named after Enzo Ferrari, pragmatic and sector-deep | EV market, Tesla/BYD/Toyota news, battery costs, emission regulations |
| **Aegis** | Defense industry analyst and former defense editor — named after the mythological shield | Defense contracts, procurement budgets, NATO spending, drone tech, cyber |
| **Turing** | AI researcher and tech journalist — named after Alan Turing, hype-skeptical | Model launches, AI investment rounds, regulation, enterprise adoption |
| **Silicon** | Hardware journalist — obsessed with semiconductors, translates specs to market impact | NVIDIA/AMD/Intel, GPU demand, TSMC capacity, chip export controls |
| **Pixel** | Mobile sector journalist — tracks the full smartphone and wearables ecosystem | Apple/Samsung/Xiaomi launches, 5G rollout, App Store economics, mobile payments |
| **Ada** | Senior tech editor — named after Ada Lovelace, covers what other agents miss | Cloud computing, cybersecurity, SaaS, fintech, antitrust, tech IPOs |

---

### Analyst Agents

These agents receive the combined news conclusions as context and produce **investment signals** for their respective domains. They do **not** access the internet directly.

| Agent | Character | Domain | ETFs Covered |
|-------|-----------|--------|--------------|
| **Spartan** | Defense sector portfolio analyst — disciplined, strategic | Defense ETFs | ITA, XAR |
| **Quantum** | Senior tech portfolio analyst — growth vs. valuation discipline | Technology ETFs | XLK, VGT |
| **Nexus** | AI & robotics ETF specialist — cuts through AI hype | AI & Robotics ETFs | AIQ, BOTZ |
| **Torque** | Automotive sector analyst — EV vs. ICE pragmatist | Automotive ETFs | CARZ, DRIV |
| **Muse** | Creative industries analyst — connects cultural trends to financials | Entertainment ETFs | PEJ, HERO |
| **Vitalis** | Healthcare sector analyst — pipeline and regulatory focus | Healthcare ETFs | XLV, VHT |
| **Volt** | Energy & commodities analyst — reads geopolitics through oil prices | Energy ETFs | XLE, VDE |
| **Oracle** | Global market strategist — 20+ years across all asset classes | All markets (indices, FX, commodities) | — |
| **Keynes** | Chief macroeconomist — named after J.M. Keynes, covers all 10 tracked countries | Macro (10 countries) | — |

---

### Summary Agent

| Agent | Character | Output |
|-------|-----------|--------|
| **Beacon** | Sector summary strategist — distills analyst reports into a decision-first snapshot | Per-sector signal, confidence, keywords, and one-line reason |

---

### AI Configuration

Create or edit `ai_config.yaml` in the project root (already gitignored):

```yaml
openai:
  api_key: "YOUR_OPENAI_API_KEY_HERE"
  model: "gpt-4o-mini"
  temperature: 0.7
  timeout: 60
  max_tokens_news: 2000
  max_tokens_analyst: 3000
```

> **Note:** `ai_config.yaml` is listed in `.gitignore` and will never be committed.

---

### Available Models & Compatibility

The model you select is used by **analyst agents**. News agents always use the best available search-capable model automatically.

#### Analyst Models (your selection)

| Family | Model | Works | Notes |
|--------|-------|-------|-------|
| GPT-5.4 | `gpt-5.4` | ✅ | Newest flagship |
| GPT-5.4 | `gpt-5.4-pro` | ✅ | Premium reasoning |
| GPT-5.4 | `gpt-5.4-mini` | ✅ | Fast & cheap, recommended |
| GPT-5.4 | `gpt-5.4-nano` | ✅ | Ultra-fast |
| GPT-5.3 | `gpt-5.3-codex` | ✅ | Code-optimized |
| GPT-5.2 | `gpt-5.2` | ✅ | Flagship |
| GPT-5.2 | `gpt-5.2-pro` | ✅ | Premium reasoning |
| GPT-5.2 | `gpt-5.2-codex` | ✅ | Code-optimized |
| GPT-5.1 | `gpt-5.1` | ✅ | Improved GPT-5 |
| GPT-5.1 | `gpt-5.1-codex` | ✅ | |
| GPT-5.1 | `gpt-5.1-codex-max` | ✅ | Max code performance |
| GPT-5.1 | `gpt-5.1-codex-mini` | ✅ | Fast code |
| GPT-5 | `gpt-5` | ✅ | Next-gen flagship |
| GPT-5 | `gpt-5-pro` | ✅ | Premium reasoning |
| GPT-5 | `gpt-5-mini` | ✅ | Efficient |
| GPT-5 | `gpt-5-nano` | ✅ | Ultra-fast |
| GPT-5 | `gpt-5-codex` | ✅ | Code-optimized |
| GPT-4.1 | `gpt-4.1` | ✅ | Improved GPT-4 |
| GPT-4.1 | `gpt-4.1-mini` | ✅ | Fast |
| GPT-4.1 | `gpt-4.1-nano` | ✅ | Fastest |
| GPT-4o | `gpt-4o` | ✅ | Strong multimodal |
| GPT-4o | `gpt-4o-mini` | ✅ | Fast & affordable |
| GPT-4 | `gpt-4-turbo` | ✅ | Large context |
| GPT-4 | `gpt-4` | ✅ | Original GPT-4 |
| o-series | `o4-mini` | ✅ | Fast reasoning |
| o-series | `o3` | ✅ | Advanced reasoning |
| o-series | `o3-mini` | ✅ | Fast reasoning |
| o-series | `o1` | ✅ | Deep reasoning |
| o-series | `o1-pro` | ✅ | Premium reasoning |
| GPT-3.5 | `gpt-3.5-turbo` | ✅ | Cheapest option |

#### News Agent Models (automatic, not user-selectable)

News agents always use a **web search-capable** model regardless of your analyst model selection. The mapping is automatic:

| Your selected model | News agent uses |
|--------------------|-----------------|
| Any GPT-5.x model | `gpt-5-search-api` |
| `gpt-4o` | `gpt-4o-search-preview` |
| `gpt-4o-mini` | `gpt-4o-mini-search-preview` |
| `gpt-4-turbo`, `gpt-4` | `gpt-4o-search-preview` |
| `gpt-3.5-turbo` | `gpt-4o-mini-search-preview` |
| o-series models | `gpt-5-search-api` |

> **Rate limits:** `gpt-5-search-api` has a 6,000 TPM / 100 RPM limit. The system runs 2 news agents in parallel and retries with exponential backoff if rate-limited. A full run of all 20 agents typically takes 3–8 minutes depending on the model and rate limits.

---

## Supported Countries

| Code | Country | Currency |
|------|---------|----------|
| `TR` | Turkey | TRY |
| `PL` | Poland | PLN |
| `HU` | Hungary | HUF |
| `DE` | Germany | EUR |
| `FR` | France | EUR |
| `IT` | Italy | EUR |
| `CN` | China | CNY |
| `RU` | Russia | RUB |
| `JP` | Japan | JPY |
| `KR` | South Korea | KRW |

---

## Project Structure

```text
finance_dashboard/
  agents/
    prompts/
      news/           ← news agent character prompts (Turkish)
      analysts/       ← analyst agent character prompts (Turkish)
      summary/        ← summary agent prompt (Turkish)
    results/          ← daily run outputs as JSON (gitignored)
    config.py         ← ai_config.yaml loader
    engine.py         ← three-phase agent orchestration
  dashboard/
    app.py            ← main Dash app with URL routing
    agent_page.py     ← page 2 layout and callbacks
  data/               ← World Bank, OECD, ECB, Yahoo Finance fetchers
  domain/             ← data models
  services/           ← macro, market, ETF, simulation services
  simulation/         ← investment simulator
  storage/            ← SQLite cache
  config.py
  country_registry.py
  main.py
assets/
  styles.css
examples/
tests/
ai_config.yaml        ← API key & model config (gitignored)
pyproject.toml
```

---

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Run

```bash
source .venv/bin/activate
python -m finance_dashboard.main
```

Open `http://127.0.0.1:8050` in your browser.

### Click To Run (macOS)

You can also double-click `start_dashboard.command` from Finder.

The launcher:

- uses the project's `.venv`
- starts the Dash server
- opens `http://127.0.0.1:8050` automatically in your browser

---

## Data Sources

| Source | Used For |
|--------|----------|
| World Bank | GDP, GNI, debt-to-GDP, inflation (primary macro source) |
| OECD | Supplemental policy rate data |
| ECB | Central bank rates for DE, FR, IT |
| yfinance | Market prices, ETF data, FX rates |
| OpenAI Web Search | Real-time news via `gpt-5-search-api` / `gpt-4o-search-preview` |

---

## Testing

```bash
pytest
```
