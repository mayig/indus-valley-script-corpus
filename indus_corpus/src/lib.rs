//! Library for common utilities to work with the corpus

use std::collections::HashMap;

use serde::Deserialize;

pub mod corpus;

/// Represents a single artefact, which is a collection of faces
pub type Artefact = Vec<ArtefactFace>;

/// This struct describes a single face from a given artefact
#[derive(Debug, Deserialize)]
pub struct ArtefactFace {
    /// The face id, e.g. "M-102A" for Mohenjo-Daro 102A from CISI
    pub id: String,
    /// A description of the face, like "Unicorn IV seal"
    pub description: String,
    /// A list of graphemes on the face from left to right
    pub graphemes: Vec<Grapheme>,
}

/// This struct describes a single grapheme on an artefact face
#[derive(Debug, Deserialize)]
pub struct Grapheme {
    /// The grapheme id, e.g. "P102" for Parpola's sign 102
    pub id: String,
    /// The feature values for this grapheme
    /// N.B. that the first three features are the default features of "damage", "line", and "uncertainty"
    /// where damage and uncertainty are a percentage, from 0 to 100, and line is the line number counted vertically from the top
    pub features: Vec<u64>,
}

impl Grapheme {
    /// Get the number of features for this grapheme
    #[must_use]
    pub fn get_feature_count(&self) -> usize {
        self.features.len()
    }
}

/// This struct describes a feature file, each of which describes a grapheme from Parpola's sign list, with the features
/// The features are a collection of possible variations on the base sign. For instance, the common "pitchfork" sign will
/// have a feature that counts the number of tines on the pitchfork head.
#[derive(Debug, Deserialize)]
pub struct FeatureFile {
    /// The grapheme id, e.g. "P102" for Parpola's sign 102
    pub id: String,
    /// A description of the grapheme, like "A pitchfork standing vertically with a number of tines at the top"
    pub description: String,
    /// This is a list of allographs given by Parpola for each sign. These are the values like "V207" from Parpola 1988
    pub parpola_graphemes: Vec<String>,
    /// This is a correspondence list of graphemes from Well's sign list (2015) matching this Parpola sign
    pub wells_graphemes: Vec<String>,
    /// This is a correspondence list of graphemes from Mahadevan's 1977 sign list matching this Parpola sign
    pub mahadevan_graphemes: Vec<String>,
    /// This is a list of features for the grapheme. Each feature will have a "description" key with a description
    /// of the potential values for the feature. There will also be a key representing a human-readable and machine-readable name
    /// for this feature.
    pub features: Vec<HashMap<String, String>>,
}

impl FeatureFile {
    /// Get the number of features for this grapheme
    #[must_use]
    pub fn get_feature_count(&self) -> usize {
        self.features.len()
    }
}
