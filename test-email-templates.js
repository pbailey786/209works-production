// Simple test script to verify email template rendering
const { TemplateManager } = require('./src/lib/email/template-manager.ts');

async function testTemplateRendering() {
  console.log('🧪 Testing Email Template Rendering...\n');

  try {
    const templateManager = new TemplateManager();
    
    // Test welcome-job-seeker template
    console.log('📧 Testing welcome-job-seeker template...');
    const welcomePreview = await templateManager.previewTemplate('welcome-job-seeker');
    
    console.log('✅ Template rendered successfully!');
    console.log(`📝 Subject: ${welcomePreview.subject}`);
    console.log(`📏 HTML Length: ${welcomePreview.html.length} characters`);
    console.log(`🔤 Text Length: ${welcomePreview.text.length} characters`);
    
    // Check if HTML contains proper tags (not escaped)
    const hasProperHTML = welcomePreview.html.includes('<html>') && 
                         welcomePreview.html.includes('<body>') &&
                         !welcomePreview.html.includes('&lt;html&gt;');
    
    console.log(`🏷️  HTML Tags Properly Formatted: ${hasProperHTML ? '✅ YES' : '❌ NO'}`);
    
    // Show first 200 characters of HTML
    console.log('\n📄 HTML Preview (first 200 chars):');
    console.log(welcomePreview.html.substring(0, 200) + '...\n');
    
    // Test password reset template
    console.log('📧 Testing password-reset template...');
    const resetPreview = await templateManager.previewTemplate('password-reset');
    
    console.log('✅ Password reset template rendered successfully!');
    console.log(`📝 Subject: ${resetPreview.subject}`);
    console.log(`📏 HTML Length: ${resetPreview.html.length} characters`);
    
    const resetHasProperHTML = resetPreview.html.includes('<html>') && 
                              resetPreview.html.includes('<body>') &&
                              !resetPreview.html.includes('&lt;html&gt;');
    
    console.log(`🏷️  HTML Tags Properly Formatted: ${resetHasProperHTML ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n📄 Password Reset HTML Preview (first 200 chars):');
    console.log(resetPreview.html.substring(0, 200) + '...\n');
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`✅ Welcome template: ${hasProperHTML ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Password reset template: ${resetHasProperHTML ? 'PASS' : 'FAIL'}`);
    
    if (hasProperHTML && resetHasProperHTML) {
      console.log('\n🎉 All tests PASSED! Email templates are rendering HTML correctly.');
    } else {
      console.log('\n❌ Some tests FAILED! HTML is still being escaped.');
    }
    
  } catch (error) {
    console.error('❌ Error testing templates:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testTemplateRendering();
