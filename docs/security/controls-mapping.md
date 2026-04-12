# textforge Editor - Security Controls Mapping

**Classification:** Internal  
**Owner:** Architecture  
**Last reviewed:** [DATE - update this when reviewed]  
**Version:** 1.0

This document maps attacker threats to implemented controls.
It is intended for review by the IF Insurance security department.

---

## Scope

This document covers the **textforge Editor** desktop application
(Tauri v2, Windows). It does not cover the textforge compiler CLI
(no credential handling) or compiled output HTML (static, no runtime).

---

## Asset Inventory

| Asset                                  | Sensitivity | Storage                                     |
| -------------------------------------- | ----------- | ------------------------------------------- |
| Azure OpenAI API key (OpenAI provider) | Secret      | Windows Credential Manager                  |
| Azure OpenAI endpoint URL              | Sensitive   | Windows Credential Manager                  |
| Azure OpenAI deployment name           | Sensitive   | Windows Credential Manager                  |
| Azure OpenAI resource ID               | Sensitive   | Windows Credential Manager                  |
| Git Personal Access Token              | Secret      | Windows Credential Manager                  |
| Confluence API token                   | Secret      | Windows Credential Manager                  |
| AAD access tokens (in-flight)          | Secret      | In-process memory only, zeroized on release |
| Spec files (decision tree content)     | Internal    | Local filesystem or Git repository          |
| Audit log                              | Internal    | `%APPDATA%\com.textforge.editor\audit.log`  |

**No secrets are written to disk in plaintext. No secrets appear
in application logs. No secrets are transmitted in URL parameters.**

---

## Trust Boundaries

```
+---------------------------------------------+
|  USER WORKSTATION                           |
|                                             |
|  +--------------------------------------+   |
|  |  textforge Editor (Tauri/WebView2)   |   |
|  |                                      |   |
|  |  React UI (WebView2)                 |   |
|  |    v Tauri IPC (validated, typed)    |   |
|  |  Rust backend (system process)       |   |
|  |    v keyring crate                   |   |
|  |  Windows Credential Manager (DPAPI)  |   |
|  +--------------------------------------+   |
|                                             |
|  Trust boundary: Tauri IPC layer            |
|  All values crossing this boundary are      |
|  length-validated and type-checked.         |
+----------------+----------------------------+
                 |
         +-------v----------+
         |  Azure OpenAI    |
         |  Azure DevOps    |  <- External services
         |  Confluence      |
         +------------------+
```

---

## Threat-to-Control Mapping

### T1 - Credential theft via plaintext storage on disk

**Threat:** Attacker reads credential files from the filesystem
(e.g., via another application, malware, or physical access).

| Control                                   | Implementation                                                                                                                 | Status              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| OS credential store                       | All secrets stored in Windows Credential Manager via `keyring` crate                                                           | ✅ Implemented      |
| DPAPI encryption                          | Windows Credential Manager uses DPAPI - credentials are encrypted with a key derived from the user's Windows login credentials | ✅ Platform control |
| Legacy file migration                     | `.api-key` plaintext file detected on load, migrated to keychain, then deleted                                                 | ✅ Implemented      |
| `ai-config.json` fields moved to keychain | `endpoint`, `deployment`, `resource_id` stored in keychain, not JSON                                                           | ✅ Implemented      |
| Audit log                                 | Credential read/write/clear events logged to `audit.log` without logging values                                                | ✅ Implemented      |

**Residual risk:** None. The OS credential store is the recommended
control for this threat on Windows.

### T1A - Authentication flow hardening and permission governance

**Threat:** Authentication relies on external tooling, unclassified credential
operations, or an audit trail that cannot be queried when incidents need review.

| Control | Implementation | Status |
| --- | --- | --- |
| RFC 8628 device code auth | AI authentication uses OAuth 2.0 Device Authorization Grant implemented via HTTPS calls to Azure AD endpoints. No external binaries are invoked for authentication. Refresh tokens are stored in the OS keyring. The app uses the publicly documented Azure CLI client ID by default; enterprise deployments can override this with a registered app client ID via `C:\ProgramData\textforge\enterprise-config.json`. | ✅ Implemented |
| Trust tier classification | All Tauri commands are classified Built-in, Supervised, Controlled, or Restricted in `.apm/instructions/04-trust-tiers.instructions.md`. Credential acquisition is Controlled and credential clearing is Restricted. | ✅ Implemented |
| Permission audit trail | `audit_log()` continues to write JSONL audit records and `query_audit_log` exposes filtered queries by category, action, and time range for diagnostics and review. | ✅ Implemented |

