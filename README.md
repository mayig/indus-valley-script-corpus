# Corpus of Indus Seals and Inscriptions digitization

## Overview

This repo is a (currently WIP) digitization of the Corpus of Indus Seals and Inscriptions (CISI) by Parpola et al.

The corpus is in `json` format, which can be read by humans with a little training, and is consumed easily by applications. This format was chosen
due to the popularity of `json` in the programming community, and most programming languages have robust support for handling `json` data.

## Acknowledgements

I'd like to thank Dr Asko Parpola for his tireless efforts into the preservation and dissemination of the Indus Valley corpus. It is largely due
to his decades-long efforts that I am able to transform the priceless artefacts of the Indus Valley Civilization into this digital format.
Thank you, Dr Parpola.

I'd also like to acknowledge both Dr Andreas Fuls and Bryan K Wells for their many contributions, both in theory and in pedagogy, of the Indus
Valley scripts. While their work is less represented here, that is most certainly not due to any lack of significance or importance.

### Usage

In each file in the `corpus` subdirectories, the `json` file represents a single artefact. The highest level is an array of "sides" of the artefact.
Each array entry is one side of the artefact, with a json object containing the object id, a short description of the artefact type, and a list of graphemes.
The graphemes are recorded from the left of the artefact side to the right with the understanding that the script is read right-to-left. Note that
for seals, I have transcribed the sealing as opposed to the seal itself, as this was the intended way the inscriptions would be used.

To get a human-readable description of a given artefact, I have provided a small utility in the `artefact_finder` folder. This is a Rust language command
line utility. When run from the `artefact_finder` folder, you can provide command line arguments like `-a m102` to display the corpus entry for the
Mohenjo-Daro `M102` artefact as per the Corpus of Indus Seals and Inscriptions (CISI). If you would like to use this utility but are not familiar with
the Rust prgramming language, I am happy to provide pre-built binaries upon request. The source code is provided by default here so users can compile
the utility for any operating system via the usual Rust build techniques.

### Goals

My intention is to create a friendly, free, open digital dataset for Indus script studies. To this end, I will use the CISI text numbering scheme,
where for instance the second Mohenjo-daro text is denoted "M-2".

The initial goal I hope to work toward is refining the graphemic and allographic understanding of the script. It is my belief that this is a fundamental
pre-requisite for a more global understanding of the artefacts. By producing a corpus like the one here, I hope others will be able to use the
data herein to work toward this goal. Of course, many other important insights can be gleaned from having another corpus available, such as verifying
the data between the various corpuses. By releasing this corpus under the MIT and/or Apache licenses, it is my hope that others can use this data
in whatever way they wish, through careful analysis and cross-referencing with other well-established information and corpora.

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

## Font

I intend to include Unicode characters to give a visual clue to the grapheme being described. Right now, I have tested the [AMBILE IVC Script](https://ambile.pk/dev/fonts/ivc/) font, and it seems to work nicely once installed.
