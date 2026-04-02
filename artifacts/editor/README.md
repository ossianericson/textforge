# Desktop Release Artifacts

Desktop release bundles are staged under this directory after a platform build.
These bundles are local staging outputs and should not be committed to git.
Azure DevOps publishes the generated Windows and macOS installers as pipeline artifacts for each successful desktop job.
On `main`, the same staged bundles are also published to Azure Artifacts as Universal Packages.

This README is included in the public export so the desktop distribution layout is documented for public consumers as well as internal maintainers.

## Layout

```text
artifacts/
  editor/
    <version>/
      windows-x64/
      macos-x64/
```

Each platform directory contains the copied Tauri bundle output plus a `manifest.json`
that records the product name, version, target triple, source bundle path, generation
timestamp, and staged file list.

## Commands

From the repo root:

```text
npm run editor:release:win
npm run editor:release:mac
```

Those commands build the editor for the requested platform and then stage the bundle
into `artifacts/editor/<version>/<platform>/`.

In CI, the same staged directories are published from the pipeline.
For `main` builds, the staged platform folders are also pushed to Azure Artifacts as
`textforge-editor-windows-x64` and `textforge-editor-macos-x64` Universal Packages.
These outputs should replace checked-in installer binaries going forward.

## Platform Notes

- Build Windows bundles on Windows.
- Build macOS bundles on macOS.
- `output/` remains reserved for compiled HTML deliverables and example output.
