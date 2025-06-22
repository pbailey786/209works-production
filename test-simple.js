// Simple test to see if we can start the development server
const { spawn } = require('child_process');

console.log('🚀 Testing simple dev server start...');

const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
});

let hasStarted = false;
let output = '';

// Set a timeout to kill the process after 60 seconds
const timeout = setTimeout(() => {
  if (!hasStarted) {
    console.log('❌ Dev server failed to start within 60 seconds');
    console.log('📋 Output so far:');
    console.log(output);
    devProcess.kill();
    process.exit(1);
  }
}, 60000);

devProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  
  // Look for successful start indicators
  if (text.includes('Ready') || text.includes('Local:') || text.includes('localhost:3000')) {
    hasStarted = true;
    clearTimeout(timeout);
    console.log('✅ Dev server started successfully!');
    console.log('🌐 Try opening: http://localhost:3000');
    console.log('🌐 Try admin page: http://localhost:3000/admin (should show disabled feature)');
    
    // Keep running for 10 seconds then exit
    setTimeout(() => {
      console.log('✅ Test completed - dev server is working');
      devProcess.kill();
      process.exit(0);
    }, 10000);
  }
});

devProcess.stderr.on('data', (data) => {
  output += data.toString();
});

devProcess.on('close', (code) => {
  if (!hasStarted) {
    console.log(`❌ Dev server exited with code ${code}`);
    console.log('📋 Full output:');
    console.log(output);
  }
});