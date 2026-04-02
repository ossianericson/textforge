use std::fs;
use std::path::{Path, PathBuf};

use crate::security::{
    audit_log, validate_file_path, validate_input, MAX_CREDENTIAL_LENGTH, MAX_INPUT_LENGTH,
};
use git2::{
    Cred, FetchOptions, IndexAddOption, ObjectType, PushOptions, RemoteCallbacks, Repository,
    Signature,
};
use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use tauri::Manager;

const KEYRING_SERVICE: &str = "textforge-editor";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RepoConnection {
    pub url: String,
    pub branch: String,
    pub local_path: String,
    pub current_branch: String,
    pub last_synced: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedRepoConnection {
    pub url: String,
    pub branch: String,
    pub local_path: String,
    pub last_synced: i64,
}

#[derive(Debug, Deserialize)]
struct SavedRepoConnectionFile {
    url: String,
    branch: String,
    local_path: String,
    last_synced: i64,
    #[serde(default)]
    pat: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RepoSpecEntry {
    pub path: String,
    pub title: String,
    pub kind: String,
    pub modified_at: i64,
    pub has_warnings: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CommitResult {
    pub branch: String,
    pub commit_oid: String,
    pub pushed: bool,
    pub created_pull_request: bool,
    pub pull_request_url: Option<String>,
    pub message: String,
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

fn app_cache_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .app_cache_dir()
        .map_err(|error| format!("Failed to resolve app cache dir: {error}"))?;
    fs::create_dir_all(&path)
        .map_err(|error| format!("Failed to create app cache dir {}: {error}", path.display()))?;
    Ok(path)
}

fn saved_connections_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_config_dir(app)?.join("repo-connections.json"))
}

fn git_pat_entry(url: &str) -> Result<Entry, String> {
    let account = format!("git-pat:{}", url.trim());
    let account = if account.len() > 400 {
        account[..400].to_string()
    } else {
        account
    };
    Entry::new(KEYRING_SERVICE, &account)
        .map_err(|error| format!("Failed to access keychain: {error}"))
}

fn save_pat_for_url(app: &tauri::AppHandle, url: &str, pat: &str) -> Result<(), String> {
    let entry = git_pat_entry(url)?;
    let trimmed = pat.trim();
    if trimmed.is_empty() {
        match entry.delete_password() {
            Ok(()) | Err(KeyringError::NoEntry) => {
                audit_log(app, "clear", "git_pat", true);
                Ok(())
            }
            Err(error) => Err(format!("Failed to clear PAT from keychain: {error}")),
        }
    } else {
        entry
            .set_password(trimmed)
            .map_err(|error| format!("Failed to save PAT to keychain: {error}"))?;
        audit_log(app, "write", "git_pat", true);
        Ok(())
    }
}

fn load_pat_for_url(app: &tauri::AppHandle, url: &str) -> Option<String> {
    let entry = match git_pat_entry(url) {
        Ok(entry) => entry,
        Err(_) => {
            audit_log(app, "read", "git_pat", false);
            return None;
        }
    };
    match entry.get_password() {
        Ok(pat) if !pat.trim().is_empty() => {
            audit_log(app, "read", "git_pat", true);
            Some(pat)
        }
        _ => {
            audit_log(app, "read", "git_pat", false);
            None
        }
    }
}

fn resolve_pat(
    app: &tauri::AppHandle,
    url: &str,
    provided_pat: Option<String>,
) -> Result<Option<String>, String> {
    if let Some(pat) = provided_pat {
        validate_input(&pat, MAX_CREDENTIAL_LENGTH, "pat")?;
        save_pat_for_url(app, url, &pat)?;
        let trimmed = pat.trim().to_string();
        if trimmed.is_empty() {
            Ok(None)
        } else {
            Ok(Some(trimmed))
        }
    } else {
        // NOTE: PATs stored with the previous DefaultHasher-based key format
        // (textforge-editor, "git-pat-{hex}") cannot be migrated automatically
        // because DefaultHasher is non-deterministic across Rust versions.
        // Users will be prompted to re-enter their PAT once after this upgrade.
        // The PAT field in the commit modal accepts a new value and saves it
        // to the new URL-based keychain account automatically.
        Ok(load_pat_for_url(app, url))
    }
}

fn validate_repo_relative_path(path: &str) -> Result<(), String> {
    validate_input(path, MAX_INPUT_LENGTH, "spec_path")?;
    let relative = Path::new(path);
    if relative.is_absolute() {
        return Err("Spec path must be repo-relative".to_string());
    }
    if relative
        .components()
        .any(|component| matches!(component, std::path::Component::ParentDir))
    {
        return Err("Spec path cannot contain parent directory traversal".to_string());
    }
    Ok(())
}

fn repo_cache_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app_cache_dir(app)?.join("repos");
    fs::create_dir_all(&path)
        .map_err(|error| format!("Failed to create repo cache dir {}: {error}", path.display()))?;
    Ok(path)
}

