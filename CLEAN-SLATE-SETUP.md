# 209 Works Clean Slate User Setup

## 🗑️ **Complete User Reset & Fresh Admin Creation**

This guide will help you delete all existing user accounts and create fresh admin accounts for production launch.

---

## ⚠️ **WARNING: Data Deletion**

**This process will permanently delete:**

- All user accounts
- All job applications
- All saved jobs
- All chat history
- All user profiles
- All notifications
- All credit transactions

**This will NOT delete:**

- Job listings
- Company data
- System settings
- Analytics data (non-user specific)

---

## 🚀 **Step-by-Step Process**

### **Step 1: Clean Slate Database Reset**

**Option A: Using Supabase SQL Editor (Recommended)**

1. Go to https://app.supabase.com
2. Open your 209 Works project
3. Go to SQL Editor
4. Copy and paste the contents of `scripts/reset-users-clean-slate.sql`
5. Click "Run" to execute

**Option B: Using Local Script**

```bash
# If you have local database access
psql $DATABASE_URL -f scripts/reset-users-clean-slate.sql
```

### **Step 2: Create Fresh Admin Accounts**

```bash
# Run the admin account creation script
node scripts/create-admin-accounts.js
```

This will create:

- Admin accounts in the database
- Both employer and job seeker profiles
- 1000 credits per admin account
- Sample job for testing

### **Step 3: Set Up Clerk Authentication**

1. **Go to https://209.works/sign-up**
2. **Sign up with your admin email** (e.g., `pbailey786@gmail.com`)
3. **Complete the signup process**
4. **Clerk will create the authentication account**
5. **The system will automatically link to your database profile**

### **Step 4: Verify Admin Access**

1. **Log in to https://209.works**
2. **Go to https://209.works/admin**
3. **Verify you have admin dashboard access**
4. **Check that you have 1000 credits**
5. **Test posting a job to verify employer functionality**

---

## 👥 **Default Admin Accounts Created**

The script creates these admin accounts:

```
📧 admin@209.works
   - Role: Admin
   - Credits: 1000
   - Profiles: Employer + Job Seeker

📧 pbailey786@gmail.com
   - Role: Admin
   - Credits: 1000
   - Profiles: Employer + Job Seeker
```

**Note:** You can modify the email addresses in `scripts/create-admin-accounts.js` before running.

---

## 🔧 **Troubleshooting**

### **If Database Reset Fails**

```sql
-- Check what tables exist
\dt

-- Check if users table is empty
SELECT COUNT(*) FROM users;

-- If you get foreign key errors, try this order:
DELETE FROM applications;
DELETE FROM saved_jobs;
DELETE FROM users;
```

### **If Admin Creation Fails**

```bash
# Check if accounts were created
node scripts/create-admin-accounts.js --verify

# If you get unique constraint errors
# Run the clean slate script again first
```

### **If Clerk Signup Fails**

1. Check that your email is in the admin accounts list
2. Try a different browser or incognito mode
3. Check Clerk dashboard for any issues
4. Verify environment variables are set

### **If Admin Access Denied**

```sql
-- Manually set admin role in Supabase
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

---

## 🎯 **Verification Checklist**

After completing the process, verify:

- [ ] **Database is clean**: No old user accounts remain
- [ ] **Admin accounts created**: Can see them in Supabase users table
- [ ] **Clerk signup works**: Can create account at 209.works/sign-up
- [ ] **Admin dashboard access**: Can access /admin pages
- [ ] **Credits available**: Admin accounts have 1000 credits
- [ ] **Job posting works**: Can post test jobs
- [ ] **JobsGPT works**: Can use AI chat functionality

---

## 📊 **Sample Data Included**

The admin setup creates:

- **Sample Job**: "Software Developer - Test Job"
- **Admin Profiles**: Both employer and job seeker
- **Credits**: 1000 credits per admin account
- **Verification**: All accounts pre-verified

---

## 🚨 **Emergency Rollback**

If something goes wrong:

1. **Restore from Supabase backup** (if available)
2. **Or re-run the scripts**:

   ```bash
   # Clean slate again
   # Run reset-users-clean-slate.sql in Supabase

   # Recreate admin accounts
   node scripts/create-admin-accounts.js
   ```

---

## 🎉 **Success!**

After completing these steps, you'll have:

- ✅ **Clean production database** with no old test accounts
- ✅ **Fresh admin accounts** with full permissions
- ✅ **Working authentication** via Clerk
- ✅ **Sample data** for testing functionality
- ✅ **Ready for production** user registrations

**Your 209 Works platform is now ready for real users!**

---

## 📞 **Need Help?**

If you run into issues:

1. Check the troubleshooting section above
2. Verify environment variables in Netlify
3. Check Supabase and Clerk dashboards for errors
4. Review the console logs for specific error messages

**Ready to start fresh? Let's clean slate this thing!** 🧹✨
