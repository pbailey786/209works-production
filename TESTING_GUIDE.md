# 🧪 **209 Works Onboarding & Smart Matching - Complete Testing Guide**

## 🚀 **System Overview**
We've built a comprehensive onboarding and smart matching system with:
- Multi-step job seeker onboarding with resume parsing
- Employer onboarding with hiring preferences  
- Smart job matching algorithm (5-point scoring)
- "Should I Apply?" feature with personalized recommendations
- Email job alerts for matched candidates

---

## 👤 **PART 1: JOB SEEKER ONBOARDING TEST**

### **🔗 Test URL:** `https://209.works/onboarding/jobseeker`

### **📋 Step-by-Step Testing:**

#### **Step 1: Resume Upload**
- [ ] **Upload PDF resume** - Confirm parsing works
- [ ] **Upload DOCX resume** - Confirm parsing works  
- [ ] **Try invalid file** (JPG, TXT) - Should show error
- [ ] **Skip resume upload** - Should allow continuation
- [ ] **Check autofill:** Name, email, phone, skills extracted correctly

#### **Step 2: Review & Edit**
- [ ] **Required fields validation:** Name, email, zip code
- [ ] **Email format validation:** Invalid emails rejected
- [ ] **Zip code validation:** 5-digit format required
- [ ] **Skills editing:** Can modify comma-separated skills list

#### **Step 3: Availability**
- [ ] **Days selection:** Must select at least 1 day
- [ ] **Shifts selection:** Must select at least 1 shift  
- [ ] **Distance slider:** 5-100 miles range works
- [ ] **Cannot continue** without days + shifts selected

#### **Step 4: Job Preferences**
- [ ] **Job types:** Must select at least 1 type
- [ ] **"What are you good at"** text area works
- [ ] **Skills selection:** Optional skill tags work

#### **Step 5: Career Goals**
- [ ] **Goal selection:** Must select 1 of 3 options
- [ ] **Goal-specific messaging** displays correctly

#### **Step 6: Opt-ins & Completion**
- [ ] **Toggle switches** work for email/SMS/employer messages
- [ ] **Profile submission** succeeds
- [ ] **Redirect to dashboard** after completion
- [ ] **Database check:** Profile saved to `job_seeker_profile` table

### **✅ Expected Database Result:**
```sql
SELECT * FROM "JobSeekerProfile" WHERE "userId" = 'test-user-id';
-- Should show: zipCode, availability, jobTypes, skills, careerGoal, opt-ins
```

---

## 🏢 **PART 2: EMPLOYER ONBOARDING TEST**

### **🔗 Test URL:** `https://209.works/onboarding/employer`

### **📋 Step-by-Step Testing:**

#### **Step 1: Company Info**
- [ ] **Company name** required
- [ ] **Industry dropdown** required
- [ ] **Location** required
- [ ] **Cannot continue** without all 3 fields

#### **Step 2: Hiring Preferences**
- [ ] **Checkboxes work:** Teens, seniors, training, background checks
- [ ] **Common roles selection:** Multiple role tags selectable
- [ ] **All preferences optional** - can continue without selections

#### **Step 3: Job Posting Preferences**
- [ ] **Contact method:** Radio buttons work (email/phone/dashboard)
- [ ] **AI optimization toggle** works
- [ ] **Contact method required** to continue

#### **Step 4: Goals & Completion**
- [ ] **Hiring goal selection:** Must select 1 of 3 options
- [ ] **Profile submission** succeeds
- [ ] **Redirect to employer dashboard** after completion
- [ ] **Database check:** Profile saved to `employer_profile` table

### **✅ Expected Database Result:**
```sql
SELECT * FROM "EmployerProfile" WHERE "userId" = 'test-employer-id';
-- Should show: companyName, industryType, location, preferences, hiringGoal
```

---

## 🤖 **PART 3: "SHOULD I APPLY?" SYSTEM TEST**

### **🔗 Test Location:** Any job detail page (e.g., `/jobs/[job-id]`)

### **📋 Testing Scenarios:**

#### **Scenario A: Completed Job Seeker Profile**
1. **Login as job seeker** with completed profile
2. **Visit any job page**
3. **Click "Should I Apply?" button**
4. **Expected Results:**
   - [ ] Modal opens with analysis
   - [ ] Shows match score (0-5 points)
   - [ ] Shows percentage match
   - [ ] Lists specific match reasons
   - [ ] Provides application tips
   - [ ] Recommendation: Strong/Good/Fair/Poor

#### **Scenario B: Incomplete Profile**
1. **Login as job seeker** without completed profile
2. **Click "Should I Apply?"**
3. **Expected Results:**
   - [ ] Shows "Complete Profile First" message
   - [ ] Redirects to `/onboarding/jobseeker`
   - [ ] Error message explains profile requirement

#### **Scenario C: Not Logged In**
1. **Visit job page** without login
2. **Click "Should I Apply?"**
3. **Expected Results:**
   - [ ] Shows "Please sign in" message
   - [ ] Prompts for authentication

