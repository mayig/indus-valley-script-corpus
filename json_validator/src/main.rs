//! Simple utility to validate the corpus files against the feature files

use std::collections::HashSet;

use anyhow::{anyhow, Result};
use indus_corpus::{Artefact, FeatureFile};

fn main() -> Result<()> {
    let prefix = if std::env::current_dir()?.ends_with("json_validator") {
        "../"
    } else {
        ""
    };
    let feature_files = load_graphemes(&format!("{prefix}features"))?;
    println!("Loaded {} feature files", feature_files.len());

    let artefacts = load_corpus(&format!("{prefix}corpus"), &feature_files)?;
    println!("Loaded {} corpus files", artefacts.len());

    Ok(())
}

fn load_graphemes(features_directory: &str) -> Result<Vec<FeatureFile>> {
    let mut graphemes = Vec::new();
    let feature_files = std::fs::read_dir(features_directory)?;
    let mut parpola_graphemes = HashSet::new();
    let mut wells_graphemes = HashSet::new();
    for feature_file in feature_files {
        let feature_dir_entry = feature_file?;
        let feature_path = feature_dir_entry.path();
        let feature_name = feature_path
            .file_name()
            .ok_or_else(|| anyhow!("Failed to get feature file path"))?
            .to_str()
            .ok_or_else(|| anyhow!("Failed to get feature file name"))?
            .to_owned();
        //println!("Feature {feature_name}");
        // get the feature name without extension
        let feature_name = feature_name
            .split('.')
            .next()
            .ok_or_else(|| anyhow!("Failed to get feature name"))?;
        // deserialize the file to a Grapheme
        let feature_file: FeatureFile =
            serde_json::from_reader(std::fs::File::open(feature_path)?)?;

        // validate that the grapheme id is the same as the feature name
        if feature_file.id != feature_name {
            return Err(anyhow!(
                "Grapheme id {} does not match feature name {}",
                feature_file.id,
                feature_name
            ));
        }

        // validate that the parpola graphemes are unique and of the form "V012"
        for parpola_grapheme in &feature_file.parpola_graphemes {
            if parpola_grapheme.len() != 4
                || !parpola_grapheme.starts_with('V')
                || !parpola_grapheme
                    .chars()
                    .skip(1)
                    .all(|ch| ch.is_ascii_digit())
            {
                return Err(anyhow!(
                    "Parpola grapheme {} is not of form 'V123' in {}",
                    parpola_grapheme,
                    feature_file.id
                ));
            }
            if parpola_graphemes.contains(parpola_grapheme) {
                return Err(anyhow!(
                    "Parpola grapheme {} is not unique",
                    parpola_grapheme
                ));
            }
            let _unused = parpola_graphemes.insert(parpola_grapheme.clone());
        }

        // validate that the wells graphemes are unique and of the form "W012"
        for wells_grapheme in &feature_file.wells_graphemes {
            if wells_grapheme.len() != 4
                || !wells_grapheme.starts_with('W')
                || !wells_grapheme.chars().skip(1).all(|ch| ch.is_ascii_digit())
            {
                return Err(anyhow!(
                    "Wells grapheme {} is not of form 'W123' in {}",
                    wells_grapheme,
                    feature_file.id
                ));
            }
            if wells_graphemes.contains(wells_grapheme) {
                return Err(anyhow!("Wells grapheme {} is not unique", wells_grapheme));
            }
            let _unused = wells_graphemes.insert(wells_grapheme.clone());
        }

        graphemes.push(feature_file);
    }
    Ok(graphemes)
}

fn load_corpus(corpus_directory: &str, graphemes: &[FeatureFile]) -> Result<Vec<Artefact>> {
    let corpus = std::fs::read_dir(corpus_directory)?;
    let mut files = Vec::new();

    for corpus_file in corpus {
        let corpus_file_dir_entry = corpus_file?;
        if corpus_file_dir_entry.file_type()?.is_dir() {
            // recurse into subdirectories
            let subdirectory = corpus_file_dir_entry.path();
            let subfiles = load_corpus(
                subdirectory
                    .to_str()
                    .ok_or_else(|| anyhow!("Failed to get subdir str"))?,
                graphemes,
            )?;
            files.extend(subfiles);
            continue;
        }

        let corpus_file_path = corpus_file_dir_entry.path();
        let corpus_file_name = corpus_file_path
            .file_name()
            .ok_or_else(|| anyhow!("Failed to get corpus file name"))?
            .to_str()
            .ok_or_else(|| anyhow!("Failed to get corpus file name"))?
            .to_owned();

        // get the corpus file name without extension
        let corpus_file_name = corpus_file_name
            .split('.')
            .next()
            .ok_or_else(|| anyhow!("Failed to get corpus file name"))?;

        //println!("Loading corpus file {corpus_file_name}");

        // deserialize the file to a CorpusFile
        let corpus_file: Artefact =
            serde_json::from_reader(std::fs::File::open(corpus_file_path)?)?;

        for face in &corpus_file {
            // validate that the numerical part of the grapheme id is the same as the corpus file name
            let file_number = corpus_file_name
                .chars()
                .skip(1)
                .take(3)
                .collect::<String>()
                .parse::<u64>()?;
            let face_number = face
                .id
                .chars()
                .filter(char::is_ascii_digit)
                .collect::<String>()
                .parse::<u64>()?;
            if file_number != face_number {
                return Err(anyhow!(
                    "Corpus file {} does not match face id {}",
                    corpus_file_name,
                    face.id
                ));
            }

            // now validate that the number of features in the graphemes match the number of features in the corpus file
            for grapheme in &face.graphemes {
                let feature_file = graphemes
                    .iter()
                    .find(|gr| gr.id == grapheme.id)
                    .ok_or_else(|| anyhow!("Grapheme {} not found", grapheme.id))?;
                // here we add 3 for the default features
                let grapheme_features = feature_file.get_feature_count() + 3;
                let glink_features = grapheme.get_feature_count();
                if grapheme_features != glink_features {
                    return Err(anyhow!(
                        "Grapheme {} has {} features but corpus file {} has {} features",
                        grapheme.id,
                        grapheme_features,
                        corpus_file_name,
                        glink_features
                    ));
                }
            }
        }

        files.push(corpus_file);
    }

    Ok(files)
}
