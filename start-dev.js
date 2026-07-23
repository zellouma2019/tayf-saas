const { spawn } = require('child_process');
const child = spawn('npx', ['next', 'dev', '-p', '3000', '-H', '0.0.0.0'], {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env }
});
child.unref();
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
child.on('exit', code => console.log('Server exited with code:', code));
