#!/bin/bash

echo "🚀 Setting up chat history feature..."

# 1. Generate Prisma client with new schema
echo "📦 Generating Prisma client..."
npx prisma generate

# 2. Push schema changes to database
echo "🗄️ Updating database schema..."
npx prisma db push

# 3. Run cleanup script to remove test data
echo "🧹 Cleaning up test data..."
npx ts-node scripts/cleanup-test-data.ts

echo "✅ Chat history setup completed!"
echo ""
echo "📋 What was done:"
echo "  • Added ChatHistory model to database"
echo "  • Updated Prisma schema"
echo "  • Added chat history API endpoints"
echo "  • Modified chat API to save conversations for authenticated users"
echo "  • Cleaned up test/fake data from database"
echo ""
echo "🔧 Features added:"
echo "  • Chat history limited to 10 conversations per user"
echo "  • Automatic cleanup of oldest conversations when limit reached"
echo "  • Only authenticated users get chat history saved"
echo "  • Anonymous users don't have conversations saved"
echo ""
echo "🌐 API endpoints available:"
echo "  • GET /api/chat-history - Get user's chat history"
echo "  • POST /api/chat-history - Save/update conversation"
echo "  • DELETE /api/chat-history?id=<id> - Delete conversation"
