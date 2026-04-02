use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use crate::security::{
    audit_log, redact_for_log, validate_input, MAX_CREDENTIAL_LENGTH, MAX_INPUT_LENGTH,
};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use std::process::Command;

#[cfg(not(target_os = "windows"))]
use azure_core::auth::TokenCredential;
#[cfg(not(target_os = "windows"))]
use azure_identity::DefaultAzureCredential;
use keyring::{Entry, Error as KeyringError};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::Manager;
use zeroize::Zeroize;

const OPENAI_SCOPE: &str = "https://cognitiveservices.azure.com/.default";
const ARM_SCOPE: &str = "https://management.azure.com/.default";
const AZURE_OPENAI_API_VERSION: &str = "2024-02-01";
const ARM_API_VERSION: &str = "2023-05-01";
const RESOURCE_GRAPH_API_VERSION: &str = "2021-03-01";
const TOKEN_CACHE_TTL: Duration = Duration::from_secs(45 * 60);
const KEYRING_SERVICE: &str = "textforge-editor";
const KEYRING_API_KEY: &str = "openai-api-key";
const KEYRING_AZURE_ENDPOINT: &str = "azure-endpoint";
const KEYRING_AZURE_DEPLOYMENT: &str = "azure-deployment";
const KEYRING_AZURE_RESOURCE_ID: &str = "azure-resource-id";
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

static TOKEN_CACHE: OnceLock<Mutex<HashMap<String, CachedToken>>> = OnceLock::new();

#[derive(Clone)]
struct CachedToken {
    secret: String,
    expires_at: Instant,
}

impl Drop for CachedToken {
    fn drop(&mut self) {
        self.secret.zeroize();
    }
}

#[cfg(target_os = "windows")]
#[derive(Debug, Deserialize)]
struct AzCliTokenResponse {
    #[serde(alias = "accessToken")]
    access_token: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiscoveredEndpoint {
    pub name: String,
    pub endpoint: String,
    pub location: String,
    pub resource_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscoveryResult {
    pub endpoints: Vec<DiscoveredEndpoint>,
    pub auto_selected: Option<DiscoveredEndpoint>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeploymentInfo {
    pub name: String,
    pub model: String,
}

fn normalize_endpoint(endpoint: &str) -> String {
    endpoint.trim().trim_end_matches('/').to_string()
}

fn validate_https_endpoint(endpoint: &str, field_name: &str) -> Result<String, String> {
    validate_input(endpoint, MAX_INPUT_LENGTH, field_name)?;
    let normalized = normalize_endpoint(endpoint);
    if !normalized.is_empty() && !normalized.starts_with("https://") {
        return Err(format!("{} must use HTTPS", field_name));
    }
    Ok(normalized)
}

fn build_secure_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .https_only(true)
        .min_tls_version(reqwest::tls::Version::TLS_1_2)
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|error| format!("Failed to build HTTP client: {error}"))
}

fn is_openai_public_endpoint(endpoint: &str) -> bool {
    let endpoint = endpoint.to_ascii_lowercase();
    endpoint.contains("api.openai.com") || endpoint.ends_with("openai.com")
}

fn config_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Failed to resolve app config dir: {error}"))?;
    fs::create_dir_all(&path)
        .map_err(|error| format!("Failed to create app config dir {}: {error}", path.display()))?;
    Ok(path)
}

fn config_path(app: &tauri::AppHandle, file_name: &str) -> Result<PathBuf, String> {
    Ok(config_dir(app)?.join(file_name))
}

fn delete_if_exists(path: &PathBuf) -> Result<(), String> {
    if path.exists() {
        fs::remove_file(path)
            .map_err(|error| format!("Failed to delete {}: {error}", path.display()))?;
    }
    Ok(())
}

fn api_key_entry() -> Result<Entry, String> {
    Entry::new(KEYRING_SERVICE, KEYRING_API_KEY)
        .map_err(|error| format!("Failed to access keychain: {error}"))
}

fn token_cache() -> &'static Mutex<HashMap<String, CachedToken>> {
    TOKEN_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn get_cached_token(scope: &str) -> Option<String> {
    let cache = token_cache().lock().ok()?;
    let entry = cache.get(scope)?;
    if entry.expires_at <= Instant::now() {
        return None;
    }
    Some(entry.secret.clone())
}

