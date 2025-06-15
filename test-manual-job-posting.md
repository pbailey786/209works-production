# Manual Job Posting Test Guide

## Test Scenario: Manual "Write Manually" Job Posting

### Prerequisites
1. User must be logged in as an employer
2. User must have at least 1 credit available
3. Access to Job Post Optimizer page

### Test Steps

#### 1. Navigate to Job Post Optimizer
- Go to `/employers/create-job-post`
- Fill in basic information:
  - Job Title: "Customer Service Representative"
  - Company Name: "Test Company Inc."
  - Location: "Stockton, CA"
  - Pay Rate: "$18-22/hour"

#### 2. Choose Manual Option
- Select "✏️ Write Manually" radio button
- Click "Continue" button
- Should skip AI generation and go directly to manual editing

#### 3. Write Manual Content
- In the text editor, write at least 50 characters of job description:
```
We are seeking a friendly and professional Customer Service Representative to join our team in Stockton. 

Responsibilities:
- Answer customer inquiries via phone and email
- Resolve customer issues and complaints
- Process orders and returns
- Maintain accurate customer records

Requirements:
- High school diploma or equivalent
- Excellent communication skills
- Previous customer service experience preferred
- Ability to work in a fast-paced environment

Benefits:
- Competitive hourly wage ($18-22/hour)
- Health insurance
- Paid time off
- Flexible scheduling

To apply, please send your resume to jobs@testcompany.com or call (209) 555-0123.
```

#### 4. Validate Content
- Check that character count shows 500+ characters
- Verify "✓ Ready to publish" indicator appears
- Ensure no validation warnings are shown

#### 5. Publish Job
- Click "Publish Job Post" button
- Should show "Publishing..." state
- Should successfully publish and redirect to job listing

### Expected Results

#### ✅ Success Criteria
1. **Credit Deduction**: 1 credit should be deducted from user account
2. **Job Creation**: Job should be created in database with:
   - Title: "Customer Service Representative"
   - Company: "Test Company Inc."
   - Location: "Stockton, CA"
   - Description: Manual content entered
   - Status: "active"
   - Source: "job_post_optimizer"
3. **Redirect**: User should be redirected to `/employers/my-jobs?published={jobId}`
4. **No Errors**: No error messages should appear

#### ❌ Failure Scenarios to Test
1. **Insufficient Credits**: Should show credit error and redirect to dashboard
2. **Empty Content**: Should show validation error about minimum 50 characters
3. **Missing Required Fields**: Should show specific field validation errors

### Error Testing

#### Test 1: No Credits
- Remove all credits from user account
- Try to publish job
- Expected: "Job posting credits required" error

#### Test 2: Empty Description
- Leave manual content empty or under 50 characters
- Try to publish job
- Expected: "Job description is required and must be at least 50 characters" error

#### Test 3: Missing Basic Info
- Leave job title, company, or location empty
- Try to publish job
- Expected: Specific field validation errors

### Verification Steps

#### After Successful Publication
1. Check user's credit count (should be reduced by 1)
2. Verify job appears in "My Jobs" list
3. Check job details page shows correct information
4. Confirm job is searchable on main jobs page
5. Verify job URL is accessible: `/jobs/{jobId}`

### API Endpoints Involved
- `POST /api/job-post-optimizer` (create optimizer record)
- `POST /api/job-post-optimizer/{id}/publish` (publish job)
- Credit validation via `JobPostingCreditsService.canPostJob()`
- Credit usage via `JobPostingCreditsService.useJobPostCredit()`

### Database Changes
- New record in `jobPostOptimizer` table
- New record in `job` table
- Credit marked as used in `jobPostingCredit` table
