//! This utility is used to describe artefacts in the corpus

use std::{collections::HashMap, env::current_dir};

use clap::Parser;
use indus_corpus::{ArtefactFace, FeatureFile, Grapheme};

#[derive(Parser, Debug)]
struct Opts {
    /// The artefact name, e.g. "m102" for Mohenjo-Daro 102 as per Parpola's corpus
    /// See the Corpus of Indus Seals and Inscriptions (CISI) by Asko Parpola
    #[arg(short, long)]
    artefact_name: String,
}

#[allow(clippy::expect_used)]
fn main() {
    let opts = Opts::parse();
    // find the appropriate subdirectory based on the artefact name
    // for instance, if the artefact name is "m102", the file will be "../corpus/m100_m199/m102.json"
    let path = get_corpus_subdir(&opts.artefact_name);
    let json_data = std::fs::read_to_string(path).expect("Failed to read file");
    let artefact_sides: Vec<ArtefactFace> =
        serde_json::from_str(&json_data).expect("Failed to parse JSON");

    // load all features from the features subdirectory. files will have names like P013.json and we will ignore the file "default_features.json"
    let features = load_feature_files();

    // now we can iterate over the artefact's graphemes and print out the features
    for artefact_face in &artefact_sides {
        println!("Artefact {}", artefact_face.id);
        println!("Description: {}", artefact_face.description);
        for grapheme in &artefact_face.graphemes {
            pretty_print_grapheme(grapheme, &features);
        }
    }
}

#[allow(clippy::expect_used)]
fn get_corpus_subdir(artefact_name: &str) -> String {
    #[allow(clippy::string_slice)]
    let artefact_number = artefact_name[1..2]
        .parse::<u64>()
        .expect("Failed to parse artefact number");
    let artefact_letter = artefact_name
        .chars()
        .next()
        .expect("Failed to get first character");

    let start_num = i32::from(artefact_number == 0);
    let subdir = format!(
        "{artefact_letter}{artefact_number}0{start_num}_{artefact_letter}{artefact_number}99"
    );
    let prefix = if current_dir()
        .expect("Failed to get cwd")
        .ends_with("artefact_finder")
    {
        "../"
    } else {
        ""
    };
    format!("{prefix}corpus/{subdir}/{artefact_name}.json")
}

#[allow(clippy::expect_used)]
fn load_feature_files() -> HashMap<String, FeatureFile> {
    let prefix = if current_dir()
        .expect("Failed to get cwd")
        .ends_with("artefact_finder")
    {
        "../"
    } else {
        ""
    };
    let feature_files =
        std::fs::read_dir(format!("{prefix}features")).expect("Failed to read features directory");
    let mut features: HashMap<String, FeatureFile> = HashMap::new();
    for feature_file in feature_files {
        let feature_file = feature_file.expect("Failed to read feature file");
        let feature_path = feature_file.path();
        let feature_name = feature_path
            .file_name()
            .expect("Failed to get feature file path")
            .to_str()
            .expect("Failed to get feature file name")
            .split('.')
            .next()
            .expect("Failed to get feature name")
            .to_owned();
        if feature_name == "default_features" {
            continue;
        }
        let feature: FeatureFile = serde_json::from_reader(
            std::fs::File::open(feature_path).expect("Failed to open file"),
        )
        .expect("Failed to parse JSON");
        let _unused = features.insert(feature_name, feature);
    }

    features
}

#[allow(clippy::expect_used)]
fn pretty_print_grapheme(grapheme: &Grapheme, features: &HashMap<String, FeatureFile>) {
    let grapheme_description = &features
        .get(&grapheme.id)
        .expect("Failed to get grapheme description")
        .description;
    println!("Grapheme {} [{grapheme_description}]", grapheme.id);

    // the first three features are "damage", "line", and "uncertainty"
    // the rest of the features come from the feature file with the same name as the grapheme
    for (i, feature) in grapheme.features.iter().enumerate() {
        if i < 3 {
            println!("  {i}: {feature}");
        } else {
            let feature_file = features
                .get(&grapheme.id)
                .expect("Failed to get feature file");
            let feature_name = feature_file
                .features
                .get(i - 3)
                .expect("Failed to get feature");
            // one of the items in the feature_name hashmap is "description"
            // the other will be the feature's tag, but with an arbitrary key name
            // we want to print out the tag, then the value in the 'feature' variable
            // then print the description
            let mut keys = feature_name.keys().collect::<Vec<&String>>();
            if keys[0] == "description" {
                // reverse the keys so that the description is always last
                keys.reverse();
            }
            let tag = keys[0];
            let description = feature_name
                .get("description")
                .expect("Failed to get description");
            println!("  {i}: {feature} [{tag}: {description}]");
        }
    }
}
