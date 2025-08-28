#!/usr/bin/env node

/**
 * Test script to verify real-time data updates in Gemini AI service
 * This script tests that when FAQ or Company Data is updated in the admin dashboard,
 * the Gemini AI service immediately uses the updated information.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Import models and services
const FAQ = require('./backend/models/FAQ');
const CompanyData = require('./backend/models/CompanyData');
const User = require('./backend/models/User');
const { getFreshContextData, generateResponse } = require('./backend/utils/geminiService');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-customer-support',
  testQuery: 'Who is the CEO?',
  testFAQ: {
    question: 'Who is the CEO of our company?',
    answer: 'The CEO is John Smith, who founded the company in 2020.',
    category: 'Company Leadership',
    priority: 10
  },
  updatedFAQ: {
    answer: 'The CEO is Jane Doe, who took over leadership in 2024 and has been driving innovation.',
  },
  testCompanyData: {
    title: 'Company Leadership Information',
    content: 'Our company is led by CEO Michael Johnson, who has 15 years of experience in the industry.',
    category: 'Leadership',
    type: 'document',
    priority: 9
  },
  updatedCompanyData: {
    content: 'Our company is led by CEO Sarah Wilson, who joined us in 2024 with extensive background in AI and technology.',
  }
};

let testUserId;
let testFAQId;
let testCompanyDataId;

async function connectDB() {
  try {
    await mongoose.connect(TEST_CONFIG.mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestUser() {
  try {
    // Find or create a test admin user
    let testUser = await User.findOne({ username: 'test-admin' });
    
    if (!testUser) {
      testUser = new User({
        username: 'test-admin',
        email: 'test-admin@example.com',
        password: 'password123',
        role: 'admin'
      });
      await testUser.save();
      console.log('✅ Created test admin user');
    }
    
    testUserId = testUser._id;
    return testUser;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

async function createTestData() {
  try {
    console.log('\n🔧 Creating test data...');
    
    // Create test FAQ
    const testFAQ = new FAQ({
      ...TEST_CONFIG.testFAQ,
      createdBy: testUserId,
      isActive: true
    });
    await testFAQ.save();
    testFAQId = testFAQ._id;
    console.log('✅ Created test FAQ:', testFAQ.question);
    
    // Create test Company Data
    const testCompanyData = new CompanyData({
      ...TEST_CONFIG.testCompanyData,
      createdBy: testUserId,
      isActive: true
    });
    await testCompanyData.save();
    testCompanyDataId = testCompanyData._id;
    console.log('✅ Created test Company Data:', testCompanyData.title);
    
    // Wait a moment for database to sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

async function testInitialResponse() {
  try {
    console.log('\n🧪 Testing initial AI response...');
    
    // Get fresh context data
    const context = await getFreshContextData(TEST_CONFIG.testQuery, 6);
    console.log(`📊 Found ${context.length} context items`);
    
    // Create a mock conversation
    const messages = [
      { content: TEST_CONFIG.testQuery, sender: 'user', timestamp: new Date() }
    ];
    
    // Generate AI response
    const response = await generateResponse(messages, context, true);
    
    console.log('🤖 Initial AI Response:');
    console.log(response.content);
    console.log('\n📈 Response Metadata:', response.metadata);
    
    return response;
  } catch (error) {
    console.error('❌ Error testing initial response:', error);
    throw error;
  }
}

async function updateTestData() {
  try {
    console.log('\n🔄 Updating test data...');
    
    // Update FAQ
    const updatedFAQ = await FAQ.findByIdAndUpdate(
      testFAQId,
      {
        ...TEST_CONFIG.updatedFAQ,
        updatedBy: testUserId,
        updatedAt: new Date()
      },
      { new: true }
    );
    console.log('✅ Updated FAQ answer:', updatedFAQ.answer);
    
    // Update Company Data
    const updatedCompanyData = await CompanyData.findByIdAndUpdate(
      testCompanyDataId,
      {
        ...TEST_CONFIG.updatedCompanyData,
        updatedBy: testUserId,
        updatedAt: new Date()
      },
      { new: true }
    );
    console.log('✅ Updated Company Data content:', updatedCompanyData.content);
    
    // Wait a moment for database to sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('❌ Error updating test data:', error);
    throw error;
  }
}

async function testUpdatedResponse() {
  try {
    console.log('\n🧪 Testing updated AI response...');
    
    // Get fresh context data (should now include updated information)
    const context = await getFreshContextData(TEST_CONFIG.testQuery, 6);
    console.log(`📊 Found ${context.length} context items after update`);
    
    // Log the fresh context to verify it contains updated data
    console.log('\n📋 Fresh context data:');
    context.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title}`);
      console.log(`     Content: ${item.content.substring(0, 100)}...`);
    });
    
    // Create a mock conversation
    const messages = [
      { content: TEST_CONFIG.testQuery, sender: 'user', timestamp: new Date() }
    ];
    
    // Generate AI response with updated context
    const response = await generateResponse(messages, context, true);
    
    console.log('\n🤖 Updated AI Response:');
    console.log(response.content);
    console.log('\n📈 Response Metadata:', response.metadata);
    
    return response;
  } catch (error) {
    console.error('❌ Error testing updated response:', error);
    throw error;
  }
}

async function cleanupTestData() {
  try {
    console.log('\n🧹 Cleaning up test data...');
    
    if (testFAQId) {
      await FAQ.findByIdAndDelete(testFAQId);
      console.log('✅ Deleted test FAQ');
    }
    
    if (testCompanyDataId) {
      await CompanyData.findByIdAndDelete(testCompanyDataId);
      console.log('✅ Deleted test Company Data');
    }
    
    // Optionally delete test user (commented out to avoid issues)
    // await User.findByIdAndDelete(testUserId);
    // console.log('✅ Deleted test user');
    
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

async function runTest() {
  try {
    console.log('🚀 Starting Real-time Data Update Test\n');
    
    // Connect to database
    await connectDB();
    
    // Create test user
    await createTestUser();
    
    // Create initial test data
    await createTestData();
    
    // Test initial AI response
    const initialResponse = await testInitialResponse();
    
    // Update test data
    await updateTestData();
    
    // Test updated AI response
    const updatedResponse = await testUpdatedResponse();
    
    // Compare responses
    console.log('\n📊 COMPARISON RESULTS:');
    console.log('='.repeat(50));
    
    const initialContent = initialResponse.content.toLowerCase();
    const updatedContent = updatedResponse.content.toLowerCase();
    
    // Check if the updated response contains the new information
    const hasUpdatedInfo = updatedContent.includes('jane doe') || 
                          updatedContent.includes('sarah wilson') || 
                          updatedContent.includes('2024');
    
    const hasOldInfo = updatedContent.includes('john smith') || 
                      updatedContent.includes('michael johnson') || 
                      updatedContent.includes('2020');
    
    if (hasUpdatedInfo && !hasOldInfo) {
      console.log('✅ SUCCESS: AI is using updated information!');
      console.log('✅ Real-time data updates are working correctly.');
    } else if (hasUpdatedInfo && hasOldInfo) {
      console.log('⚠️  PARTIAL: AI has both old and new information.');
      console.log('⚠️  This might indicate caching or context mixing issues.');
    } else {
      console.log('❌ FAILURE: AI is still using old information.');
      console.log('❌ Real-time data updates are NOT working.');
    }
    
    console.log('\n📝 Detailed Analysis:');
    console.log(`- Updated info detected: ${hasUpdatedInfo}`);
    console.log(`- Old info detected: ${hasOldInfo}`);
    console.log(`- Fresh data used: ${updatedResponse.metadata.freshDataUsed}`);
    console.log(`- Context items: ${updatedResponse.metadata.contextUsed}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    await cleanupTestData();
    
    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Test completed and database connection closed.');
  }
}

// Run the test
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { runTest };
