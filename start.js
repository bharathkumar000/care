const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'web_monitor', 'frontend');
const backendDir = path.join(rootDir, 'web_monitor', 'backend');

console.log('==> Building frontend...');
const buildRes = spawnSync('npm', ['run', 'build'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true
});

if (buildRes.status !== 0) {
  console.error('Frontend build failed.');
  process.exit(buildRes.status || 1);
}

const isWin = process.platform === 'win32';
const venvDir = path.join(backendDir, 'venv');
const venvPython = isWin
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');

if (!fs.existsSync(venvPython)) {
  console.log('==> Creating Python virtual environment...');
  let pythonCmd = isWin ? 'python' : 'python3';
  let checkPy = spawnSync(pythonCmd, ['--version'], { shell: true });
  if (checkPy.status !== 0) {
    pythonCmd = isWin ? 'py' : 'python';
    checkPy = spawnSync(pythonCmd, ['--version'], { shell: true });
    if (checkPy.status !== 0) {
      console.error('Python executable was not found in PATH.');
      process.exit(1);
    }
  }

  const venvRes = spawnSync(pythonCmd, ['-m', 'venv', 'venv'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true
  });

  if (venvRes.status !== 0) {
    console.error('Failed to create virtual environment.');
    process.exit(venvRes.status || 1);
  }
}

const execPython = `"${venvPython}"`;

console.log('==> Installing backend Python requirements...');
const pipRes = spawnSync(execPython, ['-m', 'pip', 'install', '-q', '-r', 'requirements.txt'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true
});

if (pipRes.status !== 0) {
  console.error('Failed to install requirements.');
  process.exit(pipRes.status || 1);
}

console.log('==> Starting FastAPI backend server (http://localhost:8000)...');
const server = spawn(execPython, ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8000'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true
});

server.on('close', (code) => {
  process.exit(code || 0);
});
