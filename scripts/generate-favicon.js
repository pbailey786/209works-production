const fs = require('fs');
const path = require('path');

// Create a simple favicon.ico content (base64 encoded)
// This is a minimal 16x16 favicon with the 209 branding
const faviconIcoBase64 = `AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sA////AP///wAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwD///8AI2O7ACNjuwD///8A////AP///wD///8A////ACNjuwD///8A////AP///wD///8A////ACNjuwAjY7sA////AP///wAjY7sAI2O7AP///wD///8A////AP///wD///8AI2O7AP///wD///8A////AP///wD///8AI2O7ACNjuwD///8A////ACNjuwAjY7sA////AP///wD///8A////AP///wAjY7sA////AP///wD///8A////AP///wAjY7sAI2O7AP///wD///8AI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sA////AP///wAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7AP///wD///8AI2O7ACNjuwD///8A////AP///wD///8A////ACNjuwD///8A////AP///wD///8A////ACNjuwAjY7sA////AP///wAjY7sAI2O7AP///wD///8A////AP///wD///8AI2O7AP///wD///8A////AP///wD///8AI2O7ACNjuwD///8A////ACNjuwAjY7sA////AP///wD///8A////AP///wAjY7sA////AP///wD///8A////AP///wAjY7sAI2O7AP///wD///8AI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sA////AP///wAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7ACNjuwAjY7sAI2O7AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==`;

// Convert base64 to buffer and write favicon.ico
const faviconBuffer = Buffer.from(faviconIcoBase64, 'base64');
fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), faviconBuffer);

console.log('✅ Generated favicon.ico');

// Create a simple HTML snippet for favicon links
const faviconHTML = `
<!-- Favicon -->
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
`;

console.log('✅ Favicon files generated!');
console.log('📋 Add this to your HTML head:');
console.log(faviconHTML);
