# Trust Tier Classification

Engineering Discipline 1.2: Permission System and Trust Tiers.
Every shipped editor command is classified so credential-sensitive actions stay explicit.

## Trust Tier Definitions

| Tier | Description | Gate |
| --- | --- | --- |
| Built-in | Safe by design and read-only | None |
| Supervised | Reversible local action or low-risk outbound call | Logged |
| Controlled | Credential acquisition or other user-approved action | Explicit user action |
| Restricted | Irreversible credential storage or clearing | Explicit per-session grant |

## Tauri Commands

### Built-in

| Command | Responsibility |
| --- | --- |
| `load_enterprise_config` | Read enterprise policy |
| `get_ai_auth_status` | Report current auth state |
| `load_ai_provider_pref` | Read AI provider preference |
| `query_audit_log` | Read the audit trail |

### Supervised

| Command | Responsibility |
| --- | --- |
| `try_silent_azure_auth` | Refresh an existing token without prompting |
| `test_ai_connection` | Call the configured AI endpoint for verification |
| `save_ai_provider_pref` | Update provider preference |

### Controlled

| Command | Responsibility |
| --- | --- |
| `start_device_code_auth` | Initiate Microsoft device-code sign-in |
| `poll_device_code_auth` | Complete Microsoft device-code sign-in |

### Restricted

| Command | Responsibility |
| --- | --- |
| `save_api_key` | Store an API key in the OS keyring |
| `clear_api_key` | Remove an API key from the OS keyring |
| `clear_azure_auth` | Clear Azure auth state from the OS keyring |

## Notes

- The public repository documents the enforced permission model here instead of linking to the internal `.apm` instruction sources.
- Audit log queries stay read-only.
- Credential acquisition remains Controlled, and credential clearing remains Restricted.