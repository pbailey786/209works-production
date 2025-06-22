# Chat History & Data Cleanup Implementation

## 🎯 Overview

This implementation addresses three key issues:

1. **Chat History for Job Seekers** - Limited storage with automatic cleanup
2. **Fake Data Removal** - Clean up test/fake data from employer dashboard
3. **Job Application Debugging** - Tools to investigate missing applications

## 🗄️ Database Changes

### New ChatHistory Model

Added to `prisma/schema.prisma`:

```prisma
model ChatHistory {
  id           String   @id @default(uuid())
  userId       String
  sessionId    String
  title        String?  // Optional title for the conversation
  messages     Json     // Array of messages in the conversation
  lastActivity DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([sessionId])
  @@index([lastActivity])
  @@index([createdAt])
}
```

### User Model Update

Added `chatHistory` relation to User model.

## 🔧 Features Implemented

### Chat History System

- **Storage Limit**: Maximum 10 conversations per user
- **Auto-cleanup**: Oldest conversations automatically deleted when limit reached
- **Authenticated Only**: Only logged-in users get chat history saved
- **Anonymous Users**: No chat history saved for non-authenticated users

### API Endpoints

#### `/api/chat-history`

- **GET**: Retrieve user's chat history
- **POST**: Save/update conversation
- **DELETE**: Delete specific conversation

#### Modified `/api/chat-job-search`

- Now automatically saves chat history for authenticated users
- Integrates with existing analytics system

### React Component

**`src/components/chat/ChatHistory.tsx`**

- Displays user's conversation history
- Expandable conversation previews
- Load previous conversations
- Delete conversations
- Responsive design with loading states

## 🧹 Data Cleanup Tools

### Cleanup Script

**`scripts/cleanup-test-data.js`**

Removes:
- Test jobs with fake titles ("Paul's first job yay", etc.)
- Jobs from test sources
- Test user accounts
- Orphaned job applications
- Identifies suspicious patterns

### Debug Script

**`scripts/debug-job-applications.js`**

Analyzes:
- All jobs and their application counts
- Job applications and their relationships
- Employer-job relationships
- Orphaned data
- Missing employer assignments

## 🚀 Deployment Steps

### 1. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes (production)
npx prisma db push
```

### 2. Run Cleanup (Optional)

```bash
# Debug current state first
node scripts/debug-job-applications.js

# Clean up test data
node scripts/cleanup-test-data.js
```

### 3. Verify Changes

Check that:
- Chat history is being saved for authenticated users
- Fake data has been removed from employer dashboard
- Job applications are properly linked to employers

## 🔍 Troubleshooting Job Applications

### Common Issues

1. **Jobs without employerId**: Jobs not linked to employer accounts
2. **Orphaned applications**: Applications for deleted jobs
3. **Role mismatches**: Users with wrong roles

### Debug Process

1. Run debug script: `node scripts/debug-job-applications.js`
2. Check employer-job relationships
3. Verify job application API endpoints
4. Test application submission flow

## 📱 Usage Examples

### Chat History Component

```tsx
import ChatHistory from '@/components/chat/ChatHistory';

// In job seeker dashboard
<ChatHistory 
  onLoadConversation={(conversation) => {
    // Load conversation into chat interface
    setCurrentConversation(conversation);
  }}
  className="w-full max-w-md"
/>
```

### API Usage

```javascript
// Get chat history
const response = await fetch('/api/chat-history');
const { conversations } = await response.json();

// Save conversation
await fetch('/api/chat-history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-123',
    messages: [...],
    title: 'Job search conversation'
  })
});

// Delete conversation
await fetch('/api/chat-history?id=conv-123', {
  method: 'DELETE'
});
```

## 🔒 Security & Privacy

- Chat history only accessible by conversation owner
- Automatic cleanup prevents unlimited data growth
- Anonymous users have no persistent data
- Secure session management

## 📊 Monitoring

### Analytics Integration

- Chat analytics continue to work alongside history
- Performance metrics for conversation storage
- User engagement tracking

### Database Performance

- Indexed queries for efficient retrieval
- Automatic cleanup prevents table bloat
- Optimized for read-heavy workloads

## 🎯 Next Steps

1. **Deploy database changes** to production
2. **Run cleanup scripts** to remove fake data
3. **Test chat history** with authenticated users
4. **Monitor application flow** for employers
5. **Add chat history UI** to job seeker dashboard

## 🐛 Known Issues

- Local development requires DATABASE_URL environment variable
- TypeScript execution issues with some Node.js configurations (use .js versions of scripts)
- Chat history UI needs integration into main chat interface

## 📞 Support

If you encounter issues:

1. Check database connection and environment variables
2. Run debug scripts to identify data issues
3. Verify user roles and permissions
4. Test API endpoints individually
