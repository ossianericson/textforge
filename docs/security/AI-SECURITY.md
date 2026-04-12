# AI Security Architecture

## Authentication flow

textforge uses OAuth 2.0 Device Authorization Grant (RFC 8628) for Azure authentication. This is the same protocol used by Azure CLI, VS Code, and Azure DevOps.

No external binaries are invoked for authentication. The device code flow is implemented entirely via HTTPS calls to Azure AD endpoints using the application's embedded HTTP client. This removes the supply-chain dependency on an external auth helper.

### First sign-in

1. User clicks Sign in with Microsoft in Settings > AI.
2. The app calls `https://login.microsoftonline.com/.../devicecode` via HTTPS.
3. A short code is displayed to the user.
4. The user opens `https://microsoft.com/devicelogin` in any browser and enters the code.
5. Azure AD validates identity, including MFA if required by policy.
6. The app receives an access token and refresh token.
7. The refresh token is stored in Windows Credential Manager through the OS keyring.

### Subsequent sessions

The refresh token is used to silently acquire a new access token on startup. The user does not need to sign in again until the refresh token expires or IT revokes it.

### Enterprise configuration

IT administrators can deploy `C:\ProgramData\textforge\enterprise-config.json` to control:

- Which AI providers are available
- The Azure AD tenant ID and client ID
- The Azure OpenAI endpoint and deployment
- Whether public OpenAI and custom endpoints are available

## Trust tier classification

Engineering Discipline 1.2: every credential-related Tauri command is classified.

| Command | Tier | Why |
| --- | --- | --- |
| `load_enterprise_config` | Built-in | Read-only |
| `get_ai_auth_status` | Built-in | Read-only |
| `load_ai_provider_pref` | Built-in | Read-only |
| `query_audit_log` | Built-in | Read-only |
| `try_silent_azure_auth` | Supervised | Silent token refresh |
| `test_ai_connection` | Supervised | Real API call, logged |
| `save_ai_provider_pref` | Supervised | Config write, not a credential |
| `start_device_code_auth` | Controlled | Initiates credential acquisition |
| `poll_device_code_auth` | Controlled | Completes credential acquisition |
| `clear_azure_auth` | Restricted | Irreversible credential clearing |
| `save_api_key` | Restricted | Stores credential in keyring |
| `clear_api_key` | Restricted | Removes credential from keyring |

## Permission audit trail

Engineering Discipline 3.3: permission state is queryable.

Every credential operation produces an audit log entry via `audit_log()` in `security.rs`. The log is stored at `%APPDATA%\com.textforge.editor\audit.log` as JSONL.

The `query_audit_log` command exposes the log to the editor for diagnostics:

```typescript
const failedAuths = await invoke<unknown[]>('query_audit_log', {
  category: 'auth',
  since_iso: '2026-01-01T00:00:00Z',
});
```

Audit entries include timestamp, operation type, resource classification, and success or failure. Audit entries do not include token values or API keys.

## Credential storage

| Credential | Storage |
| --- | --- |
| Azure refresh token | Windows Credential Manager (keyring) |
| Azure access token | In-memory only, cleared on exit, zeroized on drop |
| OpenAI API key | Windows Credential Manager (keyring) |
| Azure endpoint and deployment | Windows Credential Manager (keyring) |
| Provider preference | App config directory |

No credentials are stored in files, the registry, or environment variables by this application.

## Data handling

AI actions send the text content of the `spec.md` file being edited to the configured endpoint:

- Only on explicit user action
- Never passively or in the background
- Never including compiled HTML, credentials, file paths, or system information

Azure OpenAI data is governed by the Microsoft agreement for the tenant. Public OpenAI and custom endpoints should be disabled in enterprise configuration when policy prohibits external AI services.

## Network security

- All connections use HTTPS with TLS 1.2 minimum and certificate validation enforced
- No self-signed certificates are accepted without explicit configuration
- Connections time out after 30 seconds
- Authentication endpoints are limited to `login.microsoftonline.com`

## Audit log

Every credential operation and AI authentication event is recorded in `%APPDATA%\com.textforge.editor\audit.log`.

Log entries include timestamp, operation type, resource, and success or failure. Log entries do not include token values, API keys, or spec content.

## AppStore deployment checklist

- [ ] EV code signing certificate obtained and configured
- [ ] Enterprise config deployed at `C:\ProgramData\textforge\enterprise-config.json`
- [ ] Allowed providers set appropriately
- [ ] Azure endpoint and deployment locked if required
- [ ] Snyk SAST token configured in CI pipeline variables
- [ ] Azure AD app registered if using a custom client ID
- [ ] Trust tier classification reviewed in `.apm/instructions/04-trust-tiers.instructions.md`