### **🧮 Match Score Testing:**
Test with different job seeker profiles to verify scoring:
- [ ] **Skills match:** +1 point for matching skills
- [ ] **Job type match:** +1 point for relevant job types
- [ ] **Location match:** +1 point for 209 area jobs
- [ ] **Spanish bonus:** +1 point if both job and seeker have Spanish
- [ ] **Experience match:** +1 point for entry-level + "need job ASAP"

---

## 📨 **PART 4: EMAIL MATCH ALERTS TEST**

### **🔗 Test Endpoint:** `/api/jobs/match-alerts`

### **📋 Manual Testing:**

#### **Setup Test Data:**
1. **Create job seeker profile** with email alerts enabled
2. **Create test job** with matching criteria
3. **Trigger match alerts** manually

#### **API Testing:**
```bash
# Test match alerts for specific job
curl -X POST https://209.works/api/jobs/match-alerts \
  -H "Authorization: Bearer YOUR_CRON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jobId": "test-job-id"}'
```

#### **Expected Results:**
- [ ] **API returns match count** and email results
- [ ] **Job seekers with score ≥ 3** receive emails
- [ ] **Email contains:** Job title, company, match reasons, apply link
- [ ] **Email styling** looks professional
- [ ] **Unsubscribe links** work

### **✅ Email Content Verification:**
- [ ] Subject: "🎯 Job Match: [Job Title] at [Company]"
- [ ] Shows match score (e.g., "4/5 match")
- [ ] Lists specific match reasons
- [ ] Contains working "View Job & Apply" button
- [ ] Includes unsubscribe/preferences links

---

## 🚨 **PART 5: QA CHECKLIST**

### **🔧 Technical Validation:**
- [ ] **All forms validate** required fields correctly
- [ ] **Error messages** are user-friendly and helpful
- [ ] **Mobile responsive** - works on phone/tablet
- [ ] **Resume parsing** handles PDF and DOCX formats
- [ ] **File upload errors** handled gracefully
- [ ] **Database constraints** prevent duplicate profiles
- [ ] **API error handling** returns proper status codes

### **🎨 User Experience:**
- [ ] **Progress indicators** show current step clearly
- [ ] **Back/forward navigation** works in all steps
- [ ] **Form data persists** when navigating between steps
- [ ] **Loading states** show during API calls
- [ ] **Success messages** confirm completion
- [ ] **Accessibility** - keyboard navigation works

### **🔒 Security & Data:**
- [ ] **Authentication required** for profile creation
- [ ] **User data isolation** - can't access other profiles
- [ ] **Input sanitization** prevents XSS/injection
- [ ] **File upload security** - only allows safe file types
- [ ] **API rate limiting** prevents abuse

### **📊 Database Integrity:**
- [ ] **No duplicate profiles** per user
- [ ] **Foreign key constraints** work correctly
- [ ] **Profile updates** don't create new records
- [ ] **Soft deletes** preserve data relationships
- [ ] **Indexes** improve query performance

---

## 🐛 **COMMON ISSUES TO TEST:**

### **Resume Parsing Edge Cases:**
- [ ] **Empty/corrupted files** - Should fail gracefully
- [ ] **Non-English resumes** - Should handle or skip
- [ ] **Very large files** - Should have size limits
- [ ] **Password-protected PDFs** - Should show error

### **Form Validation Edge Cases:**
- [ ] **Special characters** in names/company names
- [ ] **International phone numbers** 
- [ ] **Very long text inputs** - Should have limits
- [ ] **SQL injection attempts** - Should be sanitized

### **Matching Algorithm Edge Cases:**
- [ ] **Jobs with no skills listed** - Should still calculate score
- [ ] **Profiles with no skills** - Should handle gracefully
- [ ] **Identical job titles** - Should differentiate by company
- [ ] **Very new/old job postings** - Should respect date filters

---

## 📈 **SUCCESS METRICS:**

### **Onboarding Completion Rates:**
- [ ] **Job Seeker:** >80% complete all 6 steps
- [ ] **Employer:** >90% complete all 4 steps
- [ ] **Resume Upload:** >60% successfully parse

### **Matching Accuracy:**
- [ ] **High scores (4-5):** Should feel like strong matches
- [ ] **Low scores (1-2):** Should feel like poor matches
- [ ] **Email open rates:** >25% for match alerts

### **System Performance:**
- [ ] **Page load times:** <3 seconds
- [ ] **API response times:** <2 seconds
- [ ] **Resume parsing:** <10 seconds
- [ ] **Match calculations:** <1 second

---

## 🎯 **NEXT STEPS AFTER TESTING:**

1. **Fix any bugs** found during testing
2. **Run database migration** in production
3. **Set up cron job** for automated match alerts
4. **Configure email templates** in Resend
5. **Monitor analytics** for user behavior
6. **A/B test** onboarding flow improvements

---

**🚀 Ready to test? Start with the job seeker onboarding flow and work through each section systematically!**