fn now_ts() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

fn default_branch(branch: Option<String>) -> String {
    branch
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "main".to_string())
}

fn slugify(input: &str) -> String {
    let mut slug = String::new();
    let mut last_dash = false;
    for ch in input.chars() {
        let lower = ch.to_ascii_lowercase();
        if lower.is_ascii_alphanumeric() {
            slug.push(lower);
            last_dash = false;
        } else if !last_dash {
            slug.push('-');
            last_dash = true;
        }
    }
    slug.trim_matches('-').to_string()
}

fn stable_repo_dir_name(url: &str) -> String {
    let hash = url.as_bytes().iter().fold(0xcbf29ce484222325_u64, |hash, byte| {
        (hash ^ u64::from(*byte)).wrapping_mul(0x100000001b3)
    });
    let tail = url.rsplit('/').next().unwrap_or("repo").trim_end_matches(".git");
    format!("{}-{:x}", slugify(tail), hash)
}

fn current_branch_name(repo: &Repository) -> Result<String, String> {
    let head = repo.head().map_err(|error| format!("Failed to read HEAD: {error}"))?;
    head.shorthand()
        .map(|name| name.to_string())
        .ok_or_else(|| "Repository HEAD is detached".to_string())
}

fn load_saved_connections_inner(app: &tauri::AppHandle) -> Result<Vec<SavedRepoConnection>, String> {
    let path = saved_connections_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path)
        .map_err(|error| format!("Failed to read {}: {error}", path.display()))?;
    let parsed: Vec<SavedRepoConnectionFile> = serde_json::from_str(&content)
        .map_err(|error| format!("Failed to parse {}: {error}", path.display()))?;

    let mut migrated = false;
    let mut connections = Vec::with_capacity(parsed.len());
    for item in parsed {
        validate_input(&item.url, MAX_INPUT_LENGTH, "url")?;
        validate_input(&item.branch, 256, "branch")?;
        validate_input(&item.local_path, MAX_INPUT_LENGTH, "local_path")?;
        if let Some(pat) = item.pat.as_deref() {
            validate_input(pat, MAX_CREDENTIAL_LENGTH, "pat")?;
            if !pat.trim().is_empty() {
                save_pat_for_url(app, &item.url, pat)?;
            }
            migrated = true;
        }
        connections.push(SavedRepoConnection {
            url: item.url,
            branch: item.branch,
            local_path: item.local_path,
            last_synced: item.last_synced,
        });
    }

    if migrated {
        save_saved_connections_inner(app, &connections)?;
    }

    Ok(connections)
}

fn save_saved_connections_inner(
    app: &tauri::AppHandle,
    connections: &[SavedRepoConnection],
) -> Result<(), String> {
    let path = saved_connections_path(app)?;
    let bytes = serde_json::to_vec_pretty(connections)
        .map_err(|error| format!("Failed to serialize repo connections: {error}"))?;
    fs::write(&path, bytes).map_err(|error| format!("Failed to save {}: {error}", path.display()))
}

fn upsert_saved_connection(
    app: &tauri::AppHandle,
    connection: &SavedRepoConnection,
) -> Result<(), String> {
    let mut connections = load_saved_connections_inner(app)?;
    connections.retain(|existing| existing.local_path != connection.local_path && existing.url != connection.url);
    connections.push(connection.clone());
    connections.sort_by(|left, right| right.last_synced.cmp(&left.last_synced));
    save_saved_connections_inner(app, &connections)
}

fn build_callbacks(pat: Option<&str>) -> RemoteCallbacks<'static> {
    let token = pat.map(|value| value.to_string());
    let mut callbacks = RemoteCallbacks::new();
    callbacks.credentials(move |_url, username_from_url, _allowed| {
        if let Some(token) = token.as_deref() {
            let username = username_from_url.unwrap_or("git");
            return Cred::userpass_plaintext(username, token);
        }
        Cred::default()
    });
    callbacks
}

