# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |
| Older   | ❌        |

---

## Credential Storage

textforge Editor stores all credentials in the OS credential store:

- **Windows:** Windows Credential Manager (DPAPI-encrypted)
- **macOS:** Keychain
- **Linux:** Secret Service API (libsecret)

**No credentials are written to disk in plaintext.**
**No credentials appear in application logs.**
**Outbound AI connections enforce HTTPS with TLS 1.3 minimum via rustls.**

### Rust memory safety and Tauri allowlist model

The editor backend is implemented in Rust, which provides compile-time
memory safety guarantees that eliminate broad classes of memory
corruption issues common in unmanaged languages.

The Tauri bridge follows an explicit allowlist model: only commands
registered in the backend are callable from the frontend. There is no
implicit command exposure.

### Windows Credential Manager and DPAPI

Windows Credential Manager uses the Windows Data Protection API
(DPAPI) to encrypt credentials. DPAPI derives the encryption key
from the logged-in user's Windows account credentials combined with
a machine-specific key. Credentials encrypted with DPAPI:

- Cannot be read by other Windows user accounts on the same machine
- Cannot be read by applications running as a different user
- Are inaccessible without the user's Windows login
- Survive application reinstall (credentials persist in the user profile)
- Are encrypted using a Microsoft-audited, FIPS 140-2 compliant mechanism

Reference: [Windows Data Protection API](<https://learn.microsoft.com/en-us/previous-versions/ms995355(v=msdn.10)>)

### Credentials stored

| Credential               | Keychain account                        |
| ------------------------ | --------------------------------------- |
| OpenAI API key           | `textforge-editor / openai-api-key`     |
| Azure OpenAI endpoint    | `textforge-editor / azure-endpoint`     |
| Azure OpenAI deployment  | `textforge-editor / azure-deployment`   |
| Azure OpenAI resource ID | `textforge-editor / azure-resource-id`  |
| Git PAT (per-repository) | `textforge-editor / git-pat:{repo_url}` |
| Confluence API token     | `textforge-editor / confluence-token`   |

---

## Credential Access Audit Log

The editor maintains an append-only credential access audit log at:

```
Windows: %APPDATA%\com.textforge.editor\audit.log
macOS:   ~/Library/Application Support/com.textforge.editor/audit.log
```

Each log entry is a JSON line:

```json
{ "ts": 1711540283, "op": "read", "kind": "api_key", "ok": true }
```

Credential values are **never** logged. The log rotates at 1 MB.

---

## Code Signing

The Windows installer is signed with `signtool.exe` using SHA-256
digest and a DigiCert timestamp server.

**Current status:** Code signing script (`scripts/sign-release.ts`)
is implemented. CI step is configured and awaits certificate
provisioning. Until an EV certificate is provisioned, users see
a Windows SmartScreen warning on first install.

To sign locally:

```powershell
$env:SIGNING_CERT_THUMBPRINT="<thumbprint>"
npm run editor:release:win
npm run editor:release:sign:win
```

The portable Windows bundle is unsigned unless it is separately zipped and signed as part of your release process. For the current early-testing phase, use the portable EXE bundle as the easiest evaluation artifact. The installer should be treated as an additional packaging path under test, not yet as the fully validated primary distribution channel.

---

## Dependency Vulnerability Scanning

Every CI pipeline run executes:

- `npm audit --audit-level=high` on root dependencies
- `npm audit --audit-level=high` on editor dependencies
- `cargo audit` on Rust dependencies (dedicated security audit stage)

To run locally:

```powershell
npm run audit:deps
```

---

## Security Design Principles

1. Zero plaintext credentials on disk
2. Least privilege Tauri capabilities
3. Input validation on all Tauri commands
4. Path validation for local file access
5. HTTPS-only outbound AI traffic with TLS 1.3 minimum via rustls
6. Strict application CSP - `frame-src: 'none'`, `object-src: 'none'`
7. Sidecar execution allowlist
8. Secure in-memory secret clearing via `zeroize`
9. Credential access audit logging
10. Dependency vulnerability scanning in CI

---

## Security Documentation

Detailed documentation for security review:

- [`docs/security/controls-mapping.md`](docs/security/controls-mapping.md) -
  full threat-to-control mapping with implementation status
- [`docs/security/threat-model.md`](docs/security/threat-model.md) -
  attacker profiles, trust boundaries, data flows, and mitigations
- [`docs/security/ev-code-signing-tracking.md`](docs/security/ev-code-signing-tracking.md) -
  EV certificate procurement and release pipeline readiness checklist

---

## Reporting a Vulnerability

Do not open a public issue for security vulnerabilities.

Report vulnerabilities privately through GitHub Security Advisories
or by direct contact with the repository owner.

Include:

- A description of the issue
- Steps to reproduce
- Potential impact
- Suggested remediation if known
