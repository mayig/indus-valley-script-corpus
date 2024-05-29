# Corpus of Indus Seals and Inscriptions digitization

## Acknowledgements

I'd like to thank Dr Asko Parpola for his tireless efforts into the preservation and dissemination of the Indus Valley corpus. It is largely due
to his decades-long efforts that I am able to transform the priceless artefacts of the Indus Valley Civilization into this digital format.
Thank you, Dr Parpola.

I'd also like to acknowledge both Dr Andreas Fuls and Bryan K Wells for their many contributions, both in theory and in pedagogy, of the Indus
Valley scripts. While their work is less represented here, that is most certainly not due to any lack of significance or importance.

## Overview

This repo is a (currently WIP) digitization of the CISI by Parpola et al.

My intention is to create a friendly, free, open digital dataset for Indus script studies. To this end, I will use the CISI text numbering scheme,
where for instance the second Mohenjo-daro text is denoted "M-2".

I will use the most inclusive allographs provided by Parpola (1982), but provide additional digital information to distinguish more finely between
graphemes that may be important. For instance, the tree sign with symmetric trifurcation at the top is allographed by Parpolo to the tree sign
with multiple repeated bifurcations along one side. I will use Parpola's numbering system, which would give sign `P086` to both of these graphemes.
While Parpola does include an alternate numbering scheme, giving `V126` to the first and `V127` to the second, I choose to use `P086` and include
extra information alongside the primary sign value.

I have also included Wells's sign list from Wells (2015), matching as closely as I could with the Parpola sign list. Where there were multiple
signs from Wells that mapped to a single sign from Parpola, I ensured that there was an associated feature to distinguish between them.

The corpus itself can be found in the `corpus` subdirectory of this repository.

## Feature vectors

This extra graphemic information takes the shape of "grapheme features", with a "feature vector" for each allograph. For instance, with sign `P086`, we
have a feature vector like:

* `branching_factor` (integer, >= 2)
* `branch_count` (integer, >= 1)
* `branch_direction` (integer, 0 = none, 1 = left, 2 = right)

So `V126`, the tree with a single trifurcation on top, would be represented as `P086 (3, 1, 0)`. In contrast, a common variant of `V127`, the tree with
four bifurcations along the right branch, would be represented as `P086 (2, 4, 2)`.

The feature vectors for each sign from Parpola (1982) can be found in the `features` subdirectory of this repository.

### Default features

Note that all allographs share some common "default" features, which include "damage", "line", and "uncertainty". Damage refers to how much
of a sign might be damaged, Line refers to which textual line on the artifact in which the grapheme occurs, and Uncertainty refers to how clearly
recognizable the grapheme is on the artefact (as judged by the annotator). Default features come before all other features. So for the first example above, `P086 (0, 1, 0, 3, 1, 0)`
would indicate no damage, line 1, no uncertainty, trifurcating, branching only once, with no significant branching direction.

The Uncertainty feature is extremely subjective and only included to give a rough indication of my own relative certainty when assigning a primary
allographic designation.

### Feature encoding

My intention is to use an integer encoding for all features in a given allograph's feature vector. While this does obscure the exact graphemic
representation for a given representation, it does make the data more easily used by numerical analyses.

I have developed a small Visual Studio Code extension which allows you to hover over a number like `P086`, and it will give you a description of
the symbol itself, as well as a description of the feature vector for that symbol. This lives in the `indus_helper_vsce` directory. It is fairly
technical to build VSCode extensions, but if you'd like a copy, I can supply one.

## Notes on allograph selection

There are a few ambiguities in Parpola's simplest allograph scheme. These are in the numerical signs, the groups of vertical strokes. In particular,
`P121(V764)` seems to be identical with `P144(V008)`, `P122(V765)` with `P145(V009)`, `P123(V766)` with `P147(V010)`, and `P124(V771)` with `P150(V294)`.
I have tried to be consistent in choosing the allographs from `P144` onward for full-height vertical strokes when possible, and reserving the allographs
from `P121` for partial-height strokes.
