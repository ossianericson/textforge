use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use std::time::Duration;

use crate::security::{validate_file_path, validate_input, validate_sidecar_name, MAX_INPUT_LENGTH};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use tauri::Manager;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

static REPO_ROOT_OVERRIDE: Mutex<Option<String>> = Mutex::new(None);

fn candidate_release_sidecar_paths(resource_dir: &std::path::Path, exe_dir: Option<&std::path::Path>, name: &str) -> Vec<PathBuf> {
    let sidecar_file_name = if cfg!(target_os = "windows") {
        format!("{}.exe", name)
    } else {
        name.to_string()
    };

    let mut candidates = vec![
        resource_dir.join("binaries").join(&sidecar_file_name),
        resource_dir
            .join("resources")
            .join("binaries")
            .join(&sidecar_file_name),
    ];

    if let Some(exe_dir) = exe_dir {
        candidates.push(exe_dir.join("binaries").join(&sidecar_file_name));
        candidates.push(
            exe_dir
                .join("resources")
                .join("binaries")
                .join(&sidecar_file_name),
        );
    }

    candidates
}

#[tauri::command]
pub fn set_repo_root(path: String) -> Result<(), String> {
    validate_input(&path, MAX_INPUT_LENGTH, "path")?;
    let validated = validate_file_path(&path)?;
    let mut guard = REPO_ROOT_OVERRIDE
        .lock()
        .map_err(|_| "Failed to acquire repo root lock".to_string())?;
    *guard = Some(validated.to_string_lossy().to_string());
    Ok(())
}

fn resolve_repo_root() -> Result<PathBuf, String> {
    if let Ok(guard) = REPO_ROOT_OVERRIDE.lock() {
        if let Some(ref stored) = *guard {
            return Ok(PathBuf::from(stored));
        }
    }

    if let Ok(exe_path) = std::env::current_exe() {
        let mut candidate = exe_path.parent().map(|path| path.to_path_buf());
        for _ in 0..10 {
            if let Some(ref dir) = candidate {
                let package_json = dir.join("package.json");
                if package_json.exists() {
                    if let Ok(content) = std::fs::read_to_string(&package_json) {
                        if content.contains("\"name\": \"textforge\"") {
                            return Ok(dir.clone());
                        }
                    }
                }
                candidate = dir.parent().map(|path| path.to_path_buf());
            } else {
                break;
            }
        }
    }

    if let Ok(cwd) = std::env::current_dir() {
        let mut candidate = Some(cwd.clone());
        for _ in 0..6 {
            if let Some(ref dir) = candidate {
                let package_json = dir.join("package.json");
                if package_json.exists() {
                    if let Ok(content) = std::fs::read_to_string(&package_json) {
                        if content.contains("\"name\": \"textforge\"") {
                            return Ok(dir.clone());
                        }
                    }
                }
                candidate = dir.parent().map(|path| path.to_path_buf());
            } else {
                break;
            }
        }

        if cwd.ends_with("src-tauri") {
            if let Some(editor_dir) = cwd.parent() {
                if let Some(repo_root) = editor_dir.parent() {
                    return Ok(repo_root.to_path_buf());
                }
            }
        }

        if cwd.ends_with("editor") {
            if let Some(repo_root) = cwd.parent() {
                return Ok(repo_root.to_path_buf());
            }
        }

        return Ok(cwd);
    }

    Err(
        "Cannot resolve the textforge repository root. Open a spec file first - the editor will then locate the repo automatically."
            .to_string(),
    )
}

