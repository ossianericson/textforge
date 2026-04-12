import { execSync } from 'node:child_process';
import os from 'node:os';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function ok(label: string) {
  console.log(`${GREEN}✓${RESET} ${label}`);
}

function fail(label: string, hint: string) {
  console.log(`${RED}✗${RESET} ${label}`);
  console.log(`  ${hint}`);
}

function run(command: string): string | null {
  try {
    return execSync(command, { stdio: 'pipe' }).toString().trim();
  } catch {
    return null;
  }
}

console.log(`\n${BOLD}textforge Editor — Prerequisite Check${RESET}\n`);

const nodeVersion = run('node --version');
if (nodeVersion && Number(nodeVersion.replace('v', '').split('.')[0]) >= 22) {
  ok(`Node.js ${nodeVersion}`);
} else {
  fail(`Node.js 22+ required (found: ${nodeVersion ?? 'none'})`, 'Download: https://nodejs.org');
}

const rustVersion = run('rustc --version');
if (rustVersion) {
  ok(`Rust ${rustVersion}`);
} else {
  fail('Rust not found', 'Install: https://rustup.rs');
}

const tauriVersion = run('npx tauri --version');
if (tauriVersion) {
  ok(`Tauri CLI ${tauriVersion}`);
} else {
  fail('Tauri CLI not found', 'Run npm install inside editor/ to install @tauri-apps/cli');
}

const platform = os.platform();

if (platform === 'win32') {
  const webView2 = run(
    'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /v pv 2>nul'
  );
  if (webView2) {
    ok('WebView2 (Windows) — found');
  } else {
    fail(
      'WebView2 not detected',
      'Download: https://developer.microsoft.com/microsoft-edge/webview2/\n  Note: Windows 11 includes WebView2 by default.'
    );
  }
}

if (platform === 'darwin') {
  const xcodeTools = run('xcode-select -p');
  if (xcodeTools) {
    ok(`Xcode Command Line Tools (${xcodeTools})`);
  } else {
    fail('Xcode Command Line Tools not found', 'Run: xcode-select --install');
  }
}

console.log('');