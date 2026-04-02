# EV Code Signing Tracking

Status: Open
Priority: High
Owner: Release Engineering (TBD)
Target: Before first enterprise deployment

## Why this is required

Unsigned or non-EV-signed Windows installers trigger SmartScreen
"Unknown publisher" warnings, which blocks managed enterprise rollout.

## Deliverables

- Procure EV code-signing certificate from approved CA.
- Store certificate material in enterprise-controlled secure signing service.
- Configure Azure DevOps secure pipeline access for signing.
- Ensure signing occurs in release pipeline before packaging/publishing.
- Verify signed installer shows trusted publisher and timestamp.
- Document certificate rotation and revocation runbook.

## Pipeline requirements

- Signing must be a required release gate for Windows artifacts.
- Build should fail if signing inputs are unavailable for release builds.
- Timestamp service must be configured and validated in CI logs.

## Acceptance criteria

- Windows installer is signed with EV certificate in CI release job.
- SmartScreen shows recognized publisher, no "Unknown publisher" warning.
- Signing evidence is captured in release artifacts and logs.
- Security review sign-off recorded.
