use std::{env, path::Path};

fn main() {
    if !Path::new("binaries").exists() {
        env::set_var("TAURI_CONFIG", r#"{"bundle":{"resources":[]}}"#);
    }

    tauri_build::build()
}