---

### T2 - Credential exposure via application logs

**Threat:** API keys or tokens appear in log files, stdout, or
error messages that could be captured by log collectors.

| Control                            | Implementation                                                                                         | Status         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------- |
| `redact_for_log()` utility         | All credential values passed through `redact_for_log()` before logging - shows only first/last 4 chars | ✅ Implemented |
| No credential logging in audit log | `audit_log()` records operation type and success/failure only - never the value                        | ✅ Implemented |
| `CREATE_NO_WINDOW` flag            | Subprocesses on Windows launched with `CREATE_NO_WINDOW` - no console window to capture                | ✅ Implemented |

---

### T3 - Credential theft via in-memory attacks

**Threat:** Attacker dumps process memory and extracts access
tokens or secrets cached in RAM.

| Control                                               | Implementation                                                                | Status         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- | -------------- |
| `zeroize` on `CachedToken::drop`                      | AAD access tokens are overwritten with zeros when the cached entry is dropped | ✅ Implemented |
| Token cache cleared with zeroing on `clear_ai_config` | All cached tokens zeroized and the cache cleared                              | ✅ Implemented |
| Short token cache TTL                                 | AAD tokens cached for 45 minutes maximum - aligned with Azure token lifetime  | ✅ Implemented |
| Secrets not held in React state longer than needed    | PAT field in commit modal cleared from state after commit invocation          | ✅ Implemented |

**Residual risk:** Low. Modern Windows does not page application
memory to disk without explicit OS-level page file encryption.
The main residual exposure is a core dump or crash dump containing
live process memory - this should be addressed at the endpoint
management level (disable WER crash dump uploads or encrypt dumps).

---

### T4 - Man-in-the-middle on outbound API traffic

**Threat:** Attacker intercepts AI provider or SCM traffic and
captures credentials or response data.

| Control                            | Implementation                                                                      | Status         |
| ---------------------------------- | ----------------------------------------------------------------------------------- | -------------- |
| HTTPS-only reqwest client          | `reqwest::Client` built with `https_only(true)`                                     | ✅ Implemented |
| TLS 1.2 minimum                    | `min_tls_version(TLS_1_2)`                                                          | ✅ Implemented |
| Endpoint validation before request | `validate_https_endpoint()` rejects non-HTTPS endpoints before any call             | ✅ Implemented |
| CSP `connect-src` restriction      | WebView2 can only initiate connections to the explicitly listed AI provider domains | ✅ Implemented |

---

### T5 - Privilege escalation via Tauri IPC abuse

**Threat:** Malicious code in the WebView2 UI layer calls
privileged Tauri backend commands with attacker-controlled input.

| Control                                 | Implementation                                                                                                            | Status         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Input length validation on all commands | `validate_input()` enforces `MAX_INPUT_LENGTH` (4096) and `MAX_CREDENTIAL_LENGTH` (8192) on every Tauri command parameter | ✅ Implemented |
| Path traversal validation               | `validate_file_path()` blocks `..` components and absolute paths from caller-supplied file paths                          | ✅ Implemented |
| Sidecar allowlist                       | `validate_sidecar_name()` permits only named sidecars - arbitrary binary execution blocked                                | ✅ Implemented |
| Minimal Tauri capabilities              | `capabilities/default.json` grants only the permissions required for operation                                            | ✅ Implemented |
| Local-only packaged UI                  | The production app loads bundled assets only; no remote domain IPC allowlist is configured in the current Tauri build     | ✅ Implemented |

---

### T6 - Content injection via malicious spec file

**Threat:** A malicious `spec.md` file causes the editor to
render attacker-controlled HTML or execute scripts.