fn cache_token(scope: &str, secret: String) {
    if let Ok(mut cache) = token_cache().lock() {
        cache.insert(
            scope.to_string(),
            CachedToken {
                secret,
                expires_at: Instant::now() + TOKEN_CACHE_TTL,
            },
        );
    }
}

#[cfg(target_os = "windows")]
fn get_aad_token_via_az_cli(scope: &str) -> Result<String, String> {
    let output = Command::new("az")
        .args(["account", "get-access-token", "--scope", scope, "--output", "json"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|error| format!("Failed to invoke Azure CLI: {error}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let message = if !stderr.is_empty() { stderr } else { stdout };
        if message.is_empty() {
            return Err("Azure CLI authentication failed. Run 'az login'.".to_string());
        }
        return Err(message);
    }

    let parsed: AzCliTokenResponse = serde_json::from_slice(&output.stdout)
        .map_err(|error| format!("Azure CLI returned invalid token JSON: {error}"))?;

    if parsed.access_token.trim().is_empty() {
        return Err("Azure CLI returned an empty access token. Run 'az login'.".to_string());
    }

    Ok(parsed.access_token)
}

async fn get_aad_token(scope: &str) -> Result<String, String> {
    if let Some(cached) = get_cached_token(scope) {
        return Ok(cached);
    }

    #[cfg(target_os = "windows")]
    {
        let token = get_aad_token_via_az_cli(scope)?;
        cache_token(scope, token.clone());
        return Ok(token);
    }

    #[cfg(not(target_os = "windows"))]
    let credential = DefaultAzureCredential::create(Default::default())
        .map_err(|error| format!("Failed to create Azure credential: {error}"))?;
    #[cfg(not(target_os = "windows"))]
    let scopes = [scope];
    #[cfg(not(target_os = "windows"))]
    let token = credential
        .get_token(&scopes)
        .await
        .map_err(|error| format!("Failed to acquire Azure token: {error}"))?;
    #[cfg(not(target_os = "windows"))]
    let secret = token.token.secret().to_string();
    #[cfg(not(target_os = "windows"))]
    cache_token(scope, secret.clone());

    #[cfg(not(target_os = "windows"))]
    Ok(secret)
}

fn build_chat_url(endpoint: &str, deployment: &str) -> String {
    format!(
        "{}/openai/deployments/{}/chat/completions?api-version={}",
        normalize_endpoint(endpoint),
        deployment,
        AZURE_OPENAI_API_VERSION
    )
}

fn extract_message_content(value: &Value) -> Option<String> {
    let content = value
        .get("choices")?
        .as_array()?
        .first()?
        .get("message")?
        .get("content")?;

    if let Some(text) = content.as_str() {
        return Some(text.to_string());
    }

    let text = content
        .as_array()
        .map(|parts| {
            parts
                .iter()
                .filter_map(|part| part.get("text").and_then(Value::as_str))
                .collect::<Vec<_>>()
                .join("\n")
        })
        .unwrap_or_default();

    if text.is_empty() {
        None
    } else {
        Some(text)
    }
}

async fn handle_chat_response(response: reqwest::Response, aad_mode: bool) -> Result<String, String> {
    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("Failed to read AI response body: {error}"))?;

    if status == StatusCode::UNAUTHORIZED {
        if aad_mode {
            return Err("AAD token expired. Run 'az login'.".to_string());
        }
        return Err("Authentication failed. Check your API key and endpoint.".to_string());
    }

    if status == StatusCode::FORBIDDEN {
        return Err("Access denied. Contact your Azure administrator.".to_string());
    }

    if !status.is_success() {
        return Err(format!("AI request failed with {}: {}", status, body));
    }

    let parsed: Value = serde_json::from_str(&body)
        .map_err(|error| format!("AI response was not valid JSON: {error}"))?;
    extract_message_content(&parsed)
        .ok_or_else(|| format!("AI response did not include message content: {body}"))
}

fn build_chat_body(system_prompt: &str, user_message: &str, deployment: &str, max_tokens: Option<u32>) -> Value {
    let mut payload = json!({
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": user_message }
        ],
        "temperature": 0.2
    });

    if let Some(tokens) = max_tokens {
        payload["max_tokens"] = json!(tokens);
    }

    if !deployment.is_empty() {
        payload["model"] = json!(deployment);
    }

    payload
}

