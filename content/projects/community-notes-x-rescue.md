# Community Notes X Rescue

A Python-based research pipeline that analyzes X (Twitter) Community Notes, clustering raters and identifying notes that get stuck in the "Needs More Ratings" status.

## Why this exists

The Community Notes system is designed to surface helpful context on viral posts, but a large fraction of notes never reach the threshold required to be shown. This project asks whether smarter rater selection — informed by clustering and topic modeling — could rescue notes that are actually high-quality but stuck.

## What it does

- Clusters raters using **scikit-learn**, **UMAP**, and **HDBSCAN** to find latent groups of evaluators
- Models note topics with **BERTopic** to understand which subjects are most affected by stalled ratings
- Evaluates several rater-selection strategies and produces analytical outputs comparing them
- Integrates an **LLM-based validation layer** to assess note quality independently of crowd ratings
- Generates paper-ready figures and tables

## Stack

`Python` · `scikit-learn` · `BERTopic` · `UMAP` · `HDBSCAN` · `LLM validation`

## Status

Active research. Results are being written up for a paper draft.