fn checkout_branch(repo: &Repository, branch: &str) -> Result<(), String> {
    let branch_ref = format!("refs/heads/{branch}");
    if repo.find_reference(&branch_ref).is_err() {
        let head_commit = repo
            .head()
            .and_then(|head| head.peel_to_commit())
            .map_err(|error| format!("Failed to prepare branch {branch}: {error}"))?;
        repo.branch(branch, &head_commit, false)
            .map_err(|error| format!("Failed to create branch {branch}: {error}"))?;
    }
    repo.set_head(&branch_ref)
        .map_err(|error| format!("Failed to set HEAD to {branch}: {error}"))?;
    repo.checkout_head(None)
        .map_err(|error| format!("Failed to checkout {branch}: {error}"))
}

fn fast_forward_to_remote(repo: &Repository, branch: &str) -> Result<(), String> {
    let remote_ref = format!("refs/remotes/origin/{branch}");
    let reference = repo
        .find_reference(&remote_ref)
        .map_err(|error| format!("Failed to find {remote_ref}: {error}"))?;
    let target = reference
        .target()
        .ok_or_else(|| format!("Remote ref {remote_ref} has no target"))?;
    let local_ref_name = format!("refs/heads/{branch}");

    if let Ok(mut local_ref) = repo.find_reference(&local_ref_name) {
        local_ref
            .set_target(target, "Fast-forward from origin")
            .map_err(|error| format!("Failed to update {local_ref_name}: {error}"))?;
    } else {
        let commit = repo
            .find_commit(target)
            .map_err(|error| format!("Failed to load commit {target}: {error}"))?;
        repo.branch(branch, &commit, true)
            .map_err(|error| format!("Failed to create local branch {branch}: {error}"))?;
    }

    repo.set_head(&local_ref_name)
        .map_err(|error| format!("Failed to move HEAD to {local_ref_name}: {error}"))?;
    repo.checkout_head(None)
        .map_err(|error| format!("Failed to checkout updated branch {branch}: {error}"))
}

fn fetch_branch(repo: &Repository, branch: &str, pat: Option<&str>) -> Result<(), String> {
    let mut remote = repo
        .find_remote("origin")
        .map_err(|error| format!("Failed to open origin remote: {error}"))?;
    let mut fetch_options = FetchOptions::new();
    fetch_options.remote_callbacks(build_callbacks(pat));
    remote
        .fetch(&[branch], Some(&mut fetch_options), None)
        .map_err(|error| format!("Failed to fetch {branch}: {error}"))
}

fn clone_or_open_repo(local_path: &Path, url: &str, branch: &str, pat: Option<&str>) -> Result<Repository, String> {
    if local_path.exists() {
        return Repository::open(local_path)
            .map_err(|error| format!("Failed to open repository {}: {error}", local_path.display()));
    }

    let mut fetch_options = FetchOptions::new();
    fetch_options.remote_callbacks(build_callbacks(pat));
    let mut builder = git2::build::RepoBuilder::new();
    builder.branch(branch);
    builder.fetch_options(fetch_options);
    builder
        .clone(url, local_path)
        .map_err(|error| format!("Failed to clone {url}: {error}"))
}

fn sync_repo(repo: &Repository, branch: &str, pat: Option<&str>) -> Result<(), String> {
    fetch_branch(repo, branch, pat)?;
    fast_forward_to_remote(repo, branch)
}

fn infer_spec_kind(path: &Path) -> String {
    let normalized = path.to_string_lossy().replace('\\', "/");
    if normalized.contains("/quiz/") {
        "quiz".to_string()
    } else {
        "tree".to_string()
    }
}

fn first_heading(content: &str) -> String {
    content
        .lines()
        .find_map(|line| line.strip_prefix("# "))
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "Untitled spec".to_string())
}

fn collect_specs(root: &Path, cursor: &Path, items: &mut Vec<RepoSpecEntry>) -> Result<(), String> {
    let entries = fs::read_dir(cursor)
        .map_err(|error| format!("Failed to read {}: {error}", cursor.display()))?;
    for entry in entries {
        let entry = entry.map_err(|error| format!("Failed to read directory entry: {error}"))?;
        let path = entry.path();
        if path.is_dir() {
            if path
                .file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| name == ".git" || name == "node_modules" || name == "dist")
            {
                continue;
            }
            collect_specs(root, &path, items)?;
            continue;
        }

        if path.file_name().and_then(|name| name.to_str()) != Some("spec.md") {
            continue;
        }

        let relative = path
            .strip_prefix(root)
            .map_err(|error| format!("Failed to build relative spec path: {error}"))?;
        let content = fs::read_to_string(&path)
            .map_err(|error| format!("Failed to read {}: {error}", path.display()))?;
        let metadata = fs::metadata(&path)
            .map_err(|error| format!("Failed to stat {}: {error}", path.display()))?;
        let modified_at = metadata
            .modified()
            .ok()
            .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|duration| duration.as_millis() as i64)
            .unwrap_or_default();
        items.push(RepoSpecEntry {
            path: relative.to_string_lossy().replace('\\', "/"),
            title: first_heading(&content),
            kind: infer_spec_kind(&path),
            modified_at,
            has_warnings: false,
        });
    }
    Ok(())
}

