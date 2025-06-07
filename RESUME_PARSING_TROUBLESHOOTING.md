# Resume Parsing Troubleshooting Guide

## Overview
This guide helps diagnose and fix issues with resume parsing during job seeker onboarding.

## Quick Diagnosis

### 1. Test Page Access
Visit: `/test-resume-parsing` (while signed in) to test resume parsing with detailed debug information.

### 2. Environment Check
Visit: `/api/debug/env-check` to verify environment variables are properly configured.

## Common Issues and Solutions

### Issue 1: "No file provided" Error

**Symptoms:**
- Error appears immediately when uploading
- File seems to upload but parsing fails

**Causes:**
- File input field is not sending data properly
- Form data is malformed

**Solution:**
```javascript
// Ensure form data is properly constructed
const formData = new FormData();
formData.append('resume', file); // 'resume' is the expected field name
```

### Issue 2: "File validation failed" Error

**Symptoms:**
- Error: "Currently only DOCX and DOC files are supported"
- Error: "File too large. Maximum size is 5MB"

**Causes:**
- User uploaded PDF file (not yet supported)
- File exceeds 5MB limit
- File has incorrect MIME type

**Solutions:**
- Convert PDF to DOCX format
- Compress file to under 5MB
- Ensure file is saved as .docx or .doc

**Supported formats:**
- `.docx` (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- `.doc` (application/msword)

### Issue 3: "OpenAI API key not configured" Error

**Symptoms:**
- Error appears during parsing step
- Debug shows: "OPENAI_API_KEY environment variable is missing"

**Solution:**
Add OpenAI API key to your environment variables:

```bash
# .env.local
OPENAI_API_KEY=sk-...your-openai-api-key
```

**Verify key format:**
- Should start with `sk-` or `sk-proj-`
- Should be at least 20 characters long

### Issue 4: "Could not extract text from resume" Error

**Symptoms:**
- File uploads successfully but no text is extracted
- Debug shows: "Text extraction failed"

**Possible Causes:**
1. **Corrupted DOCX file**
2. **Empty or image-only resume**
3. **Mammoth library issue**

**Solutions:**
1. **Try a different file:** Test with a simple text-based DOCX resume
2. **Check file content:** Ensure resume contains actual text (not just images)
3. **Recreate file:** Copy content to a new Word document and save as DOCX

### Issue 5: "Failed to parse AI response as JSON" Error

**Symptoms:**
- Text extraction succeeds but JSON parsing fails
- Debug shows raw AI response that's not valid JSON

**Causes:**
- OpenAI returned malformed JSON
- Response was truncated
- AI model hallucinated invalid format

**Solutions:**
1. **Retry the request:** Sometimes temporary AI issue
2. **Check token limits:** Ensure resume isn't too long
3. **Simplify resume:** Remove complex formatting that might confuse AI

### Issue 6: "Failed to parse resume with AI" Error

**Symptoms:**
- No response from OpenAI API
- Debug shows: "No response content"

**Causes:**
- OpenAI API quota exceeded
- API key invalid or expired
- Network connectivity issues
- OpenAI service downtime

**Solutions:**
1. **Check API quota:** Verify OpenAI account has available credits
2. **Verify API key:** Test key with OpenAI directly
3. **Check OpenAI status:** Visit status.openai.com
4. **Retry later:** May be temporary service issue

## Debug Information

### Using the Test Page

1. Go to `/test-resume-parsing`
2. Upload a DOCX resume
3. Click "Test with Debug Info"
4. Review the debug output:

```json
{
  "debug": {
    "step": "text_extraction", // Shows where it failed
    "details": {
      "error": "Specific error message",
      "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
  }
}
```

### Debug Steps Explained

1. **file_validation**: Checks file type and size
2. **openai_config**: Verifies OpenAI API key exists
3. **text_extraction**: Extracts text from DOCX using mammoth
4. **openai_call**: Sends text to OpenAI for parsing
5. **json_parsing**: Converts AI response to structured data
6. **complete**: All steps successful

### Console Logs

Check browser console and server logs for additional information:

```
🔍 DEBUG: File received: { name: "resume.docx", type: "application/vnd...", size: 245760 }
✅ DEBUG: File validation passed
🔍 Starting text extraction...
✅ Text extraction successful: { textLength: 1245, preview: "John Doe Software Engineer..." }
🤖 Starting OpenAI parsing...
✅ OpenAI response received: { responseLength: 245, preview: '{"name":"John Doe"...' }
```

## Environment Configuration

### Required Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-...                    # Required for AI parsing
DATABASE_URL=postgresql://...            # Required for user data
NEXTAUTH_SECRET=your-secret              # Required for auth
```

### Check Configuration

Visit `/api/debug/env-check` to verify all environment variables are properly set.

## Production Considerations

### 1. Error Handling
The system gracefully falls back to manual entry if parsing fails.

### 2. Rate Limiting
OpenAI API calls are rate-limited. Consider implementing queue for high traffic.

### 3. File Storage
Resume files are stored in `/public/uploads/resumes/` directory.

### 4. Security
- Files are validated before processing
- API endpoints require authentication
- Debug endpoints are restricted in production

## Fallback Options

If resume parsing consistently fails:

1. **Manual Entry**: Users can skip resume upload and fill forms manually
2. **PDF Support**: Coming soon - implement PDF-to-text extraction
3. **Alternative Parsers**: Consider other document parsing libraries

## Support

If issues persist:

1. Check server logs for detailed error messages
2. Verify all dependencies are installed (`npm install`)
3. Test with a simple, text-only DOCX file
4. Contact development team with debug output from test page

## Recent Changes

- Added comprehensive debug logging
- Created test page for troubleshooting
- Improved error messages with specific guidance
- Added environment variable validation 