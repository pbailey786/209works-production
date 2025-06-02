# Web Share API Implementation

## Overview

The Job Detail Page implements the Web Share API to provide native sharing capabilities on supported devices and browsers. This enables users to share job listings through their device's native sharing interface.

## Implementation Details

### Location
File: `src/app/jobs/[id]/JobDetailClient.tsx`

### Code Example

```typescript
// Handle share job
const handleShare = async () => {
  setSharing(true);
  const shareData = {
    title: `${job.title} at ${job.company}`,
    text: `Check out this job opportunity: ${job.title} at ${job.company}`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Job link copied to clipboard!');
    }
  } catch (error) {
    console.error('Error sharing:', error);
  } finally {
    setSharing(false);
  }
};
```

## Share Data Structure

### Fields Included
- **title**: Job title and company name combination
- **text**: Descriptive text about the job opportunity
- **url**: Current page URL (job detail page)

### Example Share Data
```javascript
{
  title: "Senior Software Engineer at TechCorp",
  text: "Check out this job opportunity: Senior Software Engineer at TechCorp",
  url: "https://209jobs.com/jobs/abc123-def456-789"
}
```

## Browser Support

### Supported Platforms
- **Mobile Safari (iOS)**: Full native sharing support
- **Chrome Mobile (Android)**: Full native sharing support
- **Samsung Internet**: Full native sharing support
- **Edge Mobile**: Full native sharing support

### Desktop Browsers
- **Chrome Desktop (recent versions)**: Limited support
- **Edge Desktop**: Limited support
- **Firefox**: No support (uses fallback)
- **Safari Desktop**: No support (uses fallback)

## Fallback Strategy

### Clipboard API
When Web Share API is not available:
1. Uses `navigator.clipboard.writeText()` to copy the URL
2. Shows an alert confirmation message
3. Provides the same user experience across all browsers

### Error Handling
- Catches sharing cancellation (user closes share sheet)
- Handles permission denied errors
- Falls back to clipboard if sharing fails

## User Experience

### Visual Feedback
- **Loading State**: Button shows loading during share operation
- **Icon Consistency**: Share icon (ShareIcon from Heroicons)
- **Button State**: Disabled while sharing is in progress

### Share Button UI
```typescript
<button
  onClick={handleShare}
  disabled={sharing}
  className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition"
>
  <ShareIcon className="h-4 w-4 mr-2" />
  Share
</button>
```

## Security Considerations

### URL Safety
- Uses `window.location.href` for current page URL
- No user input in share data (prevents injection)
- Static text templates for title and description

### Permission Handling
- Respects user's sharing preferences
- Gracefully handles permission denials
- No sensitive data in share content

## Testing Strategy

### Feature Detection
```javascript
if (navigator.share) {
  // Use Web Share API
} else {
  // Use clipboard fallback
}
```

### Test Cases
1. **Native Share**: Test on mobile devices with Web Share API
2. **Clipboard Fallback**: Test on desktop browsers
3. **Error Scenarios**: Test with blocked permissions
4. **User Cancellation**: Test share sheet dismissal

### Browser Testing Matrix
| Browser | Platform | Web Share API | Clipboard API | Status |
|---------|----------|---------------|---------------|---------|
| Safari | iOS | ✅ | ✅ | Full Support |
| Chrome | Android | ✅ | ✅ | Full Support |
| Chrome | Desktop | ⚠️ | ✅ | Fallback |
| Firefox | Desktop | ❌ | ✅ | Fallback |
| Safari | Desktop | ❌ | ✅ | Fallback |

## Analytics Integration

### Share Event Tracking
Consider adding analytics to track sharing behavior:

```typescript
// Example analytics integration
const handleShare = async () => {
  setSharing(true);
  
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      // Track native share
      analytics.track('job_shared', { 
        method: 'native', 
        jobId: job.id 
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      // Track clipboard share
      analytics.track('job_shared', { 
        method: 'clipboard', 
        jobId: job.id 
      });
    }
  } catch (error) {
    // Track share errors
    analytics.track('job_share_error', { 
      error: error.message,
      jobId: job.id 
    });
  } finally {
    setSharing(false);
  }
};
```

## Future Enhancements

### Rich Media Sharing
- Add job company logo as `files` parameter
- Include job description as rich text
- Add structured data for better preview cards

### Custom Share Options
- Direct sharing to specific platforms (LinkedIn, Twitter)
- Email sharing with pre-filled subject and body
- SMS sharing for mobile recruitment

### Advanced Analytics
- Track which platforms users share to
- Measure share-to-application conversion rates
- A/B test different share messages

## Troubleshooting

### Common Issues

#### 1. Share API Not Working
- Check browser support
- Verify HTTPS connection (required for Web Share API)
- Test feature detection logic

#### 2. Clipboard Fallback Fails
- Ensure HTTPS connection (required for Clipboard API)
- Check browser permissions
- Verify user interaction requirement

#### 3. Share Sheet Doesn't Appear
- Confirm mobile browser support
- Test on actual device (not simulator)
- Check for JavaScript errors

### Debug Tools
```javascript
// Feature detection debugging
console.log('Web Share API supported:', !!navigator.share);
console.log('Clipboard API supported:', !!navigator.clipboard);

// Test share data validity
if (navigator.canShare) {
  console.log('Can share data:', navigator.canShare(shareData));
}
``` 