# Rec-Dating: Role-Based Bipartite Network

A study of the `rec-dating` dataset as a **role-based bipartite network**, separating outgoing rating activity from received attention.

## Core idea

- `rater` nodes send ratings
- `profile` nodes receive ratings
- Edge weight is the observed score from `1` to `10`

This framing lets us separate **outgoing activity** from **received attention** and apply network measures such as HITS in a role-consistent way.

## Main questions

1. How strongly do popularity and prestige align on the profile side?
2. How concentrated is received attention?
3. Do the profiles dominating overall interaction also dominate the high-rating buckets?
4. Which profile-side features are most aligned with elite interaction and elite high-rating status?

## Pipeline

A four-step notebook workflow that builds from the raw dataset to the final paper figures:

1. **`01_data_preparation`** — inspects the raw file, explains the role-based modeling choice, builds a cached dataset summary
2. **`02_rec_dating_exploration`** — popularity, prestige, inequality, and descriptive plots
3. **`03_applications`** — applies the framework to bucket concentration and feature alignment
4. **`04_final_plots_for_paper`** — gathers the final figures and reference values

Each notebook is a thin orchestrator that calls reusable code from `src/rec_dating_project/` and analysis scripts under `scripts/`.

## Outputs

- Generated tables in `outputs/data/`
- Generated figures in `outputs/figures/`
- A LaTeX paper draft under `paper/` that consumes those figures directly

## Reproducibility

Notebooks reuse cached artifacts when they exist, and rebuild missing ones automatically. A `FORCE_REBUILD = True` flag in the setup cell triggers a full refresh when needed.

## Stack

`Python 3.11` · `pandas` · `networkx` · `matplotlib` · `LaTeX`
