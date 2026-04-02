mod commands;
pub mod security;

use commands::ai::{
    call_azure_openai, call_openai_with_key, check_ai_auth, clear_ai_config, clear_api_key,
    discover_deployments, discover_openai_endpoints, load_ai_config, load_api_key,
    save_ai_config, save_api_key,
};
use commands::fs::{
    file_exists, is_onboarding_complete, load_editor_prefs, load_recent_files, mark_onboarding_complete,
    read_audit_log, read_file, remove_recent_file, save_editor_prefs, update_recent_file,
    update_window_title, write_file,
};
use commands::git::{
    commit_and_push, connect_repo, list_repo_specs, list_saved_connections, pull_latest,
    read_repo_spec, save_repo_connection,
};
use commands::sidecar::run_sidecar;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            call_azure_openai,
            call_openai_with_key,
            check_ai_auth,
            discover_openai_endpoints,
            discover_deployments,
            save_ai_config,
            load_ai_config,
            clear_ai_config,
            save_api_key,
            load_api_key,
            clear_api_key,
            read_file,
            write_file,
            file_exists,
            load_recent_files,
            update_recent_file,
            remove_recent_file,
            update_window_title,
            load_editor_prefs,
            save_editor_prefs,
            is_onboarding_complete,
            mark_onboarding_complete,
            read_audit_log,
            connect_repo,
            pull_latest,
            list_repo_specs,
            read_repo_spec,
            commit_and_push,
            list_saved_connections,
            save_repo_connection,
            run_sidecar,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
