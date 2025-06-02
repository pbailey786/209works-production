import 'dotenv/config'; // Explicitly load .env variables

/**
 * Test script for Phase 2 Company Knowledge Integration
 * 
 * This script tests:
 * - Company knowledge retrieval
 * - Enhanced company conversations in chatbot
 * - Knowledge-based responses
 * - Integration with existing job search
 */

import { ChatbotService } from '@/lib/conversation/chatbot-service';
import { ConversationManager } from '@/lib/conversation/manager';
import { CompanyKnowledgeService } from '@/lib/knowledge/company-knowledge';
import { CompanyKnowledgeCategory } from '@prisma/client';

async function testPhase2Chatbot() {
  console.log('🤖 Testing Phase 2: Company Knowledge Integration\n');

  try {
    // Test 1: Company Knowledge Service
    console.log('Test 1: Company Knowledge Service');
    console.log('=====================================');
    
    // Get companies with knowledge base
    const companiesFromJobs = await CompanyKnowledgeService.getCompaniesFromJobs();
    console.log(`✅ Found ${companiesFromJobs.length} companies in database`);
    
    if (companiesFromJobs.length > 0) {
      const testCompany = companiesFromJobs[0].name;
      console.log(`\nTesting with company: ${testCompany}`);
      
      const companyInfo = await CompanyKnowledgeService.getCompanyInfo(testCompany);
      if (companyInfo) {
        console.log(`✅ Company knowledge retrieved: ${companyInfo.knowledgeEntries.length} entries`);
        companyInfo.knowledgeEntries.forEach(entry => {
          console.log(`   - [${entry.category}] ${entry.title}`);
        });
      } else {
        console.log(`❌ No knowledge base found for ${testCompany}`);
      }
    }

    // Test 2: Enhanced Company Conversations
    console.log('\n\nTest 2: Enhanced Company Conversations');
    console.log('======================================');
    
    const session = ConversationManager.createSession('test-user-phase2');
    console.log(`✅ Created session: ${session.sessionId}`);

    // Test company-focused conversations
    const companyTestMessages = [
      "Tell me about the culture at Amazon",
      "What benefits does Microsoft offer?", 
      "How is the interview process at Google?",
      "What's the remote work policy at Apple?",
      "Tell me about working at Tesla"
    ];

    for (const message of companyTestMessages) {
      console.log(`\n👤 User: ${message}`);
      
      try {
        const response = await ChatbotService.processMessage(
          session.sessionId,
          message,
          'test-user-phase2'
        );
        
        console.log(`🤖 Bot: ${response.reply.substring(0, 150)}...`);
        console.log(`📊 Intent: ${response.intent}`);
        
        if (response.jobRecommendations?.length) {
          console.log(`🔍 Found ${response.jobRecommendations.length} related jobs`);
        }
        
        // Check if company info was included
        const hasCompanyInfo = response.reply.toLowerCase().includes('culture') || 
                              response.reply.toLowerCase().includes('benefit') || 
                              response.reply.toLowerCase().includes('interview') ||
                              response.reply.toLowerCase().includes('remote');
        
        if (hasCompanyInfo) {
          console.log(`✅ Response includes company-specific information`);
        } else {
          console.log(`⚠️  Response may be generic (no specific company info detected)`);
        }
        
      } catch (error) {
        if (error instanceof Error) {
          console.error(`❌ Error processing message: ${error.message}`);
        } else {
          console.error('❌ Error processing message: An unknown error occurred');
        }
      }
    }

    // Test 3: Knowledge Base Search
    console.log('\n\nTest 3: Knowledge Base Search');
    console.log('==============================');
    
    if (companiesFromJobs.length > 0) {
      const testCompany = companiesFromJobs[0].name;
      
      const searchTests = [
        { query: 'culture', category: undefined as CompanyKnowledgeCategory | undefined },
        { query: 'benefits', category: undefined as CompanyKnowledgeCategory | undefined },
        { query: '', category: 'hiring_process' as CompanyKnowledgeCategory },
        { query: 'remote work', category: undefined as CompanyKnowledgeCategory | undefined }
      ];
      
      for (const test of searchTests) {
        const results = await CompanyKnowledgeService.searchCompanyKnowledge(
          testCompany, 
          { query: test.query, category: test.category }
        );
        
        const searchDesc = test.query ? `"${test.query}"` : `category: ${test.category}`;
        console.log(`🔍 Search ${searchDesc}: ${results.length} results`);
        
        results.forEach(result => {
          console.log(`   - [${result.category}] ${result.title} (${result.views} views)`);
        });
      }
    }

    // Test 4: Analytics
    console.log('\n\nTest 4: Knowledge Analytics');
    console.log('============================');
    
    // Get company knowledge analytics for first company
    if (companiesFromJobs.length > 0) {
      const testCompany = companiesFromJobs[0].name;
      const companyInfo = await CompanyKnowledgeService.getCompanyInfo(testCompany);
      
      if (companyInfo) {
        const analytics = await CompanyKnowledgeService.getCompanyKnowledgeAnalytics(companyInfo.id);
        
        if (analytics) {
          console.log(`📊 Analytics for ${testCompany}:`);
          console.log(`   Total entries: ${analytics.totalEntries}`);
          console.log(`   Total views: ${analytics.totalViews}`);
          console.log(`   By category:`);
          
          analytics.byCategory.forEach((cat: any) => {
            console.log(`     - ${cat.category}: ${cat.entryCount} entries, ${cat.totalViews} views`);
          });
        }
      }
    }

    // Test 5: Integration Test - Full Conversation Flow
    console.log('\n\nTest 5: Full Conversation Flow');
    console.log('===============================');
    
    const fullSession = ConversationManager.createSession('integration-test');
    const conversationFlow = [
      "Hi, I'm looking for a tech job",
      "Tell me about Amazon's culture",
      "Do they have good benefits?",
      "What's their hiring process like?",
      "Show me software engineering jobs at Amazon",
      "How does Amazon compare to Microsoft?"
    ];
    
    for (const message of conversationFlow) {
      console.log(`\n👤 User: ${message}`);
      
      const response = await ChatbotService.processMessage(
        fullSession.sessionId,
        message,
        'integration-test'
      );
      
      console.log(`🤖 Bot: ${response.reply.substring(0, 120)}...`);
      console.log(`📊 Intent: ${response.intent}`);
      
      if (response.suggestions?.length) {
        console.log(`💡 Suggestions: ${response.suggestions.slice(0, 2).join(', ')}`);
      }
    }

    console.log('\n🎉 Phase 2 Testing Complete!');
    console.log('\nKey Features Tested:');
    console.log('✅ Company knowledge retrieval');
    console.log('✅ Enhanced company conversations');
    console.log('✅ Knowledge-based AI responses');
    console.log('✅ Search and analytics');
    console.log('✅ Integration with job search');

  } catch (error) {
    console.error('❌ Phase 2 test error:', error);
  }
}

// Helper function to simulate company knowledge setup if needed
async function ensureTestData() {
  console.log('🔧 Ensuring test data exists...');
  
  try {
    // Check for one of the known sample companies and its knowledge
    const testCompanyName = "AlphaCorp"; 
    const companyInfo = await CompanyKnowledgeService.getCompanyInfo(testCompanyName);
    
    if (!companyInfo) {
      console.log(`⚠️ Test company '${testCompanyName}' not found. Run setup-company-knowledge.ts again.`);
      return false;
    }
    
    if (!companyInfo.knowledgeEntries || companyInfo.knowledgeEntries.length === 0) {
      console.log(`⚠️ No knowledge entries found for '${testCompanyName}'. Run setup-company-knowledge.ts again.`);
      return false;
    }
    
    console.log('✅ Test data is ready');
    return true;
    
  } catch (error) {
    console.error('❌ Error checking test data:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  ensureTestData().then(ready => {
    if (ready) {
      testPhase2Chatbot().catch(console.error);
    } else {
      console.log('\n🛠️  Please run the setup script first:');
      console.log('   npm run setup:company-knowledge');
    }
  });
}

export { testPhase2Chatbot, ensureTestData }; 