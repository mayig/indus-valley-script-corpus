//! My personal playground for analyzing the Indus Valley Civilization dataset.

use anyhow::Result;
use indus_corpus::corpus::{load_corpus, load_graphemes};

fn main() -> Result<()> {
    let prefix = if std::env::current_dir()?.ends_with("analysis") {
        "../"
    } else {
        ""
    };
    let _feature_files = load_graphemes(&format!("{prefix}features"))?;
    let artefacts = load_corpus(&format!("{prefix}corpus"))?;

    // let's get simple lists of sign id's from each artefact
    let mut sign_ids: Vec<Vec<u32>> = Vec::new();
    for artefact in &artefacts {
        let mut sign_id: Vec<u32> = Vec::new();
        for face in artefact {
            for grapheme in &face.graphemes {
                // the id looks like "P102" so we need to parse out the number
                let grapheme_id = grapheme.id.chars().skip(1).collect::<String>();
                sign_id.push(grapheme_id.parse()?);
            }
        }
        sign_ids.push(sign_id);
    }

    // now let's get the 10 most common bigrams and print them out
    let mut bigram_counts: std::collections::HashMap<(u32, u32), u32> =
        std::collections::HashMap::new();
    for sign_id in &sign_ids {
        for i in 0..sign_id.len() - 1 {
            let bigram = (sign_id[i], sign_id[i + 1]);
            *bigram_counts.entry(bigram).or_insert(0) += 1;
        }
    }
    // get the top 10 bigrams
    let mut bigram_counts_vec: Vec<((u32, u32), u32)> = bigram_counts.into_iter().collect();
    bigram_counts_vec.sort_by(|lhs, rhs| rhs.1.cmp(&lhs.1));
    for (bigram, count) in bigram_counts_vec.iter().take(10) {
        println!("Bigram {bigram:?} has count {count}");
    }

    Ok(())
}
