# Non-Supervised Learning in Action Quality Assessment

Seminar paper for AG Keim (Data Analysis and Visualization, University of Konstanz), July 2025, by Emrecan Ulu. It is a structured literature overview of how Action Quality Assessment (AQA) is moving from fully supervised score regression towards label-efficient learning.

**Read the paper:** [paper/non-supervised-learning-in-aqa.pdf](https://github.com/vulonviing/aqa-nonsupervised-learning-seminar/blob/main/paper/non-supervised-learning-in-aqa.pdf)

"Non-supervised" is used as an umbrella term for label-efficient methods (semi-, self- and weakly-supervised learning, contrastive regression, vision-language models).

## What's inside

- **Taxonomy** of AQA learning paradigms by the supervision they require
- **Dataset overview** (AQA-7, MTL-AQA, FineDiving, JIGSAWS, LOGO, ...)
- **Method families:** contrastive regression, teacher-reference-student, self-supervised pretext tasks, self-training with large models, CLIP-based approaches
- **Benchmark comparison** in Spearman's ρ, compiled from the numbers reported in the original papers (not re-run, so protocols and backbones may differ)
- **Open challenges:** long-form video, explainability and bias, uncertainty, neuro-symbolic hybrids, multi-modal AQA

## Layout

```
paper/    the paper (PDF), including the full bibliography
figures/  my own diagrams (Mermaid)
```

## Scope

- Overview of around 20 key papers
- Benchmark numbers are taken from the original papers

## Credits

Figures 2-4 in the paper are reproduced from the cited works and belong to their respective authors. All other content is my own.
