# Bulk Upload Test Plan

## Prerequisites
1. User must be logged in as an employer
2. User must have at least 1 credit available
3. Development server running on localhost:3000

## Test Cases

### Test 1: Basic CSV Upload and Processing
1. Go to `/employers/bulk-upload`
2. Download the CSV template
3. Upload the test file `test-bulk-upload.csv`
4. **Expected**: File processes successfully, shows processing results
5. **Verify**: 
   - Status shows "Upload Complete!"
   - Processing results show successful/warning/error counts
   - Individual jobs are listed with status indicators

### Test 2: AI Optimization Workflow
1. After successful file upload (Test 1)
2. Click "AI Optimize & Review" button
3. **Expected**: 
   - Status changes to "AI Optimization in Progress..."
   - JobApprovalModal opens showing first job
   - Can see original vs optimized content
4. **Verify**:
   - Progress bar shows "Job 1 of X"
   - Can toggle between original and optimized content
   - Edit functionality works
   - Credit counter shows remaining credits

### Test 3: Individual Job Approval
1. In the JobApprovalModal (from Test 2)
2. Review the job content
3. Click "Approve & Publish"
4. **Expected**:
   - Job publishes successfully
   - Credit is deducted
   - Modal advances to next job or closes if last job
5. **Verify**:
   - Success message appears
   - Credit count decreases by 1
   - Job appears in "My Jobs" list

### Test 4: Job Editing in Approval Modal
1. In the JobApprovalModal
2. Click "Edit Content"
3. Modify the job description
4. Click "Approve & Publish"
5. **Expected**: 
   - Edited content is used for publishing
   - Job publishes with custom content

### Test 5: Skip Job Functionality
1. In the JobApprovalModal
2. Click "Skip This Job"
3. **Expected**: 
   - Modal advances to next job without publishing
   - No credit is deducted
   - Skipped job is not published

### Test 6: Direct Bulk Publish (No AI)
1. After successful file upload
2. Click "Publish All" button (bypasses AI optimization)
3. **Expected**:
   - All valid jobs publish immediately
   - Credits deducted for all jobs
   - Success message shows count of published jobs

### Test 7: Error Handling - Invalid CSV
1. Create a CSV file with missing required columns
2. Upload the file
3. **Expected**:
   - Clear error message about missing columns
   - No jobs are processed
   - User can try again with corrected file

### Test 8: Error Handling - Insufficient Credits
1. Upload a CSV with more jobs than available credits
2. Try to publish
3. **Expected**:
   - Error message about insufficient credits
   - Option to purchase more credits
   - No jobs are published

### Test 9: Malformed CSV Data
1. Create a CSV with malformed rows (unmatched quotes, etc.)
2. Upload the file
3. **Expected**:
   - File processes with error status for malformed rows
   - Valid rows still process successfully
   - Clear error messages for each problematic row

### Test 10: AI Optimization Fallback
1. Upload CSV when OpenAI API is unavailable/fails
2. Click "AI Optimize & Review"
3. **Expected**:
   - Fallback template optimization is used
   - Modal still opens for review
   - User can still approve/edit jobs
   - Warning message about AI failure

## CSV Test File Format
```csv
title,company,location,description,jobType,salary,requirements,benefits,experienceLevel,remote
"Software Engineer","Tech Solutions Inc.","Stockton, CA","We are looking for a software engineer...","full-time","$85,000 - $110,000","5+ years experience...","Health insurance, 401k","senior","Yes"
"Marketing Manager","Central Valley Marketing","Modesto, CA","Join our dynamic marketing team...","Full-time","$65,000 - $80,000","3+ years marketing experience...","Health insurance, PTO","mid-level","No"
```

## Success Criteria
- All test cases pass without errors
- User can successfully upload, optimize, and publish jobs
- Credit system works correctly
- Error handling is graceful and informative
- UI provides clear feedback at each step
