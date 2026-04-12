use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::security::{validate_file_path, validate_input, MAX_INPUT_LENGTH};
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecentFile {
    pub path: String,
    pub title: String,
    pub lastOpened: i64,
    pub lastCompiled: i64,
    pub questionCount: i64,
    pub resultCount: i64,
    pub warningCount: i64,
    pub usageCount: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct EditorPrefs {
    pub analytics_enabled: bool,
    pub auto_save_enabled: bool,
    pub template_customize_dismissed: bool,
}

fn app_config_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Failed to resolve app config dir: {error}"))?;
    fs::create_dir_all(&path)
        .map_err(|error| format!("Failed to create app config dir {}: {error}", path.display()))?;
    Ok(path)
}

fn recent_files_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_config_dir(app)?.join("recent-files.json"))
}

fn editor_prefs_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_config_dir(app)?.join("editor-prefs.json"))
}

fn onboarding_complete_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_config_dir(app)?.join("onboarding-complete.json"))
}

fn compiled_output_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .app_local_data_dir()
        .map_err(|error| format!("Failed to resolve app local data dir: {error}"))?
        .join("compiled");
    fs::create_dir_all(&path)
        .map_err(|error| format!("Failed to create compiled output dir {}: {error}", path.display()))?;
    Ok(path)
}

fn load_recent_files_inner(app: &tauri::AppHandle) -> Result<Vec<RecentFile>, String> {
    let path = recent_files_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path)
        .map_err(|error| format!("Failed to read {}: {error}", path.display()))?;
    serde_json::from_str(&content)
        .map_err(|error| format!("Failed to parse {}: {error}", path.display()))
}

fn save_recent_files_inner(app: &tauri::AppHandle, files: &[RecentFile]) -> Result<(), String> {
    let path = recent_files_path(app)?;
    let bytes = serde_json::to_vec_pretty(files)
        .map_err(|error| format!("Failed to serialize recent files: {error}"))?;
    fs::write(&path, bytes).map_err(|error| format!("Failed to save {}: {error}", path.display()))
}

fn load_editor_prefs_inner(app: &tauri::AppHandle) -> Result<EditorPrefs, String> {
    let path = editor_prefs_path(app)?;
    if !path.exists() {
        return Ok(EditorPrefs::default());
    }
    let content = fs::read_to_string(&path)
        .map_err(|error| format!("Failed to read {}: {error}", path.display()))?;
    serde_json::from_str(&content)
        .map_err(|error| format!("Failed to parse {}: {error}", path.display()))
}

fn save_editor_prefs_inner(app: &tauri::AppHandle, prefs: &EditorPrefs) -> Result<(), String> {
    let path = editor_prefs_path(app)?;
    let bytes = serde_json::to_vec_pretty(prefs)
        .map_err(|error| format!("Failed to serialize editor prefs: {error}"))?;
    fs::write(&path, bytes).map_err(|error| format!("Failed to save {}: {error}", path.display()))
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    let validated_path = validate_file_path(&path)?;
    fs::read_to_string(&validated_path)
        .map_err(|error| format!("Failed to read file: {}", error))
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    let validated_path = validate_file_path(&path)?;
    validate_input(&content, MAX_INPUT_LENGTH * 10, "content")?;

    if let Some(parent) = Path::new(&validated_path).parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create directories: {}", error))?;
    }

    fs::write(&validated_path, content).map_err(|error| format!("Failed to write file: {}", error))
}

#[tauri::command]
pub async fn file_exists(path: String) -> bool {
    match validate_file_path(&path) {
        Ok(validated_path) => validated_path.exists(),
        Err(_) => false,
    }
}

#[tauri::command]
pub async fn load_recent_files(app: tauri::AppHandle) -> Result<Vec<RecentFile>, String> {
    load_recent_files_inner(&app)
}

#[tauri::command]
pub async fn get_compiled_output_root(app: tauri::AppHandle) -> Result<String, String> {
    Ok(compiled_output_root(&app)?.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn open_path_in_file_manager(path: String) -> Result<(), String> {
    let validated_path = validate_file_path(&path)?;
    let target_path = if validated_path.is_dir() {
        validated_path
    } else {
        validated_path
            .parent()
            .map(Path::to_path_buf)
            .ok_or_else(|| format!("No parent directory exists for {}", validated_path.display()))?
    };

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&target_path)
            .spawn()
            .map_err(|error| format!("Failed to open {} in Explorer: {error}", target_path.display()))?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&target_path)
            .spawn()
            .map_err(|error| format!("Failed to open {} in Finder: {error}", target_path.display()))?;
        return Ok(());
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&target_path)
            .spawn()
            .map_err(|error| format!("Failed to open {} in file manager: {error}", target_path.display()))?;
        return Ok(());
    }

    #[allow(unreachable_code)]
    Err(format!(
        "Opening files in a file manager is not supported on this platform for {}",
        target_path.display()
    ))
}

#[tauri::command]
pub async fn update_recent_file(app: tauri::AppHandle, file: RecentFile) -> Result<(), String> {
    let mut files = load_recent_files_inner(&app)?;
    files.retain(|existing| existing.path != file.path);
    files.push(file);
    files.sort_by(|left, right| right.lastCompiled.cmp(&left.lastCompiled));
    save_recent_files_inner(&app, &files)
}

#[tauri::command]
pub async fn remove_recent_file(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let mut files = load_recent_files_inner(&app)?;
    files.retain(|existing| existing.path != path);
    save_recent_files_inner(&app, &files)
}

#[tauri::command]
pub async fn update_window_title(
    app: tauri::AppHandle,
    title: String,
    dirty: bool,
) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window is not available".to_string())?;
    let dirty_marker = if dirty { " ●" } else { "" };
    window
        .set_title(&format!("textforge — {}{}", title, dirty_marker))
        .map_err(|error| format!("Failed to update window title: {error}"))
}

#[tauri::command]
pub async fn load_editor_prefs(app: tauri::AppHandle) -> Result<EditorPrefs, String> {
    load_editor_prefs_inner(&app)
}

#[tauri::command]
pub async fn save_editor_prefs(app: tauri::AppHandle, prefs: EditorPrefs) -> Result<(), String> {
    save_editor_prefs_inner(&app, &prefs)
}

#[tauri::command]
pub async fn is_onboarding_complete(app: tauri::AppHandle) -> Result<bool, String> {
    let path = onboarding_complete_path(&app)?;
    Ok(path.exists())
}

#[tauri::command]
pub async fn mark_onboarding_complete(app: tauri::AppHandle) -> Result<(), String> {
    let path = onboarding_complete_path(&app)?;
    fs::write(&path, b"{\"complete\":true}")
        .map_err(|error| format!("Failed to save {}: {error}", path.display()))
}

#[tauri::command]
pub async fn read_audit_log(
    app: tauri::AppHandle,
    max_lines: Option<usize>,
) -> Result<Vec<String>, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve data dir: {error}"))?
        .join("audit.log");

    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = std::fs::read_to_string(&path)
        .map_err(|error| format!("Failed to read audit log: {error}"))?;

    let lines: Vec<String> = content
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| line.to_string())
        .collect();

    let limit = max_lines.unwrap_or(200).min(1000);
    let start = if lines.len() > limit {
        lines.len() - limit
    } else {
        0
    };

    Ok(lines[start..].to_vec())
}