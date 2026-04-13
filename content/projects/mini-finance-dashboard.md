# Mini Finance Dashboard

Production-oriented macroeconomic and financial dashboard built with Python and Dash, enhanced with a multi-agent AI research system for daily market context and structured news summaries.

> **Legal Notice**
> This repository and the in-app Research Hub are designed for research and education.
> They do **not** provide licensed investment advice, portfolio management, or user-specific suitability analysis.
> Outputs are based on public data, public news flow summaries, and AI-generated research text and should not be used as a sole basis for investment decisions.
> If any AI-generated output drifts into advice-like wording, that wording remains non-advisory and no responsibility is accepted for reliance, trading decisions, or losses.
> Jurisdiction-specific legal notices in English, Turkish, German, French, Italian, Polish, and Hungarian, plus EU / Switzerland / USA / UK notes, are available in [`LEGAL_NOTICE.md`](https://github.com/vulonviing/mini-finance-dashboard/blob/main/LEGAL_NOTICE.md) and on the `/terms` page.

---

## Disclaimer Order

### English Disclaimer

This repository, dashboard, and Research Hub are provided for research and education only. They do not provide licensed investment advice, portfolio management, brokerage, or user-specific suitability analysis. No user's financial situation, risk tolerance, or investment objectives are taken into account. Outputs include AI-generated research text, and if any model output drifts into advice-like wording, it remains non-advisory and no responsibility is accepted for reliance, trading decisions, or losses.

### Türkçe Disclaimer - Türkiye

Bu repo, dashboard ve Research Hub yalnızca araştırma ve eğitim amacıyla sunulur. Hiçbir içerik 6362 sayılı Sermaye Piyasası Kanunu kapsamında lisanslı yatırım danışmanlığı, portföy yönetimi veya kişiye özel yatırım tavsiyesi niteliğinde değildir. Kullanıcının finansal durumu, risk toleransı ve yatırım hedefleri dikkate alınmaz. İçeriklerin bir kısmı yapay zeka tarafından üretilen araştırma metinleridir; yapay zeka çıktısı tavsiye benzeri bir ifadeye kaysa bile bu ifade yatırım tavsiyesi sayılmaz ve buna dayanılarak alınan kararlar, işlemler veya zararlar bakımından sorumluluk kabul edilmez.

Resmi Türkiye referansları:

- SPK, Yatırım Hizmet ve Faaliyetleri ile Yatırım Kuruluşlarına İlişkin Rehber: <https://spk.gov.tr/duyurular/basin-duyurulari/2014/yatirim-hizmet-ve-faaliyetleri-ile-yatirim-kuruluslarina-iliskin-rehber>
- SPK, Bilgi Bazlı Piyasa Dolandırıcılığı: <https://spk.gov.tr/yatirimcilar/sermaye-piyasasinda-piyasa-dolandiriciligi-manipulasyon/bilgi-bazli-piyasa-dolandiriciligi>

### Deutscher Disclaimer - Deutschland

Dieses Repository, Dashboard und der Research Hub dienen ausschließlich Informations-, Forschungs- und Bildungszwecken. Die Inhalte sind nicht als Anlageberatung im Sinne von § 2 Abs. 2 Nr. 4 WpIG ausgestaltet; persönliche Umstände, Risikotoleranz und Anlageziele werden nicht berücksichtigt. Öffentlich verbreitete anlagebezogene Einschätzungen können zudem an die Transparenz- und Objektivitätsanforderungen der §§ 85-86 WpHG sowie der einschlägigen EU-Regeln anknüpfen. Teile der Inhalte werden KI-generiert erstellt; selbst wenn eine KI-Ausgabe in beratungsähnliche Formulierungen abrutscht, bleibt sie nicht-beratend, und für Vertrauen auf solche Inhalte, Handelsentscheidungen oder Verluste wird keine Verantwortung übernommen.

Praktische Kurzfassung:

> "Diese Plattform ist kein zugelassener Anlageberatungsdienst. Alle Inhalte dienen ausschließlich Informations-, Forschungs- und Bildungszwecken."

Offizielle Deutschland-Referenzen:

- WpIG § 2: <https://www.gesetze-im-internet.de/wpig/__2.html>
- WpHG §§ 85-86: <https://www.gesetze-im-internet.de/wphg/__85.html>
- BaFin, Wertpapier-Informationsblatt: <https://www.bafin.de/DE/Aufsicht/Prospekte/Wertpapiere/Wertpapier-Informationsblaetter/wib_node.html>

### Other Language Notices

- Français: Cette plateforme n'est pas un service agréé de conseil en investissement. Certains contenus sont générés par IA; même si une formulation ressemble à un conseil, elle reste non consultative et aucune responsabilité n'est assumée. Voir [`LEGAL_NOTICE.md`](https://github.com/vulonviing/mini-finance-dashboard/blob/main/LEGAL_NOTICE.md) et `/terms` pour la version détaillée et les références AMF.
- Italiano: Questa piattaforma non costituisce un servizio autorizzato di consulenza in materia di investimenti. Alcuni contenuti sono generati dall'IA; anche se una formulazione appare simile a un consiglio, resta non consulenziale e non si assume alcuna responsabilità. Vedi [`LEGAL_NOTICE.md`](https://github.com/vulonviing/mini-finance-dashboard/blob/main/LEGAL_NOTICE.md) e `/terms` per la versione dettagliata e i riferimenti CONSOB.
- Polski: Ta platforma nie stanowi licencjonowanej usługi doradztwa inwestycyjnego. Część treści jest generowana przez AI; nawet jeśli jakieś sformułowanie upodobni się do porady, pozostaje ono niewiążące i nie przyjmuje się odpowiedzialności. Zobacz [`LEGAL_NOTICE.md`](https://github.com/vulonviing/mini-finance-dashboard/blob/main/LEGAL_NOTICE.md) i `/terms`, aby uzyskać wersję szczegółową oraz odniesienia KNF.
- Magyar: Ez a platform nem minősül engedéllyel rendelkező befektetési tanácsadási szolgáltatásnak. Egyes tartalmak MI által generáltak; akkor sem minősülnek tanácsadásnak, ha megfogalmazásuk annak tűnik, és felelősséget ezért nem vállalunk. A részletes változatot és az MNB-hivatkozásokat lásd a [`LEGAL_NOTICE.md`](https://github.com/vulonviing/mini-finance-dashboard/blob/main/LEGAL_NOTICE.md) fájlban és a `/terms` oldalon.

---

## Features

- Compare macro indicators across 10 supported countries.
- Track market assets and sector ETFs with daily cached data.
- Simulate historical investments in FX, gold, indices, ETFs, and interest-bearing products.
- **Research Hub** — 20 AI agents gather real-time news, produce structured research outlooks, and generate a sector research overview.
- Modular architecture easy to extend with additional data providers or storage backends.

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Macro indicators, market board, ETF performance |
| Research Hub | `/agents` | Research workflow — news gathering + research reports |
| Terms & Legal Notice | `/terms` | Legal notice, usage terms, and deployment constraints |

---

## Agentic Research System

The dashboard includes a three-phase multi-agent pipeline. News agents browse the internet for current developments, research agents convert those conclusions into structured sector research summaries, and an overview agent compresses the sector calls into a top-of-page research snapshot.

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
│                  PHASE 2: RESEARCH AGENTS                  │
│                  (No Web Search — Analysis)                 │
│                                                             │
│  Spartan  Quantum  Nexus  Torque  Muse                      │
│  Vitalis  Volt  Oracle  Keynes                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   PHASE 3: OVERVIEW AGENT                   │
│           (Sector Research Overview — No Search)            │
│                                                             │
│  Beacon                                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
            Dashboard — Research Overview + Final Reports
```

News agents run in parallel (2 workers) with automatic retry on rate limits. Once all complete, their combined output is fed as a single context block to the research agents, which also run in parallel. After the research phase finishes, the overview agent creates the snapshot shown at the top of the Research Hub page.

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

### Research Agents

These agents receive the combined news conclusions as context and produce **research outlooks** for their respective domains. They do **not** access the internet directly.

| Agent | Character | Domain | ETFs Covered |
|-------|-----------|--------|--------------|
| **Spartan** | Defense sector researcher — disciplined, strategic | Defense ETFs | ITA, XAR |
| **Quantum** | Senior tech researcher — growth vs. valuation discipline | Technology ETFs | XLK, VGT |
| **Nexus** | AI & robotics researcher — cuts through AI hype | AI & Robotics ETFs | AIQ, BOTZ |
| **Torque** | Automotive researcher — EV vs. ICE pragmatist | Automotive ETFs | CARZ, DRIV |
| **Muse** | Creative industries researcher — connects cultural trends to financials | Entertainment ETFs | PEJ, HERO |
| **Vitalis** | Healthcare researcher — pipeline and regulatory focus | Healthcare ETFs | XLV, VHT |
| **Volt** | Energy & commodities researcher — reads geopolitics through oil prices | Energy ETFs | XLE, VDE |
| **Oracle** | Global market researcher — 20+ years across all asset classes | All markets (indices, FX, commodities) | — |
| **Keynes** | Chief macro researcher — named after J.M. Keynes, covers all 10 tracked countries | Macro (10 countries) | — |

---

### Overview Agent

| Agent | Character | Output |
|-------|-----------|--------|
| **Beacon** | Sector overview strategist — distills research reports into a concise snapshot | Per-sector research outlook, news intensity, keywords, and one-line reason |

---

### Legal and Usage Guardrails

- The Research Hub is designed as a **research and education** workflow, not a licensed investment advisory product.
- The `/` dashboard and `/agents` Research Hub now show persistent legal notices and require session-level acknowledgement before access is granted.
- Prompts and UI have been rewritten to avoid direct `buy / hold / sell` language and to favor neutral research terminology.
- AI-generated outputs remain non-advisory even if a model drifts into advice-like wording, and no responsibility is accepted for reliance, trades, or losses arising from such output.
- Full usage terms live in [`TERMS_OF_USE.md`](https://github.com/vulonviing/mini-finance-dashboard/blob/main/TERMS_OF_USE.md).
- Jurisdiction-specific notices and regulatory references live in [`LEGAL_NOTICE.md`](https://github.com/vulonviing/mini-finance-dashboard/blob/main/LEGAL_NOTICE.md).
- The `/terms` page now exposes both the usage terms and the jurisdiction-specific legal notice.

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

analysis_llm:
  provider: "ollama"   # "openai" or "ollama"
  model: "gemma4:e4b"  # optional; defaults to openai.model when provider=openai
  base_url: "http://localhost:11434/v1"
  api_key: "ollama"
```

> **Note:** `ai_config.yaml` is listed in `.gitignore` and will never be committed.
> **Phase 1 runtime split:** news agents still use OpenAI web search. Research, historian, overview, and translation steps can optionally run on local Ollama via `analysis_llm`.

---

### Available Models & Compatibility

The **News / Search Model** selector controls the exact OpenAI Chat Completions search runtime used by news agents.
The **Research / Translation LLM** selector controls research agents, the historian, the overview agent, and English translation.

#### OpenAI Models

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

#### Local Ollama Option

For the non-search pipeline, the dashboard can also use:

| Provider | Model | Works | Notes |
|----------|-------|-------|-------|
| Ollama | `gemma4:e4b` | ✅ | Local, no per-token OpenAI cost, requires a running Ollama instance |

#### News Agent Models (OpenAI Chat Completions)

The dashboard currently exposes only the OpenAI Chat Completions search models that officially support `web_search_options`:

| Search runtime | Notes |
|----------------|-------|
| `gpt-5-search-api` | Current default search runtime |
| `gpt-4o-search-preview` | Legacy preview search model |
| `gpt-4o-mini-search-preview` | Lower-cost legacy preview search model |

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
      analysts/       ← research agent prompts (Turkish, kept in same folder for compatibility)
      summary/        ← overview agent prompt (Turkish)
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