fn repo_signature(repo: &Repository) -> Result<Signature<'_>, String> {
    repo.signature()
        .or_else(|_| Signature::now("textforge", "textforge@local"))
        .map_err(|error| format!("Failed to create commit signature: {error}"))
}

fn remote_compare_url(remote_url: &str, base_branch: &str, branch: &str) -> Option<String> {
    if branch == base_branch {
        return None;
    }
    let normalized = remote_url.trim_end_matches(".git");
    if normalized.contains("github.com") {
        return Some(format!("{normalized}/compare/{base_branch}...{branch}?expand=1"));
    }
    if normalized.contains("dev.azure.com") || normalized.contains("visualstudio.com") {
        return Some(format!("{normalized}/pullrequestcreate?sourceRef={branch}&targetRef={base_branch}"));
    }
    None
}

#[tauri::command]
pub async fn connect_repo(
    app: tauri::AppHandle,
    url: String,
    branch: Option<String>,
    pat: Option<String>,
) -> Result<RepoConnection, String> {
    validate_input(&url, MAX_INPUT_LENGTH, "url")?;
    let branch = default_branch(branch);
    validate_input(&branch, 256, "branch")?;
    let pat = resolve_pat(&app, &url, pat)?;
    let local_path = repo_cache_root(&app)?.join(stable_repo_dir_name(&url));
    let repo = clone_or_open_repo(&local_path, &url, &branch, pat.as_deref())?;
    checkout_branch(&repo, &branch)?;
    sync_repo(&repo, &branch, pat.as_deref())?;

    let connection = RepoConnection {
        url: url.clone(),
        branch: branch.clone(),
        local_path: local_path.to_string_lossy().to_string(),
        current_branch: current_branch_name(&repo)?,
        last_synced: now_ts(),
    };
    upsert_saved_connection(
        &app,
        &SavedRepoConnection {
            url,
            branch,
            local_path: connection.local_path.clone(),
            last_synced: connection.last_synced,
        },
    )?;
    Ok(connection)
}

#[tauri::command]
pub async fn pull_latest(
    app: tauri::AppHandle,
    local_path: String,
    pat: Option<String>,
) -> Result<RepoConnection, String> {
    let validated_local_path = validate_file_path(&local_path)?;
    let repo = Repository::open(&validated_local_path)
        .map_err(|error| format!("Failed to open repository {local_path}: {error}"))?;
    let branch = current_branch_name(&repo)?;
    let remote = repo
        .find_remote("origin")
        .map_err(|error| format!("Failed to open origin remote: {error}"))?;
    let remote_url = remote.url().unwrap_or_default().to_string();
    let pat = resolve_pat(&app, &remote_url, pat)?;
    sync_repo(&repo, &branch, pat.as_deref())?;

    let connection = RepoConnection {
        url: remote_url,
        branch: branch.clone(),
        local_path: validated_local_path.to_string_lossy().to_string(),
        current_branch: branch.clone(),
        last_synced: now_ts(),
    };
    upsert_saved_connection(
        &app,
        &SavedRepoConnection {
            url: connection.url.clone(),
            branch,
            local_path,
            last_synced: connection.last_synced,
        },
    )?;
    Ok(connection)
}

#[tauri::command]
pub async fn list_repo_specs(local_path: String) -> Result<Vec<RepoSpecEntry>, String> {
    let root = validate_file_path(&local_path)?;
    let mut items = Vec::new();

    let tree_root = root.join("decision-trees");
    if tree_root.exists() {
        collect_specs(&root, &tree_root, &mut items)?;
    }

    let quiz_root = root.join("quiz");
    if quiz_root.exists() {
        collect_specs(&root, &quiz_root, &mut items)?;
    }

    items.sort_by(|left, right| left.title.to_lowercase().cmp(&right.title.to_lowercase()));
    Ok(items)
}

#[tauri::command]
pub async fn read_repo_spec(local_path: String, spec_path: String) -> Result<String, String> {
    let local_path = validate_file_path(&local_path)?;
    validate_repo_relative_path(&spec_path)?;
    let full_path = local_path.join(&spec_path);
    fs::read_to_string(&full_path)
        .map_err(|error| format!("Failed to read {}: {error}", full_path.display()))
}