#[tauri::command]
pub async fn call_azure_openai(
    endpoint: String,
    deployment: String,
    system_prompt: String,
    user_message: String,
    max_tokens: Option<u32>,
) -> Result<String, String> {
    let endpoint = validate_https_endpoint(&endpoint, "endpoint")?;
    validate_input(&deployment, 256, "deployment")?;
    validate_input(&system_prompt, MAX_INPUT_LENGTH, "system_prompt")?;
    validate_input(&user_message, MAX_INPUT_LENGTH, "user_message")?;

    let token = get_aad_token(OPENAI_SCOPE).await?;
    let client = build_secure_client()?;
    let safe_max_tokens = max_tokens.map(|tokens| tokens.min(4096));
    let response = client
        .post(build_chat_url(&endpoint, &deployment))
        .bearer_auth(token)
        .json(&build_chat_body(&system_prompt, &user_message, "", safe_max_tokens))
        .send()
        .await
        .map_err(|error| format!("Failed to call Azure OpenAI: {error}"))?;

    handle_chat_response(response, true).await
}

#[tauri::command]
pub async fn call_openai_with_key(
    endpoint: String,
    deployment: String,
    system_prompt: String,
    user_message: String,
    api_key: String,
    max_tokens: Option<u32>,
) -> Result<String, String> {
    let endpoint = validate_https_endpoint(&endpoint, "endpoint")?;
    validate_input(&deployment, 256, "deployment")?;
    validate_input(&system_prompt, MAX_INPUT_LENGTH, "system_prompt")?;
    validate_input(&user_message, MAX_INPUT_LENGTH, "user_message")?;
    validate_input(&api_key, MAX_CREDENTIAL_LENGTH, "api_key")?;

    let is_public = is_openai_public_endpoint(&endpoint);
    let url = if is_public {
        format!("{endpoint}/v1/chat/completions")
    } else {
        build_chat_url(&endpoint, &deployment)
    };
    let safe_max_tokens = max_tokens.map(|tokens| tokens.min(4096));
    let body = build_chat_body(&system_prompt, &user_message, &deployment, safe_max_tokens);
    let client = build_secure_client()?;
    let mut request = client.post(url).bearer_auth(&api_key).json(&body);

    if !is_public {
        request = request.header("api-key", &api_key);
    }

    let response = request
        .send()
        .await
        .map_err(|error| format!(
            "Failed to call OpenAI endpoint with key {}: {error}",
            redact_for_log(&api_key)
        ))?;

    handle_chat_response(response, false).await
}

#[tauri::command]
pub async fn check_ai_auth() -> Result<bool, String> {
    match get_aad_token(OPENAI_SCOPE).await {
        Ok(_) => Ok(true),
        Err(message) => {
            let lowered = message.to_ascii_lowercase();
            if lowered.contains("azure cli")
                || lowered.contains("not logged in")
                || lowered.contains("az login")
                || lowered.contains("credential unavailable")
                || lowered.contains("please run 'az login'")
            {
                Ok(false)
            } else {
                Err(message)
            }
        }
    }
}

