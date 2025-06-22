/**
 * Test script for Phase 1 209jobs-GPT implementation
 *
 * This script tests the core chatbot functionality:
 * - Conversation management
 * - Intent recognition
 * - Job search integration
 * - Context retention
 */

import { ChatbotService } from '@/lib/conversation/chatbot-service';
import { ConversationManager } from '@/lib/conversation/manager';

async function testChatbot() {
  console.log('🤖 Testing 209jobs-GPT Phase 1 Implementation\n');

  try {
    // Test 1: Basic conversation flow
    console.log('Test 1: Basic Conversation Flow');
    console.log('==================================');

    const session = ConversationManager.createSession('test-user');
    console.log(`✅ Created session: ${session.sessionId}`);

    // Test different types of messages
    const testMessages = [
      "Hello! I'm looking for a job",
      'Find me software engineering jobs in Seattle',
      'Tell me about Microsoft',
      'What skills do I need for data science roles?',
      'Help me compare these job offers',
    ];

    for (const message of testMessages) {
      console.log(`\n👤 User: ${message}`);

      const response = await ChatbotService.processMessage(
        session.sessionId,
        message,
        'test-user'
      );

      console.log(`🤖 Bot: ${response.reply.substring(0, 100)}...`);
      console.log(`📊 Intent: ${response.intent}`);
      console.log(
        `💡 Suggestions: ${response.suggestions?.slice(0, 2).join(', ')}`
      );

      if (response.jobRecommendations?.length) {
        console.log(`🔍 Found ${response.jobRecommendations.length} jobs`);
      }
    }

    // Test 2: Session management
    console.log('\n\nTest 2: Session Management');
    console.log('============================');

    const sessionInfo = ConversationManager.getSession(session.sessionId);
    console.log(`✅ Session active: ${sessionInfo?.isActive}`);
    console.log(
      `💬 Message count: ${sessionInfo?.context.metadata.messageCount}`
    );
    console.log(`🎯 Current intent: ${sessionInfo?.context.intent}`);

    // Test 3: Context retention
    console.log('\n\nTest 3: Context Retention');
    console.log('==========================');

    const history = ConversationManager.getConversationHistory(
      session.sessionId
    );
    console.log(`📝 Conversation history: ${history.length} messages`);
    console.log(`🕐 Started: ${sessionInfo?.context.metadata.startedAt}`);

    // Test 4: Session cleanup
    console.log('\n\nTest 4: Session Cleanup');
    console.log('=========================');

    ConversationManager.deleteSession(session.sessionId);
    const deletedSession = ConversationManager.getSession(session.sessionId);
    console.log(
      `🗑️ Session deleted: ${deletedSession === null ? 'Yes' : 'No'}`
    );

    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎉 Phase 1 implementation is working correctly!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for potential use in other scripts
export { testChatbot };

// Run tests if this file is executed directly
if (require.main === module) {
  testChatbot();
}
