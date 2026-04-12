# Windows Build Instructions

Build textforge Editor for Windows 10/11.

> Build-from-source path for the public repo: install dependencies, run the prereq check, then use the root editor release scripts below.

## Quick Setup (Admin PowerShell)

### 1. Node.js

```powershell
winget install OpenJS.NodeJS.LTS
```

### 2. Rust

```powershell
Invoke-WebRequest -Uri https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe -OutFile rustup-init.exe
.\rustup-init.exe -y
Remove-Item rustup-init.exe
```

### 3. Visual Studio Community

```powershell
winget install Microsoft.VisualStudio.Community
```

Then manually install C++ tools:

- Press Win+R → type `appwiz.cpl` → Enter
- Find "Visual Studio Community 2026"
- Click Modify
- Check "Desktop development with C++"
- Click Modify and wait 10–15 minutes
- Close installer

### 4. Windows SDK

```powershell
winget install Microsoft.WindowsSDK.10.0.18362
```

### 5. Close and Reopen PowerShell

Close all PowerShell windows. Open a new admin PowerShell.

## Build

```powershell
npm ci
Set-Location editor
npm ci
Set-Location ..
npm run editor:prereqs
npm run editor:release:win:portable
```

Fastest test output: `artifacts\editor\<version>\windows-x64-portable\`
Launch: `textforge-editor.exe` from that folder and keep `resources\` next to it.
Compile from the editor toolbar now uses the saved `spec.md` on disk and opens the actual compiled output folder in Explorer, matching the CLI validation path.

If you specifically need to exercise the installer packaging path as well:

```powershell
npm run editor:release:win
```

Raw Tauri installer output remains under `editor\src-tauri\target\release\bundle\nsis\`.
Time: First build 10–15 min. Subsequent builds 2–5 min.

Prebuilt portable downloads for end users are published through GitHub Releases as `textforge-editor-windows-x64-portable.zip`.
The extracted portable payload under `artifacts\editor\<version>\windows-x64-portable\` is a local build output and should not be committed.

## Constraints

- Node.js: v22–24 only (not v25)
- Rust: MSVC toolchain (default on Windows)
- C++ workload: Manual GUI installation required (CLI doesn't work reliably)