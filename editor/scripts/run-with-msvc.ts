import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function resolveVswhere(): string | null {
  const programFilesX86 = process.env['ProgramFiles(x86)'] ?? 'C:/Program Files (x86)';
  const candidate = path.join(
    programFilesX86,
    'Microsoft Visual Studio',
    'Installer',
    'vswhere.exe'
  );
  return existsSync(candidate) ? candidate : null;
}

function resolveMsvcBootstrapScript(): string | null {
  const vswhere = resolveVswhere();
  if (!vswhere) {
    return null;
  }

  const installPathResult = spawnSync(
    vswhere,
    [
      '-latest',
      '-products',
      '*',
      '-requires',
      'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
      '-property',
      'installationPath',
    ],
    { encoding: 'utf8' }
  );

  if (installPathResult.status !== 0) {
    return null;
  }

  const installationPath = installPathResult.stdout.trim();
  if (!installationPath) {
    return null;
  }

  const vcvarsCandidate = path.join(installationPath, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
  if (existsSync(vcvarsCandidate)) {
    return vcvarsCandidate;
  }

  const vsDevCmdCandidate = path.join(installationPath, 'Common7', 'Tools', 'VsDevCmd.bat');
  return existsSync(vsDevCmdCandidate) ? vsDevCmdCandidate : null;
}

function loadMsvcEnvironment(): NodeJS.ProcessEnv {
  const bootstrapScript = resolveMsvcBootstrapScript();
  console.log(`[run-with-msvc] Resolved bootstrap script: ${bootstrapScript ?? 'none'}`);

  if (!bootstrapScript) {
    return { ...process.env };
  }

  const bootstrapArgs =
    path.basename(bootstrapScript).toLowerCase() === 'vcvars64.bat' ? '' : ' -arch=x64';

  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'textforge-msvc-'));
  const bootstrapFile = path.join(tempDir, 'load-msvc-env.cmd');
  writeFileSync(
    bootstrapFile,
    [
      '@echo off',
      `call "${bootstrapScript}"${bootstrapArgs} >nul`,
      'if errorlevel 1 exit /b %errorlevel%',
      'set',
    ].join('\r\n'),
    'utf8'
  );

  const envDump = spawnSync('cmd.exe', ['/d', '/c', bootstrapFile], {
    encoding: 'utf8',
    cwd: path.dirname(bootstrapScript),
  });

  rmSync(tempDir, { recursive: true, force: true });

  if (envDump.status !== 0) {
    const details = [envDump.stderr.trim(), envDump.stdout.trim()].filter(Boolean).join('\n');
    throw new Error(details || 'Failed to import Visual Studio developer environment.');
  }

  const mergedEnv: NodeJS.ProcessEnv = { ...process.env };
  envDump.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex <= 0) {
        return;
      }
      const key = line.slice(0, separatorIndex);
      const value = line.slice(separatorIndex + 1);
      mergedEnv[key] = value;
    });

  return mergedEnv;
}

function main(): never | void {
  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    throw new Error('Usage: tsx scripts/run-with-msvc.ts <command> [args...]');
  }

  const env = process.platform === 'win32' ? loadMsvcEnvironment() : { ...process.env };
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env,
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

main();
