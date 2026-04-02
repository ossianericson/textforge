use std::path::{Component, Path, PathBuf};

use tauri::Manager;

pub const MAX_INPUT_LENGTH: usize = 8192;
pub const MAX_CREDENTIAL_LENGTH: usize = 2048;
pub const MAX_PATH_LENGTH: usize = 1024;

pub const ALLOWED_SIDECARS: &[&str] = &[
    "compile-spec",
    "parse-spec",
    "validate-spec",
];

pub fn validate_input(value: &str, max_len: usize, field_name: &str) -> Result<(), String> {
    if value.len() > max_len {
        return Err(format!(
            "Input field '{}' exceeds maximum length of {} bytes",
            field_name, max_len
        ));
    }

    if value.contains('\0') {
        return Err(format!(
            "Input field '{}' contains invalid null byte",
            field_name
        ));
    }

    Ok(())
}

pub fn validate_file_path(path_str: &str) -> Result<PathBuf, String> {
    validate_input(path_str, MAX_PATH_LENGTH, "path")?;

    let path = Path::new(path_str);
    if !path.is_absolute() {
        return Err(format!("File path must be absolute: {}", path_str));
    }

    if path
        .components()
        .any(|component| matches!(component, Component::ParentDir))
    {
        return Err("Path traversal sequences are not permitted".to_string());
    }

    let normalized = if path.exists() {
        path.canonicalize().unwrap_or_else(|_| path.to_path_buf())
    } else {
        path.to_path_buf()
    };

    let blocked_prefixes = [
        "/etc",
        "/sys",
        "/proc",
        "/dev",
        "/private/var",
        "/Library/Keychains",
        "C:\\Windows",
        "C:\\Program Files",
        "C:\\Program Files (x86)",
    ];

    let normalized_lower = normalized.to_string_lossy().to_lowercase();
    for blocked in blocked_prefixes {
        if normalized_lower.starts_with(&blocked.to_lowercase()) {
            return Err(format!(
                "Access to system directory is not permitted: {}",
                blocked
            ));
        }
    }

    Ok(normalized)
}

pub fn validate_sidecar_name(name: &str) -> Result<(), String> {
    validate_input(name, 128, "sidecar_name")?;
    if ALLOWED_SIDECARS.contains(&name) {
        Ok(())
    } else {
        Err(format!(
            "Sidecar '{}' is not in the allowed list. Permitted sidecars: {}",
            name,
            ALLOWED_SIDECARS.join(", ")
        ))
    }
}

pub fn redact_for_log(value: &str) -> String {
    if value.len() < 12 {
        "[REDACTED]".to_string()
    } else {
        format!("{}...{}", &value[..4], &value[value.len() - 4..])
    }
}

pub fn audit_log(app: &tauri::AppHandle, op: &str, kind: &str, ok: bool) {
    use std::io::Write;
    use std::time::{SystemTime, UNIX_EPOCH};

    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0);

    let line = format!(
        "{{\"ts\":{ts},\"op\":\"{op}\",\"kind\":\"{kind}\",\"ok\":{ok}}}\n"
    );

    let Ok(data_dir) = app.path().app_data_dir() else {
        return;
    };
    let _ = std::fs::create_dir_all(&data_dir);
    let path = data_dir.join("audit.log");

    if let Ok(meta) = std::fs::metadata(&path) {
        if meta.len() > 1_048_576 {
            if let Ok(content) = std::fs::read_to_string(&path) {
                let lines: Vec<&str> = content.lines().collect();
                let keep_from = lines.len() / 2;
                let trimmed = lines[keep_from..].join("\n") + "\n";
                let _ = std::fs::write(&path, trimmed);
            }
        }
    }

    let _ = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .and_then(|mut file| file.write_all(line.as_bytes()));
}