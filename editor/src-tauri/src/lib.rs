mod commands;
pub mod security;

use commands::ai::{
    call_azure_openai, call_openai_with_key, check_ai_auth, clear_ai_config, clear_api_key,
    clear_azure_auth, discover_deployments, discover_openai_endpoints, get_ai_auth_status,
    load_ai_config, load_ai_provider_pref, load_api_key, load_enterprise_config,
    poll_device_code_auth, save_ai_config, save_ai_provider_pref, save_api_key,
    start_device_code_auth, test_ai_connection, try_silent_azure_auth,
};
use commands::fs::{
    file_exists, get_compiled_output_root, is_onboarding_complete, load_editor_prefs,
    load_recent_files, mark_onboarding_complete, open_path_in_file_manager, read_audit_log,
    read_file, remove_recent_file, save_editor_prefs, update_recent_file,
    update_window_title, write_file,
};
use commands::git::{
    commit_and_push, connect_repo, list_repo_specs, list_saved_connections, pull_latest,
    read_repo_spec, save_repo_connection,
};
use commands::sidecar::{run_sidecar, set_repo_root};
use security::query_audit_log;

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
            start_device_code_auth,
            poll_device_code_auth,
            try_silent_azure_auth,
            get_ai_auth_status,
            test_ai_connection,
            save_ai_provider_pref,
            load_ai_provider_pref,
            load_enterprise_config,
            clear_azure_auth,
            read_file,
            write_file,
            file_exists,
            load_recent_files,
            get_compiled_output_root,
            open_path_in_file_manager,
            update_recent_file,
            remove_recent_file,
            update_window_title,
            load_editor_prefs,
            save_editor_prefs,
            is_onboarding_complete,
            mark_onboarding_complete,
            read_audit_log,
            query_audit_log,
            connect_repo,
            pull_latest,
            list_repo_specs,
            read_repo_spec,
            commit_and_push,
            list_saved_connections,
            save_repo_connection,
            run_sidecar,
            set_repo_root,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
