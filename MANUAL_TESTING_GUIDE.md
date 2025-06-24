# 🧪 Manual Testing Guide for User Profile Workflows

## 🎯 **Testing Objectives**
Verify that the complete job seeker experience works end-to-end after our AI chat implementation.

## 📋 **Test Plan**

### **Test 1: Authentication & Onboarding Flow**
1. **Sign Up Process**
   - [ ] Go to `/sign-up`
   - [ ] Create new account with email
   - [ ] Check if redirected to onboarding
   - [ ] Complete onboarding form
   - [ ] Verify redirection to dashboard

2. **Sign In Process** 
   - [ ] Go to `/sign-in`
   - [ ] Sign in with existing account
   - [ ] Check if redirected to dashboard
   - [ ] Verify user navigation appears in header

### **Test 2: Homepage AI Chat Experience**
1. **Homepage Chat Interface**
   - [ ] Visit homepage (`/`)
   - [ ] Verify AI chat interface loads (not old search box)
   - [ ] Try suggested prompts like "Find warehouse jobs in Stockton"
   - [ ] Verify AI responds with local job focus
   - [ ] Check job cards appear in chat

2. **Job Card Functionality**
   - [ ] Click on job cards → Should open in new window
   - [ ] Verify job detail page loads correctly
   - [ ] Test "Apply", "View", "Save" buttons on job cards

### **Test 3: Save Jobs Workflow**
1. **Save Jobs from Chat**
   - [ ] Use homepage chat to find jobs
   - [ ] Click "Save" on a job card
   - [ ] Verify it opens job page in new window
   
2. **Save Jobs from Job Page**
   - [ ] Go to any job detail page (`/jobs/[id]`)
   - [ ] Click "Save Job" button
   - [ ] Verify save state changes (button updates)
   - [ ] Try unsaving the job

3. **View Saved Jobs**
   - [ ] Go to dashboard (`/dashboard`)
   - [ ] Check "Saved Jobs" section shows saved jobs
   - [ ] OR go to `/profile/saved` 
   - [ ] Verify saved jobs appear correctly

### **Test 4: Profile Management**
1. **Profile Page Access**
   - [ ] Go to `/profile` 
   - [ ] Verify page loads without errors
   - [ ] Check all sections visible (profile info, uploads, etc.)

2. **File Uploads**
   - [ ] Upload profile picture → Check success/error messages
   - [ ] Upload resume → Check success/error messages  
   - [ ] Upload cover letter → Check success/error messages
   - [ ] Verify files appear in profile

3. **Profile Updates**
   - [ ] Update basic info (name, location, etc.)
   - [ ] Save changes
   - [ ] Refresh page → Verify changes persisted

### **Test 5: Dashboard Functionality**
1. **Dashboard Stats**
   - [ ] Go to `/dashboard`
   - [ ] Check if stats show real numbers (not 0's)
   - [ ] Verify: Saved Jobs count, Applications count, Active Alerts

2. **Dashboard Sections**
   - [ ] Check "Recent Activity" section
   - [ ] Check "Saved Jobs" section  
   - [ ] Check "Applications" section
   - [ ] Click links → Verify navigation works

### **Test 6: Navigation & Cross-Flow**
1. **Header Navigation**
   - [ ] Click "JobsGPT" → Should go to `/chat`
   - [ ] Click "Find Jobs" → Should go to `/jobs`
   - [ ] Click user avatar → Check dropdown menu
   - [ ] Test Dashboard, Profile, Applications links

2. **Cross-Navigation Flow**
   - [ ] Homepage Chat → Job Page → Dashboard → Profile
   - [ ] Verify user can navigate smoothly between sections
   - [ ] Check no broken links or 404 errors

## 🚨 **Issues to Watch For**

### **Critical Issues:**
- [ ] **Authentication errors** - 401/403 responses
- [ ] **Save job failures** - Jobs not saving to database
- [ ] **Upload failures** - File uploads not working
- [ ] **Dashboard showing 0's** - Stats not loading real data

### **UX Issues:**
- [ ] **Slow loading** - API responses > 5 seconds  
- [ ] **Broken navigation** - Links going to wrong pages
- [ ] **UI errors** - Broken layouts or missing components
- [ ] **Mobile issues** - Chat/profile not working on mobile

### **AI Chat Issues:**
- [ ] **502/500 errors** - Chat API failures
- [ ] **No job results** - Search returning empty results
- [ ] **Cards not opening** - Job cards not opening in new windows

## 📊 **Expected Results**

### **Working Features:**
✅ Homepage AI chat with local job focus  
✅ Job cards opening in new windows  
✅ User authentication with Clerk  
✅ Profile page with upload functionality  
✅ Save jobs workflow  
✅ Dashboard with real stats  
✅ Navigation between all sections  

### **Temporarily Disabled:**
⚠️ Chat history (disabled to prevent 500 errors)  
⚠️ Some advanced profile features  

## 🎯 **Success Criteria**

**Test passes if:**
1. **New user can**: Sign up → Onboard → Use chat → Save jobs → View dashboard
2. **Existing user can**: Sign in → Use chat → Save jobs → Manage profile  
3. **No critical errors**: No 500 errors, no broken core functionality
4. **Smooth navigation**: Can move between chat → jobs → dashboard → profile

## 🛠️ **If Issues Found**

**Document:**
1. Exact steps to reproduce
2. Error messages (check browser console)
3. Expected vs actual behavior
4. URL where issue occurs

**Priority Fixes:**
1. **P0**: Authentication or save job failures
2. **P1**: Profile uploads or dashboard stats  
3. **P2**: Navigation or UI issues
4. **P3**: Performance or minor UX issues

**Ready for Phase 5C (Regions) when all P0 and P1 issues are resolved.**