#[tauri::command]
pub async fn discover_openai_endpoints() -> Result<DiscoveryResult, String> {
    let token = get_aad_token(ARM_SCOPE).await?;
    let query = r#"
resources
| where type =~ 'microsoft.cognitiveservices/accounts'
| where kind =~ 'OpenAI'
| project name, location, endpoint = tostring(properties.endpoint), resource_id = id
"#;

    let response = build_secure_client()?
        .post(format!(
            "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version={RESOURCE_GRAPH_API_VERSION}"
        ))
        .bearer_auth(token)
        .json(&json!({
            "query": query,
            "options": { "resultFormat": "objectArray" }
        }))
        .send()
        .await
        .map_err(|error| format!("Failed to query Azure Resource Graph: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("Failed to read discovery response: {error}"))?;

    if status == StatusCode::UNAUTHORIZED {
        return Err("AAD token expired. Run 'az login'.".to_string());
    }
    if status == StatusCode::FORBIDDEN {
        return Err("Access denied. Contact your Azure administrator.".to_string());
    }
    if !status.is_success() {
        return Err(format!("Endpoint discovery failed with {}: {}", status, body));
    }

    let parsed: Value = serde_json::from_str(&body)
        .map_err(|error| format!("Endpoint discovery returned invalid JSON: {error}"))?;
    let endpoints = parsed
        .get("data")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|item| {
            Some(DiscoveredEndpoint {
                name: item.get("name")?.as_str()?.to_string(),
                endpoint: normalize_endpoint(item.get("endpoint")?.as_str()?),
                location: item
                    .get("location")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string(),
                resource_id: item.get("resource_id")?.as_str()?.to_string(),
            })
        })
        .collect::<Vec<_>>();

    let auto_selected = if endpoints.len() == 1 {
        endpoints.first().cloned()
    } else {
        None
    };

    Ok(DiscoveryResult {
        endpoints,
        auto_selected,
    })
}

#[tauri::command]
pub async fn discover_deployments(resource_id: String) -> Result<Vec<DeploymentInfo>, String> {
    validate_input(&resource_id, MAX_INPUT_LENGTH, "resource_id")?;
    let token = get_aad_token(ARM_SCOPE).await?;
    let response = build_secure_client()?
        .get(format!(
            "https://management.azure.com{}/deployments?api-version={ARM_API_VERSION}",
            resource_id
        ))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|error| format!("Failed to query Azure deployments: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("Failed to read deployment response: {error}"))?;

    if status == StatusCode::UNAUTHORIZED {
        return Err("AAD token expired. Run 'az login'.".to_string());
    }
    if status == StatusCode::FORBIDDEN {
        return Err("Access denied. Contact your Azure administrator.".to_string());
    }
    if !status.is_success() {
        return Err(format!("Deployment discovery failed with {}: {}", status, body));
    }

    let parsed: Value = serde_json::from_str(&body)
        .map_err(|error| format!("Deployment discovery returned invalid JSON: {error}"))?;
    let deployments = parsed
        .get("value")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .map(|item| {
            let name = item
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let model = item
                .get("properties")
                .and_then(|props| props.get("model"))
                .and_then(|model| {
                    model
                        .get("name")
                        .and_then(Value::as_str)
                        .or_else(|| model.as_str())
                })
                .unwrap_or("unknown")
                .to_string();
            DeploymentInfo { name, model }
        })
        .filter(|deployment| !deployment.name.is_empty())
        .collect();

    Ok(deployments)
}

#[tauri::command]
pub async fn save_ai_config(
    app: tauri::AppHandle,
    endpoint: String,
    deployment: String,
    resource_id: String,
) -> Result<(), String> {
    let endpoint = validate_https_endpoint(&endpoint, "endpoint")?;
    validate_input(&deployment, 256, "deployment")?;
    validate_input(&resource_id, MAX_INPUT_LENGTH, "resource_id")?;

    let save = |account: &str, value: &str| -> Result<(), String> {
        Entry::new(KEYRING_SERVICE, account)
            .map_err(|error| format!("Failed to access keychain for {account}: {error}"))?
            .set_password(value)
            .map_err(|error| format!("Failed to save {account} to keychain: {error}"))
    };

    save(KEYRING_AZURE_ENDPOINT, &endpoint)?;
    save(KEYRING_AZURE_DEPLOYMENT, &deployment)?;
    save(KEYRING_AZURE_RESOURCE_ID, &resource_id)?;

    let legacy = config_path(&app, "ai-config.json")?;
    if legacy.exists() {
        let _ = fs::remove_file(&legacy);
    }

    audit_log(&app, "write", "ai_config", true);
    Ok(())
}

#[tauri::command]
pub async fn load_ai_config(app: tauri::AppHandle) -> Result<Option<Value>, String> {
    let read = |account: &str| -> Option<String> {
        Entry::new(KEYRING_SERVICE, account)
            .ok()?
            .get_password()
            .ok()
            .filter(|value| !value.trim().is_empty())
    };

    let endpoint = read(KEYRING_AZURE_ENDPOINT);
    let deployment = read(KEYRING_AZURE_DEPLOYMENT);
    let resource_id = read(KEYRING_AZURE_RESOURCE_ID);

    if endpoint.is_none() && deployment.is_none() && resource_id.is_none() {
        let legacy = config_path(&app, "ai-config.json")?;
        if legacy.exists() {
            let content = fs::read_to_string(&legacy)
                .map_err(|error| format!("Failed to read legacy ai-config.json: {error}"))?;
            if let Ok(parsed) = serde_json::from_str::<Value>(&content) {
                let endpoint = parsed
                    .get("endpoint")
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .to_string();
                let deployment = parsed
                    .get("deployment")
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .to_string();
                let resource_id = parsed
                    .get("resource_id")
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .to_string();
                if !endpoint.is_empty() || !deployment.is_empty() || !resource_id.is_empty() {
                    let _ = save_ai_config(
                        app.clone(),
                        endpoint.clone(),
                        deployment.clone(),
                        resource_id.clone(),
                    )
                    .await;
                    audit_log(&app, "read", "ai_config", true);
                    return Ok(Some(json!({
                        "endpoint": endpoint,
                        "deployment": deployment,
                        "resource_id": resource_id,
                    })));
                }
            }
            let _ = fs::remove_file(&legacy);
        }

        audit_log(&app, "read", "ai_config", false);
        return Ok(None);
    }

    audit_log(&app, "read", "ai_config", true);
    Ok(Some(json!({
        "endpoint": endpoint.unwrap_or_default(),
        "deployment": deployment.unwrap_or_default(),
        "resource_id": resource_id.unwrap_or_default(),
    })))
}

#[tauri::command]
pub async fn clear_ai_config(app: tauri::AppHandle) -> Result<(), String> {
    if let Ok(mut cache) = token_cache().lock() {
        for token in cache.values_mut() {
            token.secret.zeroize();
        }
        cache.clear();
    }

    for account in &[
        KEYRING_AZURE_ENDPOINT,
        KEYRING_AZURE_DEPLOYMENT,
        KEYRING_AZURE_RESOURCE_ID,
    ] {
        match Entry::new(KEYRING_SERVICE, account)
            .map_err(|error| format!("Failed to access keychain for {account}: {error}"))?
            .delete_password()
        {
            Ok(()) | Err(KeyringError::NoEntry) => {}
            Err(error) => {
                return Err(format!("Failed to clear {account} from keychain: {error}"));
            }
        }
    }

    let legacy = config_path(&app, "ai-config.json")?;
    delete_if_exists(&legacy)?;
    audit_log(&app, "clear", "ai_config", true);
    Ok(())
}

#[tauri::command]
pub async fn save_api_key(app: tauri::AppHandle, key: String) -> Result<(), String> {
    validate_input(&key, MAX_CREDENTIAL_LENGTH, "key")?;

    let legacy_path = config_path(&app, ".api-key")?;
    if legacy_path.exists() {
        let _ = fs::remove_file(&legacy_path);
    }

    let entry = api_key_entry()?;
    let trimmed = key.trim();
    if trimmed.is_empty() {
        match entry.delete_password() {
            Ok(()) | Err(KeyringError::NoEntry) => {
                audit_log(&app, "clear", "api_key", true);
                Ok(())
            }
            Err(error) => Err(format!("Failed to clear API key from keychain: {error}")),
        }
    } else {
        entry
            .set_password(trimmed)
            .map_err(|error| format!("Failed to save API key to keychain: {error}"))?;
        audit_log(&app, "write", "api_key", true);
        Ok(())
    }
}

#[tauri::command]
pub async fn load_api_key(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let legacy_path = config_path(&app, ".api-key")?;
    if legacy_path.exists() {
        let key = fs::read_to_string(&legacy_path)
            .map_err(|error| format!("Failed to read legacy key file: {error}"))?;
        let trimmed = key.trim().to_string();
        if trimmed.is_empty() {
            let _ = fs::remove_file(&legacy_path);
        } else {
            let entry = api_key_entry()?;
            entry
                .set_password(&trimmed)
                .map_err(|error| format!("Failed to save API key to keychain: {error}"))?;
            let _ = fs::remove_file(&legacy_path);
            audit_log(&app, "read", "api_key", true);
            return Ok(Some(trimmed));
        }
    }

    let entry = api_key_entry()?;
    match entry.get_password() {
        Ok(key) => {
            let trimmed = key.trim().to_string();
            if trimmed.is_empty() {
                audit_log(&app, "read", "api_key", false);
                Ok(None)
            } else {
                audit_log(&app, "read", "api_key", true);
                Ok(Some(trimmed))
            }
        }
        Err(KeyringError::NoEntry) => {
            audit_log(&app, "read", "api_key", false);
            Ok(None)
        }
        Err(error) => Err(format!("Failed to read API key from keychain: {error}")),
    }
}

#[tauri::command]
pub async fn clear_api_key(app: tauri::AppHandle) -> Result<(), String> {
    let legacy_path = config_path(&app, ".api-key")?;
    if legacy_path.exists() {
        let _ = fs::remove_file(&legacy_path);
    }

    let entry = api_key_entry()?;
    match entry.delete_password() {
        Ok(()) | Err(KeyringError::NoEntry) => {
            audit_log(&app, "clear", "api_key", true);
            Ok(())
        }
        Err(error) => Err(format!("Failed to clear API key from keychain: {error}")),
    }
}