| Control                                       | Implementation                                                                                            | Status         |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------- |
| Strict CSP                                    | `default-src: 'self'`, `script-src: 'self' 'wasm-unsafe-eval'`, `frame-src: 'none'`, `object-src: 'none'` | ✅ Implemented |
| `dangerousDisableAssetCspModification: false` | CSP cannot be modified by WebView content                                                                 | ✅ Implemented |
| `base-uri: 'self'`                            | Prevents base tag injection                                                                               | ✅ Implemented |
| `form-action: 'self'`                         | Prevents form exfiltration                                                                                | ✅ Implemented |
| `devtools: false` in production               | Inspector not accessible to non-developers                                                                | ✅ Implemented |

---

### T7 - Supply chain attack via compromised dependency

**Threat:** A transitive npm or Cargo dependency contains
malicious code or a known vulnerability.

| Control                              | Implementation                                                    | Status         |
| ------------------------------------ | ----------------------------------------------------------------- | -------------- |
| `npm audit --audit-level=high` in CI | Runs on every pipeline run for root and editor                    | ✅ Implemented |
| `cargo audit` in CI                  | Runs in dedicated security audit pipeline stage with Rust install | ✅ Implemented |
| `npm ci` (not `npm install`)         | Uses lockfile - no floating version resolution                    | ✅ Implemented |
| `cargo install --locked`             | CI installs cargo-audit with lockfile enforcement                 | ✅ Implemented |
| Lockfiles committed                  | `package-lock.json` and `Cargo.lock` committed to the repository  | ✅ Implemented |

---

### T8 - Installer tampering

**Threat:** The Windows installer (`.msi` or `.exe`) is modified
after build to include malicious code.

| Control                      | Implementation                                                           | Status                              |
| ---------------------------- | ------------------------------------------------------------------------ | ----------------------------------- |
| Code signing script          | `scripts/sign-release.ts` signs the installer with `signtool.exe`        | ✅ Implemented                      |
| Azure Artifacts distribution | Installers distributed via Azure Artifacts - not public CDN              | ✅ Implemented                      |
| Code signing in CI           | Pipeline step available, activated when `SIGNING_CERT_THUMBPRINT` is set | ⚠️ Pending certificate provisioning |

**Action required:** Provision an EV code signing certificate.
Until then, users will see a Windows SmartScreen warning on
first install. IT can suppress this via Group Policy for
known-good application hashes.

---

## Audit Log

The editor maintains a credential access audit log at:

```
%APPDATA%\com.textforge.editor\audit.log
```

Format: newline-delimited JSON. Each line:

```json
{ "ts": 1711540283, "op": "read", "kind": "api_key", "ok": true }
```

| Field  | Values                                                        |
| ------ | ------------------------------------------------------------- |
| `ts`   | Unix timestamp (seconds UTC)                                  |
| `op`   | `read`, `write`, or `clear`                                   |
| `kind` | `api_key`, `git_pat`, `ai_config`, `confluence`               |
| `ok`   | `true` (operation succeeded) or `false` (no credential found) |

The log rotates at 1 MB - the oldest half is discarded. Credential
values are never logged.

The `read_audit_log` Tauri command exposes the last 200 log lines
to the UI for administrative inspection.

---

## Windows Credential Manager and DPAPI

Windows Credential Manager stores credentials using the Windows
Data Protection API (DPAPI). DPAPI encrypts credentials using a
key derived from the currently logged-in user's Windows account
credentials (domain password or local account password combined
with a machine-specific key).

**Practical implications:**

- Credentials cannot be read by other Windows user accounts on the same machine.
- Credentials cannot be read by applications running as a different user.
- Credentials are inaccessible without the user's Windows login - they survive application uninstall and reinstall.
- Credentials do NOT survive a Windows reinstall unless the user profile is preserved.
- DPAPI is a Microsoft-audited, FIPS 140-2 compliant encryption mechanism.
- Reference: [Windows Data Protection](<https://learn.microsoft.com/en-us/previous-versions/ms995355(v=msdn.10)>)

---

## Outstanding Items

| Item                                                                   | Priority | Owner                             |
| ---------------------------------------------------------------------- | -------- | --------------------------------- |
| Provision EV code signing certificate                                  | High     | IT / Procurement                  |
| Enable code signing step in Azure DevOps pipeline                      | High     | Architecture (unblock after cert) |
| Endpoint DLP policy - ensure `audit.log` is excluded from DLP scanning | Low      | Security                          |
| Review crash dump policy on developer workstations                     | Low      | Endpoint Management               |
