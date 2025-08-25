#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test queries that should trigger enhanced company data responses
const testQueries = [
  'What is your company location?',
  'Tell me about your data management policies',
  'What are your business hours?',
  'Who are your team members?',
  'What services do you offer?',
  'How do you handle data security?',
  'What is your company address?',
  'Tell me about your pricing',
  'What are your contact details?',
  'How can I reach your support team?'
];

async function testCompanyQueries() {
  console.log('🧪 Testing Enhanced Company Data Responses\n');

  try {
    // First, create a new chat session
    console.log('📝 Creating new chat session...');
    const sessionResponse = await axios.post(`${API_BASE}/chat/session`);
    const sessionId = sessionResponse.data.data.sessionId;
    console.log(`✅ Session created: ${sessionId}\n`);

    // Test each query
    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`🔍 Testing Query ${i + 1}: "${query}"`);
      
      try {
        const response = await axios.post(`${API_BASE}/chat/message`, {
          message: query,
          sessionId: sessionId
        });

        const aiResponse = response.data.data;
        console.log(`✅ Response received (${aiResponse.message.length} chars)`);
        console.log(`📊 Metadata:`, {
          contextUsed: aiResponse.metadata.contextUsed,
          isCompanyQuery: aiResponse.metadata.isCompanyQuery,
          responseTime: aiResponse.metadata.responseTime + 'ms'
        });
        
        // Show first 200 characters of response
        const preview = aiResponse.message.substring(0, 200) + '...';
        console.log(`📄 Response Preview: ${preview}`);
        console.log('─'.repeat(80));
        
        // Wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error testing query: ${error.message}`);
      }
    }

    console.log('\n🎉 Company data query testing completed!');
    console.log('\n📋 Summary:');
    console.log('- Enhanced AI responses should include comprehensive company information');
    console.log('- Metadata should show contextUsed > 0 and isCompanyQuery = true');
    console.log('- Responses should be detailed and informative');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm start');
    }
  }
}

// Run the test
testCompanyQueries();