#[tauri::command]
pub async fn commit_and_push(
    app: tauri::AppHandle,
    local_path: String,
    spec_path: String,
    content: String,
    message: String,
    branch: Option<String>,
    pat: Option<String>,
    create_pull_request: Option<bool>,
) -> Result<CommitResult, String> {
    let local_path = validate_file_path(&local_path)?;
    validate_repo_relative_path(&spec_path)?;
    validate_input(&content, MAX_INPUT_LENGTH * 10, "content")?;
    validate_input(&message, 512, "message")?;

    let full_path = local_path.join(&spec_path);
    if let Some(parent) = full_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create {}: {error}", parent.display()))?;
    }
    fs::write(&full_path, content)
        .map_err(|error| format!("Failed to write {}: {error}", full_path.display()))?;

    let repo = Repository::discover(&full_path)
        .map_err(|error| format!("Failed to locate repository for {}: {error}", full_path.display()))?;
    let target_branch = branch.unwrap_or_else(|| current_branch_name(&repo).unwrap_or_else(|_| "main".to_string()));
    validate_input(&target_branch, 256, "branch")?;
    checkout_branch(&repo, &target_branch)?;

    let relative = full_path
        .strip_prefix(&local_path)
        .map_err(|error| format!("Failed to compute repo-relative path: {error}"))?;

    let mut index = repo.index().map_err(|error| format!("Failed to open index: {error}"))?;
    index
        .add_all([relative], IndexAddOption::DEFAULT, None)
        .map_err(|error| format!("Failed to stage {}: {error}", relative.display()))?;
    index.write().map_err(|error| format!("Failed to write index: {error}"))?;

    let statuses = repo.statuses(None).map_err(|error| format!("Failed to inspect repo status: {error}"))?;
    if statuses.is_empty() {
        return Ok(CommitResult {
            branch: target_branch,
            commit_oid: String::new(),
            pushed: false,
            created_pull_request: false,
            pull_request_url: None,
            message: "No changes to commit.".to_string(),
        });
    }

    let tree_oid = index.write_tree().map_err(|error| format!("Failed to write tree: {error}"))?;
    let tree = repo.find_tree(tree_oid).map_err(|error| format!("Failed to load tree: {error}"))?;
    let signature = repo_signature(&repo)?;
    let parent_commit = repo
        .head()
        .ok()
        .and_then(|head| head.peel(ObjectType::Commit).ok())
        .and_then(|object| object.into_commit().ok());
    let oid = if let Some(parent) = parent_commit.as_ref() {
        repo.commit(Some("HEAD"), &signature, &signature, &message, &tree, &[parent])
            .map_err(|error| format!("Failed to create commit: {error}"))?
    } else {
        repo.commit(Some("HEAD"), &signature, &signature, &message, &tree, &[])
            .map_err(|error| format!("Failed to create initial commit: {error}"))?
    };

    let mut remote = repo
        .find_remote("origin")
        .map_err(|error| format!("Failed to open origin remote: {error}"))?;
    let remote_url = remote.url().unwrap_or_default().to_string();
    let pat = resolve_pat(&app, &remote_url, pat)?;
    let mut push_options = PushOptions::new();
    push_options.remote_callbacks(build_callbacks(pat.as_deref()));
    remote
        .push(&[format!("refs/heads/{0}:refs/heads/{0}", target_branch)], Some(&mut push_options))
        .map_err(|error| format!("Failed to push {target_branch}: {error}"))?;

    let pr_url = if create_pull_request.unwrap_or(false) {
        remote_compare_url(&remote_url, "main", &target_branch)
    } else {
        None
    };

    Ok(CommitResult {
        branch: target_branch,
        commit_oid: oid.to_string(),
        pushed: true,
        created_pull_request: pr_url.is_some(),
        pull_request_url: pr_url,
        message: "Changes committed and pushed.".to_string(),
    })
}

#[tauri::command]
pub async fn list_saved_connections(
    app: tauri::AppHandle,
) -> Result<Vec<SavedRepoConnection>, String> {
    load_saved_connections_inner(&app)
}

#[tauri::command]
pub async fn save_repo_connection(
    app: tauri::AppHandle,
    connection: SavedRepoConnection,
) -> Result<(), String> {
    validate_input(&connection.url, MAX_INPUT_LENGTH, "url")?;
    validate_input(&connection.branch, 256, "branch")?;
    validate_input(&connection.local_path, MAX_INPUT_LENGTH, "local_path")?;
    upsert_saved_connection(&app, &connection)
}