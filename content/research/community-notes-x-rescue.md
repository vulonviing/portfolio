# Rescuing Notes from Needs More Ratings: Behavioral Clustering in Community Notes on X

This repository contains the full analytical workflow for the paper.

This study was prepared as a final project for the University of Konstanz course [AI, Society, and Human Behavior: Research Methods in Context](https://github.com/carinahausladen/konstanz-ai-behavior-2026) in Winter Semester 2025/26.

The project is organized as a notebook-first pipeline with reusable logic extracted into `src/`. The workflow moves from data sampling to user clustering, note scoring, rescue simulation, topic modeling, LLM-based validation, figure generation, and paper compilation.

The main goal of the project is to study whether a meaningful subset of Community Notes stuck in the `Needs More Ratings` state can be rescued by a representative cross-cluster selection rule rather than a simple pooled-majority rule.

## What This Repository Contains

- `Paper file/main.tex`
  LaTeX source of the paper.
- `Paper file/references.bib`
  BibTeX references.
- `src/`
  Reusable Python modules for clustering, scoring, topic analysis, plotting helpers, and path/config handling.
- `notebooks/`
  Ordered analysis notebooks (see Workflow Overview below for execution order) and one standalone tutorial (`Gabriel_tutorial_for_LLMs_in_social_science_research.ipynb`) from OpenAI's Gabriel library for using LLMs in social-science research.
- `data/interim/`
  Intermediate outputs created after clustering; distributed through the external data bundle rather than Git.
- `data/processed/`
  Processed outputs used by downstream analysis and figures; distributed through the external data bundle rather than Git.
- `data/gabriel/`
  Cached and saved outputs from the Gabriel LLM workflow; distributed through the external data bundle rather than Git.
- `figures/paper/`
  Paper-ready PDF and PNG figures.
- `master_sample.csv`
  The large sampled ratings table used as the starting point for the modular pipeline; distributed separately from the Git repository.

## Data Availability

To keep the Git repository lightweight and pushable, the large analytical data artifacts are **not stored in this repository**.

This project is built on a **sampled analytical dataset**, not on the full raw Community Notes production dataset. The shareable replication bundle starts from `master_sample.csv` and the downstream parquet outputs. Readers who want the full upstream raw files should use the official Community Notes download sources linked below.

In particular, a fresh clone should **not** be expected to contain:

- `master_sample.csv`
- `data/interim/*.parquet`
- `data/processed/*.parquet`
- `data/gabriel/` caches and saved outputs

The code, notebooks, and paper sources are versioned here, but large generated datasets should be distributed separately, for example through an external data archive, a release asset, or a cloud storage link documented in this README.

## External Data Download And Setup

If you want to reproduce the sampled analytical pipeline used in the paper without rebuilding the raw upstream files, download the external data bundle from:

- Google Drive folder: `https://drive.google.com/file/d/18fKA8sHn4ULetghboSboNBnWm-BcrO_O/view?usp=sharing`

The downloadable bundle should be a single archive such as:

- `release-assets-bundle.zip`

Important notes:

- this bundle is based on the sampled analytical dataset used in the paper
- it is **not** the full raw Community Notes production dataset
- if you want to reconstruct the pipeline from raw upstream exports, use the official Community Notes links in the next section instead

Recommended setup steps after downloading:

1. Move `release-assets-bundle.zip` into the repository root.
2. Extract it in the repository root:

```bash
unzip release-assets-bundle.zip
```

3. Move the extracted bundle files from `release-assets/data-v1/` into the repository root:

```bash
mv release-assets/data-v1/community-notes-x-data-bundle.tar.gz .
mv release-assets/data-v1/master_sample.csv.gz .
mv release-assets/data-v1/SHA256SUMS.txt .
```

4. Optionally verify file integrity:

```bash
shasum -a 256 -c SHA256SUMS.txt
```

5. Decompress the sampled analytical table:

```bash
gunzip master_sample.csv.gz
```

6. Extract the downstream parquet and Gabriel outputs:

```bash
tar -xzf community-notes-x-data-bundle.tar.gz
```

7. Confirm that the repository root now contains `master_sample.csv` and that the `data/interim/`, `data/processed/`, and `data/gabriel/` folders are populated.

After that, you can start directly from `notebooks/01_clustering.ipynb`.

## Reproducibility Scope

There are two distinct reproducibility levels in this project:

1. **Full upstream reconstruction from raw platform files**
   This starts from the original raw Community Notes exports and rebuilds `master_sample.csv`.
2. **Downstream reconstruction from the sampled analytical table**
   This starts from `master_sample.csv` and rebuilds the clustering, rescue, topic, Gabriel, and plotting outputs.

For most readers, the practical reproducibility boundary is **`master_sample.csv` onward**. The sampling step exists and is documented in `notebooks/master sampling.ipynb`, but it requires access to raw upstream files that are not part of the modular notebook sequence.

## Expected Raw Inputs for the Sampling Stage

The notebook `notebooks/master sampling.ipynb` expects the following files in the project root:

- `notes-00000.tsv`
- `ratings-*.tsv`
- `noteStatusHistory-00000.tsv`

These raw public snapshots are **not bundled in this repository**. They must be downloaded separately from X's public Community Notes data sources.

Official starting points:

- Public data download entry point: `https://x.com/i/communitynotes/download-data`
- Community Notes Guide download page: `https://communitynotes.x.com/guide/en/under-the-hood/download-data`
- Official public repository and documentation hub: `https://github.com/twitter/communitynotes`

That notebook creates:

- `master_sample.csv`

This file is large and serves as the analytical entry point for the rest of the project.

## Workflow Overview

The intended execution order is:

1. `notebooks/master sampling.ipynb`
2. `notebooks/01_clustering.ipynb`
3. `notebooks/02_scoring.ipynb`
4. `notebooks/03_topics.ipynb`
5. `notebooks/05_gabriel_check.ipynb` (optional but used in the paper)
6. `notebooks/06_plots.ipynb`
7. Compile `Paper file/main.tex`

The notebook `notebooks/04_plots.ipynb` is exploratory and not required for the final paper outputs.

## Step-by-Step Pipeline

### 1. Master Sampling

Notebook:

- `notebooks/master sampling.ipynb`

Purpose:

- restrict the universe to tweets with at least 3 distinct notes
- build a lightweight tweet-level political proxy using note summaries
- classify tweets into `political` and `non_political`
- allocate the sample with a `65% political / 35% non-political` balance
- balance the political share across political subtopics
- draw a `30%` sample of ratings
- merge note metadata and status history into the sampled table

Key output:

- `master_sample.csv`

Important note:

- this notebook reconstructs the sampled analytical universe
- if you do not have the raw upstream TSV files, start from the existing `master_sample.csv`
- raw snapshots are obtained from X's public Community Notes downloads rather than from this repository
- topic modeling is not used to build the sample itself; it is applied later to the sampled analytical table after clustering and scoring

### 2. Clustering

Notebook:

- `notebooks/01_clustering.ipynb`

Core idea:

- cluster **users**, not notes
- recover latent rating blocs from co-voting patterns

What the notebook does:

- loads `master_sample.csv`
- keeps only `HELPFUL` and `NOT_HELPFUL` ratings
- maps those ratings to a binary vote
- applies the timeliness filter
- targets roughly `5,000` of the most-rated notes and `10,000` of the most-active raters
- builds the user-note matrix
- mean-centers observed votes by user
- zero-fills only for similarity construction
- computes cosine similarity on the centered matrix
- sets affinity to zero when user pairs share no co-rated note
- runs spectral clustering
- evaluates candidate `K` values with silhouette and stability diagnostics
- saves cluster assignments and intermediate tables for downstream use

Outputs:

- `data/interim/ratings_filtered.parquet`
- `data/interim/ratings_clustered.parquet`
- `data/interim/user_clusters.parquet`
- `data/interim/silhouette_over_k.parquet`
- `data/interim/stability_over_k.parquet`
- `data/interim/user_stats.parquet`
- `data/interim/cluster_summary.parquet`

### 3. Scoring and Rescue Simulation

Notebook:

- `notebooks/02_scoring.ipynb`

What the notebook does:

- loads clustered ratings from `data/interim/ratings_clustered.parquet`
- computes note-level pooled approval
- computes cluster-specific approval
- applies the `0.5` fallback when a cluster has no observed rating on a note
- enforces the minimum per-cluster rater threshold for bridge scoring
- computes the geometric-mean bridge score
- computes disagreement measures
- simulates tweet-level selection rules:
  - `Simple Majoritarian Rule`
  - `Representative`
  - `Pluralistic-K`
- creates summary tables used by the paper and downstream notebooks
- runs robustness checks for alternative bridge aggregators and epsilon sensitivity

Main outputs:

- `data/processed/scores.parquet`
- `data/processed/final_table.parquet`
- `data/processed/rescue_summary.parquet`
- `data/processed/pluralistic_breakdown.parquet`
- `data/processed/selection_log.parquet`
- `data/processed/selection_status_summary.parquet`

Authoritative note:

- for exact downstream reproduction of the paper's representative selections, use `selection_log.parquet` as the authoritative selection output
- helper calculations that sort only on `bridge_score` can behave differently under exact ties unless the same deterministic tie-breaking rule is used everywhere

Tie note:

- in practice, the important edge case is when two notes attached to the same tweet receive the exact same `bridge_score`
- if helper logic uses a different secondary ordering rule, the winning note can differ even though the bridge score is identical
- this matters because one tied note can already be `CURRENTLY_RATED_HELPFUL` while the other remains `NEEDS_MORE_RATINGS`
- the repository therefore treats `selection_log.parquet` as the authoritative downstream record of representative picks

### 4. Topic Modeling

Notebook:

- `notebooks/03_topics.ipynb`

What the notebook does:

- loads `scores.parquet` and selection outputs
- prepares note text for topic analysis
- fits BERTopic on note summaries
- attaches topic names and shortened labels
- computes topic-level disagreement structure
- computes topic salience by cluster
- computes topic-level rescue and failure summaries
- compares which topics are surfaced by different selection rules

Outputs:

- `data/processed/topic_notes.parquet`
- `data/processed/topic_cluster_stats.parquet`
- `data/processed/topic_exemplars.parquet`
- `data/processed/topic_salience.parquet`
- `data/processed/topic_salience_pivot.parquet`
- `data/processed/topic_rescue_stats.parquet`
- `data/processed/topic_strategy_summary.parquet`
- `data/processed/topic_strategy_pivot.parquet`
- `data/processed/topic_selection_overlap.parquet`

### 5. Gabriel LLM Validation

Notebook:

- `notebooks/05_gabriel_check.ipynb`

Purpose:

- evaluate whether representative-rescued notes look substantively worth rescuing

What the notebook does:

- loads processed rescue outputs
- isolates representative-rescued notes
- builds `llm_context` strings combining note text and selected metadata
- runs Gabriel classification for:
  - political topic class
  - troll vs non-troll
- runs Gabriel rating for:
  - rescue worthiness
  - informational value
  - evidentiary specificity
  - troll likelihood
  - clarity
- runs blind validation by removing score metadata from the context
- compares representative-rescued notes with majoritarian-only rescued notes
- writes reusable caches so repeated runs can resume rather than starting over

Main save locations:

- `data/gabriel/rescue_notes_100pct_politics_classify/`
- `data/gabriel/rescue_notes_100pct_troll_classify/`
- `data/gabriel/rescue_notes_100pct_rescue_rate/`
- `data/gabriel/rescue_notes_100pct_blind_rescue_rate/`
- `data/gabriel/rescue_notes_100pct_maj_rescue_rate/`
- `data/gabriel/cache/`

Important note:

- this notebook requires an OpenAI API key and network access when run fresh
- cached outputs in `data/gabriel/` make later reruns cheaper and faster
- repository-level documentation for this stage is collected in `LLM_APPENDIX.md`

### 6. Final Paper Figures

Notebook:

- `notebooks/06_plots.ipynb`

What the notebook does:

- loads prepared outputs only
- generates the paper-ready figures
- saves each figure to `figures/paper/` as both PDF and PNG

Expected figure targets:

- `figures/paper/figure_01_cluster_diagnostics.pdf`
- `figures/paper/figure_03_strategy_status_counts.pdf`
- `figures/paper/figure_04_high_disagreement_topics.pdf`
- `figures/paper/figure_05_topic_cluster_polarity.pdf`
- `figures/paper/figure_06_gabriel_politics.pdf`
- `figures/paper/figure_07_gabriel_ratings.pdf`
- `figures/paper/figure_08_troll_topic_pockets.pdf`
- `figures/paper/figure_A1_cluster_tfidf.pdf`
- `figures/paper/figure_A2a_disagreement_direction_bar.pdf`
- `figures/paper/figure_A2b_disagreement_direction_scatter.pdf`
- `figures/paper/figure_A3_user_profiling.pdf`

### 7. Paper Compilation

Paper source:

- `Paper file/main.tex`

Compiling the paper requires the figure files and bibliography to already exist.

Typical local compile sequence:

```bash
cd "Paper file"
latexmk -pdf main.tex
```

This should produce:

- `Paper file/main.pdf`

## Suggested Runtime Order for a New User

If you downloaded the external sampled data bundle:

1. Place `release-assets-bundle.zip` in the repository root and extract it.
2. Move `community-notes-x-data-bundle.tar.gz`, `master_sample.csv.gz`, and `SHA256SUMS.txt` from `release-assets/data-v1/` into the repository root.
3. Run `shasum -a 256 -c SHA256SUMS.txt` if you want an integrity check.
4. Run `gunzip master_sample.csv.gz`.
5. Extract `community-notes-x-data-bundle.tar.gz`.
6. Open `notebooks/01_clustering.ipynb` and run all cells.
7. Run `notebooks/02_scoring.ipynb`.
8. Run `notebooks/03_topics.ipynb`.
9. If you want the full paper replication, run `notebooks/05_gabriel_check.ipynb`.
10. Run `notebooks/06_plots.ipynb`.
11. Compile `Paper file/main.tex`.

If you want to rebuild everything from the raw platform exports:

1. Place `notes-00000.tsv`, `ratings-*.tsv`, and `noteStatusHistory-00000.tsv` in the repository root.
2. Run `notebooks/master sampling.ipynb`.
3. Confirm that `master_sample.csv` was created.
4. Continue with the modular notebooks in numeric order.

## Python Dependencies

This repository now includes:

- `requirements.txt`
  pinned package versions for the notebook workflow
- `.env.example`
  local runtime template for environment variables plus a commented record of the reference environment used during development

At minimum, the workflow depends on:

- `python`
- `pandas`
- `numpy`
- `scikit-learn`
- `matplotlib`
- `seaborn`
- `pyarrow` or another parquet backend
- `bertopic`
- `sentence-transformers`
- `umap-learn`
- `openai-gabriel`
- `jupyter`

Additional system dependencies may be needed for:

- LaTeX compilation (`latexmk`, TeX distribution)
- transformer model downloads
- OpenAI/Gabriel API calls

Recommended setup:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If you want to use environment variables instead of hard-coding API keys in notebooks:

1. copy `.env.example` to `.env`
2. fill in `OPENAI_API_KEY`
3. load it locally however you normally manage environment variables

## Limitations

- The analytical sample is intentionally structured rather than platform-representative.
- The full raw platform dataset is larger than the modular pipeline input and may not be available to all readers.
- The sampling stage depends on raw TSV files outside the modular notebook chain.
- The workflow is notebook-based, so execution order matters.
- Some parts of the LLM workflow rely on cached outputs and an external API.
- Model aliases such as `gpt-5-mini` may evolve over time, so exact LLM reruns may drift unless versions and run dates are documented.
- Exact ties in note selection can change outcomes unless tie-breaking is explicitly standardized.
- A pinned `requirements.txt` is provided, but OS-level and model-level differences can still affect exact reruns.
