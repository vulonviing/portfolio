# BABE Baseline — RoBERTa Fine-tune Reproduction

Reproduction of sentence-level media bias classification on the **BABE** dataset (Spinde et al., EMNLP Findings 2021), using `roberta-base`.

## Goal

Reproduce the binary biased / non-biased sentence classifier from BABE and compare against published baselines:

- Spinde et al. 2021 (distant supervision pre-train + BABE fine-tune): F1 ≈ 0.80
- Krieger et al. 2022 (DA-RoBERTa, JCDL): F1 ≈ 0.81

The target was to match or exceed these with a clean RoBERTa-base fine-tune — no distant supervision, no domain-adaptive pre-training.

## Results

5-fold stratified cross-validation on BABE:

| Model | Macro-F1 |
|---|---|
| Spinde et al. 2021 | 0.804 |
| Krieger et al. 2022 (DA-RoBERTa) | 0.814 |
| **This work (RoBERTa-base, 5-fold CV)** | **0.857 ± 0.012** |

### K-fold summary

| Metric | Mean ± Std |
|---|---|
| Macro-F1 | 0.857 ± 0.012 |
| Accuracy | 0.858 ± 0.012 |
| Precision (macro) | 0.856 ± 0.011 |
| Recall (macro) | 0.859 ± 0.012 |

Per-fold macro-F1: 0.876, 0.854, 0.845, 0.852, 0.856. The best fold (`fold_0`) is the checkpoint released to Hugging Face.

## Key findings

- A plain `roberta-base` fine-tune is enough to reproduce BABE strongly. No distant supervision needed.
- Errors concentrate in **subtle framing** and **loaded-language** cases rather than overtly emotional or partisan wording.
- Held-out single-split eval reaches 0.870 macro-F1, slightly optimistic relative to the CV mean — the cross-validation number is the one to report.

## Pipeline

The project is five notebooks orchestrating logic from a `src/` package — notebooks stay thin, code stays testable.

| Notebook | Purpose |
|---|---|
| `01_data_preparation` | Download BABE, clean, split, save processed parquet |
| `02_data_exploration` | Class balance, length distributions, vocabulary stats |
| `03_fine_tuning` | Tokenize, fine-tune RoBERTa-base, log to W&B |
| `04_evaluation` | 5-fold CV, confusion matrix, error analysis |
| `05_final_report` | Final plots and comparison vs published baselines |

## Model details

| Item | Value |
|---|---|
| Base model | `roberta-base` |
| Max sequence length | 128 |
| Epochs | 4 |
| Learning rate | 2e-5 |
| Batch size | 16 train / 32 eval |
| Weight decay | 0.01 |
| Warmup ratio | 0.1 |
| Random seed | 42 |

The released checkpoint is on Hugging Face: `vulonviing/roberta-babe-baseline`.
