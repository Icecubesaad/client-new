const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting cPanel deployment preparation...');

try {
  // Clean previous build
  if (fs.existsSync('out')) {
    console.log('🧹 Cleaning previous build...');
    fs.rmSync('out', { recursive: true, force: true });
  }

  // Build the application
  console.log('🔨 Building Next.js application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if build was successful
  if (!fs.existsSync('out')) {
    throw new Error('Build failed - out directory not found');
  }

  console.log('✅ Build completed successfully!');
  console.log('📁 Static files are ready in the "out" directory');
  console.log('');
  console.log('Next steps:');
  console.log('1. Commit all changes to your Git repository');
  console.log('2. Push to your cPanel Git repository');
  console.log('3. The .cpanel.yml file will handle the deployment');
  console.log('');
  console.log('Note: Make sure to update DEPLOYPATH in .cpanel.yml with your actual cPanel path');

} catch (error) {
  console.error('❌ Deployment preparation failed:', error.message);
  process.exit(1);
}
