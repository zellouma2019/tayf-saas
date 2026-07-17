const { spawn } = require('child_process');
const fs = require('fs');
const logFile = '/home/z/my-project/dev.log';

// Clear log
fs.writeFileSync(logFile, '');

const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000', '-H', '0.0.0.0'], {
  cwd: '/home/z/my-project',
  stdio: ['ignore', fs.openSync(logFile, 'a'), fs.openSync(logFile, 'a')],
  detached: true,
});

child.unref();
console.log(`Dev server started, PID: ${child.pid}`);