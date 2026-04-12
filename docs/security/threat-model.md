# textforge Editor - Threat Model

**Classification:** Internal  
**Owner:** Architecture  
**Last reviewed:** [DATE]

---

## Application Overview

textforge Editor is a Windows desktop application (Tauri v2) that
allows architecture teams to author and publish decision tree
specifications. It connects to Azure OpenAI for AI-assisted authoring,
Azure DevOps / GitHub for version control, and Confluence for publishing.

The compiled output (HTML files) is 100% static and contains no
runtime AI, no authentication, and no outbound network calls.
This threat model covers only the Editor application.

---

## Attacker Profiles

| Profile                | Access                                  | Motivation                                 |
| ---------------------- | --------------------------------------- | ------------------------------------------ |
| External attacker      | No local access, internet only          | Credential theft for cloud resource access |
| Malicious insider      | Local machine access, same network      | Credential theft, data exfiltration        |
| Compromised dependency | Code runs in-process                    | Escalate to system, exfiltrate credentials |
| Physical attacker      | Physical access to unlocked workstation | Credential theft, data access              |

---

## Data Flow Diagram

```
User input
    |
    v
React UI (WebView2, sandboxed)
    | Tauri IPC (validated, typed commands only)
    v
Rust backend (system process)
    |-- Windows Credential Manager <-> DPAPI (encrypted at rest)
    |-- Filesystem (spec files, audit log, app config)
    '-- HTTPS (TLS 1.2+)
            |-- Azure OpenAI / OpenAI
            |-- Azure DevOps / GitHub
            '-- Confluence
```

---

## Threat Enumeration

See `docs/security/controls-mapping.md` for the full
threat-to-control mapping with implementation status.

### In scope

- T1: Credential theft via plaintext storage
- T2: Credential exposure via logs
- T3: In-memory credential attack
- T4: Man-in-the-middle on outbound traffic
- T5: Tauri IPC privilege escalation
- T6: Content injection via spec files
- T7: Supply chain attack
- T8: Installer tampering

### Out of scope

- Attacks requiring kernel-level access or hypervisor compromise
- Attacks on the Azure OpenAI service infrastructure itself
- Side-channel attacks (timing, cache)
- Social engineering of the user
- Attacks on the compiled HTML output (it has no auth, no runtime)

---

## Security Assumptions

1. The Windows user account running the editor is not compromised.
2. The endpoint management policy (MDM, antivirus, EDR) on
   developer workstations is correctly applied.
3. Azure RBAC limits the blast radius of a compromised AAD token
   to the resources the user already has access to.
4. The Azure DevOps PAT scope is limited (read/write repos only,
   not organisation admin).

---

## Review Schedule

This threat model should be reviewed:

- Before each major version release
- After any change to credential handling or network connectivity
- After any security incident
