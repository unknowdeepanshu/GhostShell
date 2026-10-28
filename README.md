# GhostShell 👻

GhostShell is a local-first Tauri desktop companion for inspecting shell commands without executing them. It explains the command, highlights dangerous patterns, and gives a restrained spooky response.

## Current behavior

- **Never executes input.** The frontend only sends text to an analyzer.
- Uses a deterministic analyzer today, with the Rust `analyze_command` command providing the desktop boundary for a future local GGUF adapter.
- Saves up to 50 journal entries to the OS application data directory (browser preview uses `localStorage`).
- Keeps working when the Tauri runtime or model is unavailable.

## Development

```bash
npm install
npm run dev
```

The browser preview is useful for UI work. To package the desktop app, install the Tauri v2 prerequisites and Rust, then use the Tauri CLI:

```bash
npm install --save-dev @tauri-apps/cli
npx tauri dev
```

The model adapter should be added behind the `analyze_command` command after validating a small quantized model's actual RAM use on the target Windows hardware. Model files must be downloaded only after explicit user action and stored under the application data directory.
