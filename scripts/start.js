const { spawn } = require('node:child_process');
const path = require('node:path');

const expoCli = path.resolve(__dirname, '../node_modules/expo/bin/cli');
const server = spawn(process.execPath, [path.resolve(__dirname, '../server/index.js')], {
  stdio: 'inherit',
});
const expo = spawn(process.execPath, [expoCli, 'start', ...process.argv.slice(2)], {
  stdio: 'inherit',
});

const stopProcesses = () => {
  server.kill();
  expo.kill();
};

server.on('error', (error) => {
  console.error('Failed to start analysis proxy:', error.message);
  stopProcesses();
  process.exitCode = 1;
});

expo.on('error', (error) => {
  console.error('Failed to start Expo:', error.message);
  stopProcesses();
  process.exitCode = 1;
});

expo.on('exit', (code) => {
  stopProcesses();
  process.exitCode = code || 0;
});

process.on('SIGINT', () => {
  stopProcesses();
  process.exit(0);
});

process.on('SIGTERM', stopProcesses);