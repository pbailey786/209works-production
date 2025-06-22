// Script to create admin user via API
// Run with: node scripts/create-admin-api.js

async function createAdminViaAPI() {
  try {
    console.log('🔧 Creating admin user via API...');

    // CHANGE THESE CREDENTIALS!
    const adminData = {
      email: 'admin@209.works',
      password: 'AdminPassword123!',
      role: 'admin', // This will be set in the API
    };

    // Your site URL - update if different
    const siteUrl = 'https://flourishing-kheer-7a3783.netlify.app';

    const response = await fetch(`${siteUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', adminData.email);
      console.log('🔐 Password:', adminData.password);
      console.log('\n⚠️  IMPORTANT: Change the password after first login!');
      console.log('\n🌐 Admin login URL:', `${siteUrl}/signin`);
    } else {
      console.error('❌ Error creating admin user:', result);

      if (result.error === 'User already exists') {
        console.log(
          '\n💡 User already exists. You can manually update their role in the database:'
        );
        console.log(
          `UPDATE "User" SET role = 'admin' WHERE email = '${adminData.email}';`
        );
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the script
createAdminViaAPI();
