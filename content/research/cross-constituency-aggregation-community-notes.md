# Cross-Constituency Aggregation for Community Notes

**Emrecan Ulu and Jingyao Shi · University of Konstanz**

Community Notes lets people add context to posts on X, but a note appears only when enough raters agree that it is helpful. Our work asks a different question: what if agreement had to extend across groups of people who usually vote differently?

Cross-Constituency Aggregation (CCA) finds those groups from co-rating behavior, without assigning them political identities. It then scores each note using the geometric mean of approval across groups. Strong support in one group cannot simply compensate for rejection in another.

In our analysis of 44,722 posts, CCA qualifies 20,405 notes. Of those, 13,655 were not displayed by X. An independent language-model review found that 8,558 of these candidate notes held up on sourcing and quality. That review examined the note text and visible source pointer; it did **not** open links or verify that the cited sources supported the claims. These results show how a different aggregation rule changes visibility decisions, not that every qualified note is true or that X intentionally suppressed any note.

The [paper and reproducible implementation](https://github.com/vulonviing/cross-constituency-aggregation-community-notes) include the method, figures, tests, and instructions for checking the reported results.
