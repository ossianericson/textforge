# Desktop Release Artifacts

Desktop release bundles are staged under this directory after a platform build.
These bundles are local staging outputs and should not be committed to git.
Azure DevOps publishes the generated Windows and macOS installers as pipeline artifacts for each successful desktop job.
On `main`, the same staged bundles are also published to Azure Artifacts as Universal Packages.

For the current experimental-testing phase, prefer the Windows portable folder when you just want to try the editor. The installer is kept as a packaging path to test, not as the primary recommended way to evaluate the app. These staged bundles exist for testing and evaluation only and should not be described as stable end-user releases.

This README is included in the public export so the desktop distribution layout is documented for public consumers as well as internal maintainers.
The public export is source-only. Staged desktop bundles stay local build outputs and are not committed into the exported repository.

## Layout

```text
artifacts/
  editor/
    <version>/
      windows-x64/
      windows-x64-portable/
      macos-x64/
```

Each platform directory contains the copied Tauri bundle output plus a `manifest.json`
that records the product name, version, target triple, source bundle path, generation
timestamp, and staged file list.

For Windows end users, publish a zip assembled from the staged `windows-x64-portable/`
folder as a GitHub Release asset such as `textforge-editor-windows-x64-portable.zip`.
Keep the exported repository itself free of committed binaries.

The Windows portable folder contains `textforge-editor.exe`, any required runtime DLLs,
a root `binaries/` folder for the packaged sidecars, and a `resources/` directory with
the mirrored sidecar layout plus compiler runtime assets such as templates and badge config.
Double-click the EXE in place to test it. Do not separate it from either `binaries/` or
`resources/`.

If `windows-x64-portable/` is locked because the EXE is still running or Explorer is holding the folder open,
the staging script falls back to a sibling folder such as `windows-x64-portable-refresh/` instead of failing.

## Commands

From the repo root:

```text
npm run editor:release:win
npm run editor:release:win:portable
npm run editor:release:mac
```

Those commands build the editor for the requested platform and then stage the bundle
into `artifacts/editor/<version>/<platform>/`.
`npm run editor:release:win` stages both the installer output and the portable folder.
At this stage, the portable folder is the preferred testing artifact on Windows. Both outputs are experimental test artifacts, not supported production channels.

In the public GitHub repository, treat the staged directories as local build outputs only.
Attach the Windows portable zip to GitHub Releases instead of committing the extracted payload.

## Platform Notes

- Build Windows bundles on Windows.
- Build macOS bundles on macOS.
- `output/` remains reserved for compiled HTML deliverables and example output.
