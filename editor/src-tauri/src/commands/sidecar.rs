use std::env;
use std::path::PathBuf;
use std::process::Command;

use crate::security::{validate_file_path, validate_input, validate_sidecar_name, MAX_INPUT_LENGTH};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use tauri::Manager;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn resolve_repo_root() -> Result<PathBuf, String> {
    let cwd = env::current_dir().map_err(|error| error.to_string())?;
    if cwd.ends_with("src-tauri") {
        return Ok(cwd
            .parent()
            .and_then(|path| path.parent())
            .map(|path| path.to_path_buf())
            .unwrap_or(cwd));
    }

    if cwd.ends_with("editor") {
        return Ok(cwd.parent().map(|path| path.to_path_buf()).unwrap_or(cwd));
    }

    Ok(cwd)
}

fn resolve_release_sidecar_path(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    let mut binary_path = app
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?
        .join("binaries")
        .join(name);

    if cfg!(target_os = "windows") {
        binary_path.set_extension("exe");
    }

    Ok(binary_path)
}

fn resolve_dev_tsx_cli_path(repo_root: &std::path::Path) -> Result<PathBuf, String> {
    let cli_path = repo_root
        .join("editor")
        .join("node_modules")
        .join("tsx")
        .join("dist")
        .join("cli.mjs");

    if cli_path.exists() {
        Ok(cli_path)
    } else {
        Err(format!(
            "Local tsx CLI not found at {}. Run npm install in editor/.",
            cli_path.display()
        ))
    }
}

#[tauri::command]
pub async fn run_sidecar(
    app: tauri::AppHandle,
    name: String,
    arg1: String,
    arg2: Option<String>,
) -> Result<String, String> {
    validate_sidecar_name(&name)?;
    validate_input(&arg1, MAX_INPUT_LENGTH, "arg1")?;
    validate_file_path(&arg1)?;
    if let Some(second_arg) = arg2.as_deref() {
        validate_input(second_arg, MAX_INPUT_LENGTH, "arg2")?;
        validate_file_path(second_arg)?;
    }

    let output = if cfg!(debug_assertions) {
        let repo_root = resolve_repo_root()?;
        let tsx_cli_path = resolve_dev_tsx_cli_path(&repo_root)?;
        let script = repo_root
            .join("editor")
            .join("sidecar")
            .join(format!("{}.ts", name));

        let mut command = Command::new("node");
        command.arg(&tsx_cli_path).arg(&script).arg(&arg1);
        if let Some(ref second_arg) = arg2 {
            command.arg(second_arg);
        }

        #[cfg(target_os = "windows")]
        command.creation_flags(CREATE_NO_WINDOW);

        command
            .current_dir(&repo_root)
            .output()
            .map_err(|error| format!("Failed to spawn tsx: {}", error))?
    } else {
        let binary_path = resolve_release_sidecar_path(&app, &name)?;

        let mut command = Command::new(&binary_path);
        command.arg(&arg1);
        if let Some(ref second_arg) = arg2 {
            command.arg(second_arg);
        }

        #[cfg(target_os = "windows")]
        command.creation_flags(CREATE_NO_WINDOW);

        command
            .output()
            .map_err(|error| format!("Failed to spawn sidecar {}: {}", name, error))?
    };

    if output.status.success() {
        String::from_utf8(output.stdout)
            .map_err(|error| format!("Sidecar output not valid UTF-8: {}", error))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        Err(format!(
            "Sidecar {} exited with code {:?}.\nstdout: {}\nstderr: {}",
            name,
            output.status.code(),
            stdout,
            stderr
        ))
    }
}