fn resolve_release_sidecar_path(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    let resource_dir = app.path().resource_dir().map_err(|error| error.to_string())?;
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(|parent| parent.to_path_buf()));

    let candidates = candidate_release_sidecar_paths(&resource_dir, exe_dir.as_deref(), name);

    for binary_path in &candidates {
        if binary_path.exists() {
            return Ok(binary_path.clone());
        }
    }

    Ok(candidates
        .into_iter()
        .next()
        .unwrap_or_else(|| resource_dir.join("binaries").join(name)))
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

    let (command_factory, timeout_secs): (
        Box<dyn FnOnce() -> Result<std::process::Output, String> + Send>,
        u64,
    ) = if cfg!(debug_assertions) {
        let repo_root = resolve_repo_root()?;
        let tsx_cli_path = resolve_dev_tsx_cli_path(&repo_root)?;
        let script = repo_root
            .join("editor")
            .join("sidecar")
            .join(format!("{}.ts", name));

        if !tsx_cli_path.exists() {
            return Err(format!(
                "tsx not found at '{}'. Run 'npm install' in the editor/ directory, then restart the editor.",
                tsx_cli_path.display()
            ));
        }

        if !script.exists() {
            return Err(format!(
                "Sidecar script missing: '{}'. The installation may be incomplete.",
                script.display()
            ));
        }

        let arg1_c = arg1.clone();
        let arg2_c = arg2.clone();
        let name_c = name.clone();

        (
            Box::new(move || {
                let mut command = Command::new("node");
                command.arg(&tsx_cli_path).arg(&script).arg(&arg1_c);
                if let Some(ref second_arg) = arg2_c {
                    command.arg(second_arg);
                }

                #[cfg(target_os = "windows")]
                command.creation_flags(CREATE_NO_WINDOW);

                command.current_dir(&repo_root).output().map_err(|error| {
                    format!(
                        "Failed to start '{}'. Ensure Node.js 22+ is installed and in PATH. Details: {}",
                        name_c, error
                    )
                })
            }),
            45,
        )
    } else {
        let binary_path = resolve_release_sidecar_path(&app, &name)?;

        if !binary_path.exists() {
            return Err(format!(
                "Sidecar binary missing: '{}'. Reinstall the application.",
                binary_path.display()
            ));
        }

        let arg1_c = arg1.clone();
        let arg2_c = arg2.clone();
        let name_c = name.clone();

        (
            Box::new(move || {
                let mut command = Command::new(&binary_path);
                command.arg(&arg1_c);
                if let Some(ref second_arg) = arg2_c {
                    command.arg(second_arg);
                }

                #[cfg(target_os = "windows")]
                command.creation_flags(CREATE_NO_WINDOW);

                command
                    .output()
                    .map_err(|error| format!("Failed to start '{}': {}", name_c, error))
            }),
            45,
        )
    };

    let output = tokio::time::timeout(
        Duration::from_secs(timeout_secs),
        tokio::task::spawn_blocking(command_factory),
    )
    .await
    .map_err(|_| {
        format!(
            "The '{}' operation timed out after {} seconds. On Windows this can happen the first time Node.js runs after a restart (antivirus scanning). Try again - subsequent runs are faster. If repeated, add the textforge directory to your antivirus exclusion list.",
            name, timeout_secs
        )
    })?
    .map_err(|error| format!("Sidecar task panicked: {}", error))?
    .map_err(|error| error)?;

    if output.status.success() {
        String::from_utf8(output.stdout)
            .map_err(|error| format!("Sidecar '{}' produced non-UTF-8 output: {}", name, error))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        Err(format!(
            "Sidecar '{}' failed (exit {:?}).\nstdout: {}\nstderr: {}",
            name,
            output.status.code(),
            stdout,
            stderr
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::candidate_release_sidecar_paths;
    use std::path::Path;

    #[test]
    fn prefers_resource_dir_binaries_first() {
        let resource_dir = Path::new("C:/app");
        let exe_dir = Some(Path::new("C:/portable"));

        let candidates = candidate_release_sidecar_paths(resource_dir, exe_dir, "compile-spec");

        assert_eq!(candidates.len(), 4);
        assert!(candidates[0].to_string_lossy().contains("app"));
        assert!(candidates[0].to_string_lossy().contains("binaries"));
        assert!(candidates[1].to_string_lossy().contains("resources"));
    }

    #[test]
    fn includes_portable_exe_adjacent_binaries_locations() {
        let resource_dir = Path::new("C:/portable");
        let exe_dir = Some(Path::new("C:/portable"));

        let candidates = candidate_release_sidecar_paths(resource_dir, exe_dir, "parse-spec");
        let candidate_text: Vec<String> = candidates
            .into_iter()
            .map(|path| path.to_string_lossy().replace('\\', "/"))
            .collect();

        assert!(candidate_text.iter().any(|path| path.contains("/binaries/parse-spec")));
        assert!(candidate_text
            .iter()
            .any(|path| path.contains("/resources/binaries/parse-spec")));
    }

    #[test]
    fn works_without_exe_dir() {
        let resource_dir = Path::new("C:/app");

        let candidates = candidate_release_sidecar_paths(resource_dir, None, "validate-spec");

        assert_eq!(candidates.len(), 2);
    }
}