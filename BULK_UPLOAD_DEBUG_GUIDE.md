# Bulk Upload Debugging Guide

## 🔍 DEBUGGING THE BULK UPLOAD WORKFLOW

### **Current Workflow Steps:**

1. **File Upload** → `/api/employers/bulk-upload/process`
2. **AI Optimization** → `/api/employers/bulk-upload/optimize`
3. **Individual Approval** → JobApprovalModal component
4. **Job Publishing** → `/api/employers/bulk-upload/approve`

---

## 🧪 TESTING PROCEDURE

### **Step 1: Test File Upload & Processing**

1. Go to `/employers/bulk-upload`
2. Upload the test CSV file: `test-bulk-upload-debug.csv`
3. **Expected:** Status changes to "Processing File..."
4. **Check Browser Console** for any errors
5. **Expected Result:** Status changes to "AI Optimization in Progress..."

**If this fails:**

- Check browser console for JavaScript errors
- Verify file format matches expected CSV structure
- Check if user has credits available

### **Step 2: Test AI Optimization**

1. **Expected:** Status shows "AI Optimization in Progress..."
2. **Check Browser Console** for API call to `/api/employers/bulk-upload/optimize`
3. **Expected Result:** Status changes to "Ready for Approval!" and modal opens

**If this fails:**

- Check browser console for 401/403 errors (authentication)
- Check for 500 errors (server issues)
- Verify OpenAI API key is configured in environment variables
- Check if fallback optimization is working

### **Step 3: Test Approval Modal**

1. **Expected:** JobApprovalModal opens with job comparison
2. **Check:** Original vs AI-optimized content is displayed
3. **Check:** Progress bar shows "Job 1 of X"
4. **Check:** Credit counter shows remaining credits

**If this fails:**

- Check if `optimizedJobs` state is populated
- Verify modal props are passed correctly
- Check for React component errors in console

### **Step 4: Test Job Approval & Publishing**

1. Click "Approve & Publish" button
2. **Expected:** Job publishes successfully, credit deducted
3. **Expected:** Modal advances to next job or closes if last job
4. **Check:** Job appears in "My Jobs" list

**If this fails:**

- Check API call to `/api/employers/bulk-upload/approve`
- Verify credit deduction is working
- Check job creation in database

---

## 🐛 COMMON ISSUES & SOLUTIONS

### **Issue 1: Upload Gets Stuck at "Processing"**

**Symptoms:** Status stays at "Processing File..." indefinitely
**Causes:**

- CSV format issues (missing headers, malformed data)
- File size too large (>10MB)
- Server timeout

**Solutions:**

1. Check CSV file format matches template exactly
2. Reduce file size or number of jobs
3. Check server logs for processing errors

### **Issue 2: AI Optimization Fails**

**Symptoms:** Error message about AI optimization failure
**Causes:**

- OpenAI API key not configured
- OpenAI API rate limits exceeded
- Network connectivity issues

**Solutions:**

1. Verify `OPENAI_API_KEY` environment variable is set
2. Check OpenAI account has available credits
3. Fallback optimization should still work

### **Issue 3: Approval Modal Doesn't Open**

**Symptoms:** Status shows "Ready for Approval!" but no modal
**Causes:**

- JavaScript errors preventing modal render
- State management issues
- Component prop issues

**Solutions:**

1. Check browser console for React errors
2. Verify `showApprovalModal` state is true
3. Check if `optimizedJobs` array is populated

### **Issue 4: Job Publishing Fails**

**Symptoms:** "Approve & Publish" button doesn't work
**Causes:**

- Insufficient credits
- Invalid job data
- Database connection issues

**Solutions:**

1. Check user has available credits
2. Verify job data passes validation
3. Check API response for specific error messages

---

## 🔧 DEBUGGING TOOLS

### **Browser Console Commands:**

```javascript
// Check current upload status
console.log('Upload Status:', uploadStatus);

// Check processed jobs
console.log('Processed Jobs:', processedJobs);

// Check optimized jobs
console.log('Optimized Jobs:', optimizedJobs);

// Check user credits
console.log('User Credits:', userCredits);

// Check if approval modal should be open
console.log('Show Approval Modal:', showApprovalModal);
```

### **API Testing with curl:**

```bash
# Test file processing
curl -X POST http://localhost:3000/api/employers/bulk-upload/process \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-bulk-upload-debug.csv"

# Test AI optimization
curl -X POST http://localhost:3000/api/employers/bulk-upload/optimize \
  -H "Content-Type: application/json" \
  -d '{"jobs":[{"id":"1","title":"Test Job","company":"Test Co","location":"Stockton, CA","description":"Test description"}]}'
```

---

## 📋 VALIDATION CHECKLIST

### **Before Testing:**

- [ ] User is logged in as employer
- [ ] User has at least 1 credit available
- [ ] OpenAI API key is configured (check environment variables)
- [ ] Test CSV file is properly formatted

### **During Testing:**

- [ ] Browser console is open to monitor for errors
- [ ] Network tab is open to monitor API calls
- [ ] Each step completes before moving to next

### **After Testing:**

- [ ] Jobs appear in "My Jobs" list
- [ ] Credits are properly deducted
- [ ] No JavaScript errors in console
- [ ] All state is properly reset for next upload

---

## 🚨 EMERGENCY FALLBACKS

### **If AI Optimization Completely Fails:**

The system includes a fallback mechanism that:

1. Creates mock optimized jobs using original content
2. Still opens the approval modal for manual review
3. Allows users to edit content before publishing
4. Maintains the same credit usage and publishing flow

### **If Approval Modal Fails:**

Users can still:

1. Use the old bulk publish functionality (if available)
2. Copy job data and use individual job posting
3. Contact support for manual assistance

---

## 📞 SUPPORT ESCALATION

If debugging doesn't resolve the issue:

1. **Collect Error Information:**

   - Browser console errors
   - Network request/response details
   - User account details (credits, subscription status)
   - Exact steps that led to the issue

2. **Contact Support:**
   - Email: support@209.works
   - Include all collected error information
   - Specify "Bulk Upload Issue" in subject line
