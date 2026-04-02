# textforge Visual Editor

A native desktop editor for textforge `spec.md` files.
Runs on Windows 10/11 and macOS 10.15+.
No install required on Windows for the portable build.

This editor is part of the public textforge distribution. The public export snapshot includes the full `editor/` source tree so downstream users can build or package the desktop app without access to the internal repository.

## Quick start (pre-built binary)

Windows: download `textforge-editor_x.x.x_x64-setup.exe` from the Azure DevOps desktop pipeline artifact or the `textforge-editor-windows-x64` Azure Artifacts Universal Package and run it.

macOS: download `textforge-editor_x.x.x_x64.dmg` from the Azure DevOps desktop pipeline artifact or the `textforge-editor-macos-x64` Azure Artifacts Universal Package, open it, and drag textforge Editor to your Applications folder.

When you build locally, staged release artifacts are copied into `artifacts/editor/<version>/<platform>/` at the repo root.

## Build from source

### Prerequisites

| Requirement   | Windows                                            | macOS                    |
| ------------- | -------------------------------------------------- | ------------------------ |
| Node.js 22+   | nodejs.org                                         | nodejs.org               |
| Rust (stable) | rustup.rs                                          | rustup.rs                |
| WebView2      | Ships with Windows 11; downloadable for Windows 10 | Not needed               |
| Xcode CLT     | Not needed                                         | `xcode-select --install` |

Run the prereq checker:

```text
npm run editor:prereqs
```

### Development

From the repo root:

```text
npm run editor:dev
```

This starts the Vite dev server and the Tauri shell. On Windows, the script automatically bootstraps the MSVC developer environment when Build Tools are installed. In development, the sidecars run through `npx tsx` directly.

### Release sidecars

Packaged builds bundle native sidecar executables under `src-tauri/binaries/`.
They are built from the TypeScript sidecars with esbuild and `@yao-pkg/pkg` during `tauri build`.

### Build distributables

Windows:

```text
npm run editor:release:win
```

macOS:

```text
npm run editor:release:mac
```

The raw Tauri bundle is still produced under `editor/src-tauri/target/.../release/bundle/`.
The staged repo copy is written to `artifacts/editor/<version>/<platform>/`.

On Windows, the build scripts automatically import the Visual Studio C++ toolchain environment before invoking Tauri.
On macOS, build and stage the macOS bundle on a macOS host.

### Run tests

```text
npm run editor:test
```

Component and UI testing rules for the editor:

- Vitest is the default unit and integration test framework.
- React Testing Library and `@testing-library/user-event` are the default component test tools.
- Prefer `getByRole`, `getByLabelText`, and other user-facing selectors over implementation details.
- Use Playwright for end-to-end coverage.
- Use MSW for HTTP request interception instead of hand-written API mocks.
- Every React component change should add or update a corresponding `.test.tsx` file.
- Cover the happy path plus at least one error or edge case.

Desktop release builds are gated by `npm run editor:test`. `npm run editor:build`, `npm run editor:build:win`, and `npm run editor:build:mac` now run the editor test suite before Tauri packaging.

## Usage

| Action                 | Windows      | macOS       |
| ---------------------- | ------------ | ----------- |
| Open spec              | Ctrl+O       | Cmd+O       |
| Save                   | Ctrl+S       | Cmd+S       |
| Save As                | Ctrl+Shift+S | Cmd+Shift+S |
| Compile and preview    | Ctrl+P       | Cmd+P       |
| Export Mermaid diagram | Ctrl+M       | Cmd+M       |
| Undo                   | Ctrl+Z       | Cmd+Z       |

The main surface is now a WYSIWYG document editor for the canonical `spec.md` structure. Header fields, question blocks, routes, result cards, copy sections, tags, docs, and contact metadata are edited directly in the document. Saving serializes the current document state back to `spec.md`, and compile/preview continues to run through the existing parser and compiler pipeline.

## Canvas Sidebar

The collapsible sidebar shows the decision tree as a compact graph for orientation only. Selecting a node in the sidebar scrolls the document to the matching question or result block. Structural edits still happen in the document, which keeps the sidebar aligned with the current parsed spec.

## Mermaid Export

Use the toolbar button or `Ctrl/Cmd+M` to generate a Mermaid flowchart from the active spec. The modal supports previewing the generated graph, copying it to the clipboard, or saving a sibling `.mmd` file next to the current `spec.md`.

## Architecture

The editor is a Tauri v2 desktop app:

- Rust handles filesystem I/O and launches the compiler sidecars.
- React + TypeScript renders the editor UI inside the system WebView.
- TypeScript sidecars bridge the Rust layer to the existing compiler.
- Release builds bundle those sidecars as native executables so the packaged app does not require Node.js.

The compiler under `compiler/` remains read-only. `spec.md` stays the source of truth.

For the repo-wide architecture, see [../ARCHITECTURE.md](../ARCHITECTURE.md).
For editor security controls and credential handling, see [../SECURITY.md](../SECURITY.md).

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
