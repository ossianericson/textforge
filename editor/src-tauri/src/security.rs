use std::path::{Component, Path, PathBuf};

use chrono::{DateTime, Utc};
use tauri::Manager;

pub const MAX_INPUT_LENGTH: usize = 8192;
pub const MAX_CREDENTIAL_LENGTH: usize = 2048;
pub const MAX_PATH_LENGTH: usize = 1024;

pub const ALLOWED_SIDECARS: &[&str] = &[
    "compile-spec",
    "compile-parsed-spec",
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

fn audit_log_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve data dir: {error}"))?;
    Ok(data_dir.join("audit.log"))
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

    let Ok(path) = audit_log_path(app) else {
        return;
    };
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

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

#[tauri::command]
pub fn query_audit_log(
    app: tauri::AppHandle,
    category: Option<String>,
    action: Option<String>,
    since_iso: Option<String>,
) -> Result<Vec<serde_json::Value>, String> {
    let log_path = audit_log_path(&app)?;
    if !log_path.exists() {
        return Ok(vec![]);
    }

    let since_ts = if let Some(value) = since_iso {
        Some(
            DateTime::parse_from_rfc3339(&value)
                .map_err(|error| format!("Invalid since_iso timestamp: {error}"))?
                .with_timezone(&Utc)
                .timestamp(),
        )
    } else {
        None
    };

    let content = std::fs::read_to_string(&log_path)
        .map_err(|error| format!("Failed to read audit log: {error}"))?;

    let mut results = Vec::new();
    for line in content.lines() {
        if line.trim().is_empty() {
            continue;
        }

        let entry: serde_json::Value = match serde_json::from_str(line) {
            Ok(value) => value,
            Err(_) => continue,
        };

        if let Some(ref category_filter) = category {
            let operation = entry
                .get("operation")
                .or_else(|| entry.get("op"))
                .and_then(serde_json::Value::as_str)
                .unwrap_or("");
            let resource = entry
                .get("resource")
                .or_else(|| entry.get("kind"))
                .and_then(serde_json::Value::as_str)
                .unwrap_or("");

            if !operation.contains(category_filter) && !resource.contains(category_filter) {
                continue;
            }
        }

        if let Some(ref action_filter) = action {
            let operation = entry
                .get("operation")
                .or_else(|| entry.get("op"))
                .and_then(serde_json::Value::as_str)
                .unwrap_or("");
            if operation != action_filter {
                continue;
            }
        }

        if let Some(since_threshold) = since_ts {
            let entry_ts = entry
                .get("ts")
                .and_then(serde_json::Value::as_i64)
                .or_else(|| {
                    entry.get("timestamp")
                        .and_then(serde_json::Value::as_str)
                        .and_then(|value| DateTime::parse_from_rfc3339(value).ok())
                        .map(|value| value.with_timezone(&Utc).timestamp())
                });

            if let Some(entry_ts) = entry_ts {
                if entry_ts < since_threshold {
                    continue;
                }
            }
        }

        results.push(entry);
    }

    Ok(results)
}