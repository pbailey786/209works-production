# OpenAI API Setup for 209Jobs

## 🚀 Quick Setup Guide

Your 209Jobs application now has **intelligent job search** powered by OpenAI! Here's how to enable it:

### Step 1: Get Your OpenAI API Key

1. **Visit OpenAI Platform**: Go to [https://platform.openai.com](https://platform.openai.com)
2. **Sign Up/Login**: Create an account or sign in
3. **Navigate to API Keys**: Go to [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)
4. **Create New Key**: Click "Create new secret key"
5. **Copy the Key**: It will look like `sk-proj-...` (new format) or `sk-...` (old format)

### Step 2: Add API Key to Your Environment

1. **Open your `.env.local` file**
2. **Replace the placeholder**:
   ```bash
   # Change this line:
   OPENAI_API_KEY="sk-proj-placeholder-key-replace-with-your-actual-openai-api-key"
   
   # To your actual key:
   OPENAI_API_KEY="sk-proj-your-actual-key-here"
   ```
3. **Save the file**
4. **Restart your development server**:
   ```bash
   npm run dev
   ```

### Step 3: Test the AI Job Search

1. **Visit**: http://localhost:3001/jobs
2. **Try these searches**:
   - "Find nursing jobs in Stockton"
   - "Show me warehouse jobs near Tracy"
   - "What healthcare jobs pay over $80k?"
   - "Remote tech jobs in the 209 area"

## 🤖 How It Works

### With OpenAI API Key (Full AI Experience):
- **Smart Query Understanding**: AI interprets natural language searches
- **Intelligent Filtering**: Extracts location, job type, salary, etc. from conversational queries
- **Personalized Responses**: Generates contextual summaries and follow-up questions
- **Job Matching**: Analyzes job fit based on user profiles

### Without OpenAI API Key (Fallback Mode):
- **Basic Keyword Search**: Uses simple keyword matching
- **Standard Filtering**: Recognizes common terms like "Stockton", "nursing", "part-time"
- **Simple Responses**: Provides basic summaries and suggestions
- **Still Functional**: The site works perfectly, just without advanced AI features

## 💰 OpenAI Pricing

- **Free Tier**: $5 in free credits for new accounts
- **Pay-as-you-go**: Very affordable for development
- **Typical Usage**: A few cents per search query
- **Development**: Free tier should last months for testing

## 🔧 Features Enabled by OpenAI

### 1. **Conversational Job Search**
```
User: "I'm looking for entry-level healthcare jobs in Modesto that pay at least $20/hour"
AI: Understands location (Modesto), industry (healthcare), experience (entry-level), salary ($20/hour)
```

### 2. **Smart Follow-up Questions**
```
AI: "Would you like me to show you similar positions in nearby cities?"
AI: "Are you interested in part-time or full-time positions?"
AI: "Would you like to see jobs that offer benefits?"
```

### 3. **Contextual Responses**
```
AI: "I found 12 healthcare positions in Modesto. Most are at local hospitals and clinics, 
with 8 positions offering $20+ per hour. The entry-level roles include medical assistant, 
patient care technician, and administrative positions."
```

## 🛠️ Technical Implementation

The system automatically detects if you have a valid OpenAI API key:

```typescript
// Checks for valid API key
const hasValidApiKey = process.env.OPENAI_API_KEY && 
  process.env.OPENAI_API_KEY !== 'your-openai-key' && 
  process.env.OPENAI_API_KEY !== 'sk-proj-placeholder-key-replace-with-your-actual-openai-api-key';

if (hasValidApiKey) {
  // Use AI-powered search
  filters = await extractJobSearchFilters(userMessage, conversationHistory);
} else {
  // Use basic keyword search
  filters = extractBasicFilters(userMessage);
}
```

## 🚨 Security Notes

- **Never commit API keys**: The `.env.local` file is in `.gitignore`
- **Use environment variables**: Never hardcode keys in your source code
- **Rotate keys regularly**: Generate new keys periodically for security
- **Monitor usage**: Check your OpenAI dashboard for usage and costs

## 🎯 Next Steps

1. **Get your API key** and add it to `.env.local`
2. **Test the AI search** with various queries
3. **Customize the prompts** in `src/lib/llm/` if needed
4. **Deploy to production** with environment variables set

## 🆘 Troubleshooting

### "Invalid API key" error:
- Check that your key starts with `sk-` or `sk-proj-`
- Ensure no extra spaces or quotes
- Restart your development server

### "Rate limit exceeded":
- You've hit OpenAI's usage limits
- Wait a few minutes or upgrade your plan

### Search not working:
- Check the browser console for errors
- Verify the API key is correctly set
- The fallback mode should still work without OpenAI

## 🎉 Success!

Once configured, your 209Jobs platform will have:
- **Intelligent job search** that understands natural language
- **Contextual responses** that feel conversational
- **Smart suggestions** for follow-up searches
- **Professional AI experience** for your users

The hyper-local 209 focus combined with AI-powered search creates a unique and powerful job platform for the Central Valley! 🚀
