const { spawn } = require('child_process');
const path = require('path');

const colors = {
  backend: '\x1b[36m', // cyan
  frontend: '\x1b[32m', // green
  reset: '\x1b[0m'
};

function prefixOutput(stream, label, color) {
  stream.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${label}]${colors.reset} ${line}`);
    });
  });
}

console.log('Starting Backend and Frontend...\n');

// Start Backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true
});

prefixOutput(backend.stdout, 'BACK', colors.backend);
prefixOutput(backend.stderr, 'BACK', colors.backend);

// Start Frontend
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  shell: true
});

prefixOutput(frontend.stdout, 'FRONT', colors.frontend);
prefixOutput(frontend.stderr, 'FRONT', colors.frontend);

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\nShutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

console.log('Servers running. Press Ctrl+C to stop.\n');
