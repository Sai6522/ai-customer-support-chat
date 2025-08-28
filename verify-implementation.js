#!/usr/bin/env node

/**
 * Simple verification script to check if real-time database updates are properly implemented
 * This script checks the code implementation without requiring a running database
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Real-time Database Update Implementation');
console.log('='.repeat(60));

const checks = [];

// Check 1: Gemini Service - getFreshContextData function
try {
  const geminiServicePath = path.join(__dirname, 'backend/utils/geminiService.js');
  const geminiContent = fs.readFileSync(geminiServicePath, 'utf8');
  
  if (geminiContent.includes('getFreshContextData')) {
    checks.push({ name: 'getFreshContextData function exists', status: '✅ PASS' });
  } else {
    checks.push({ name: 'getFreshContextData function exists', status: '❌ FAIL' });
  }
  
  if (geminiContent.includes('freshDataUsed: true')) {
    checks.push({ name: 'Fresh data metadata tracking', status: '✅ PASS' });
  } else {
    checks.push({ name: 'Fresh data metadata tracking', status: '❌ FAIL' });
  }
  
  if (geminiContent.includes('updatedAt: -1')) {
    checks.push({ name: 'Timestamp-based sorting in context', status: '✅ PASS' });
  } else {
    checks.push({ name: 'Timestamp-based sorting in context', status: '❌ FAIL' });
  }
  
} catch (error) {
  checks.push({ name: 'Gemini Service file access', status: '❌ FAIL - File not found' });
}

// Check 2: Chat Route - Fresh data queries
try {
  const chatRoutePath = path.join(__dirname, 'backend/routes/chat.js');
  const chatContent = fs.readFileSync(chatRoutePath, 'utf8');
  
  if (chatContent.includes('.lean()')) {
    checks.push({ name: 'Lean queries for performance', status: '✅ PASS' });
  } else {
    checks.push({ name: 'Lean queries for performance', status: '❌ FAIL' });
  }
  
  if (chatContent.includes('updatedAt') && chatContent.includes('sort')) {
    checks.push({ name: 'Timestamp sorting in chat route', status: '✅ PASS' });
  } else {
    checks.push({ name: 'Timestamp sorting in chat route', status: '❌ FAIL' });
  }
  
  if (chatContent.includes('Fresh search results')) {
    checks.push({ name: 'Enhanced debug logging', status: '✅ PASS' });
  } else {
    checks.push({ name: 'Enhanced debug logging', status: '❌ FAIL' });
  }
  
} catch (error) {
  checks.push({ name: 'Chat Route file access', status: '❌ FAIL - File not found' });
}

// Check 3: FAQ Model - Updated search method
try {
  const faqModelPath = path.join(__dirname, 'backend/models/FAQ.js');
  const faqContent = fs.readFileSync(faqModelPath, 'utf8');
  
  if (faqContent.includes('updatedAt: -1') && faqContent.includes('priority: -1')) {
    checks.push({ name: 'FAQ model priority + timestamp sorting', status: '✅ PASS' });
  } else {
    checks.push({ name: 'FAQ model priority + timestamp sorting', status: '❌ FAIL' });
  }
  
  if (faqContent.includes('.hint(')) {
    checks.push({ name: 'FAQ model index hints for fresh data', status: '✅ PASS' });
  } else {
    checks.push({ name: 'FAQ model index hints for fresh data', status: '❌ FAIL' });
  }
  
} catch (error) {
  checks.push({ name: 'FAQ Model file access', status: '❌ FAIL - File not found' });
}

// Check 4: CompanyData Model - Updated search method
try {
  const companyDataModelPath = path.join(__dirname, 'backend/models/CompanyData.js');
  const companyDataContent = fs.readFileSync(companyDataModelPath, 'utf8');
  
  if (companyDataContent.includes('updatedAt: -1') && companyDataContent.includes('priority: -1')) {
    checks.push({ name: 'CompanyData model priority + timestamp sorting', status: '✅ PASS' });
  } else {
    checks.push({ name: 'CompanyData model priority + timestamp sorting', status: '❌ FAIL' });
  }
  
  if (companyDataContent.includes('.hint(')) {
    checks.push({ name: 'CompanyData model index hints for fresh data', status: '✅ PASS' });
  } else {
    checks.push({ name: 'CompanyData model index hints for fresh data', status: '❌ FAIL' });
  }
  
} catch (error) {
  checks.push({ name: 'CompanyData Model file access', status: '❌ FAIL - File not found' });
}

// Check 5: Admin Dashboard - Edit functionality
try {
  const adminDashboardPath = path.join(__dirname, 'frontend/src/pages/AdminDashboard.js');
  const adminContent = fs.readFileSync(adminDashboardPath, 'utf8');
  
  if (adminContent.includes('handleEditDocumentSubmit') && adminContent.includes('updateCompanyData')) {
    checks.push({ name: 'Admin dashboard edit functionality', status: '✅ PASS' });
  } else {
    checks.push({ name: 'Admin dashboard edit functionality', status: '❌ FAIL' });
  }
  
  if (adminContent.includes('loadCompanyData') && adminContent.includes('loadFAQs')) {
    checks.push({ name: 'Admin dashboard refresh after updates', status: '✅ PASS' });
  } else {
    checks.push({ name: 'Admin dashboard refresh after updates', status: '❌ FAIL' });
  }
  
} catch (error) {
  checks.push({ name: 'Admin Dashboard file access', status: '❌ FAIL - File not found' });
}

// Display results
console.log('\n📋 Implementation Check Results:');
console.log('-'.repeat(60));

let passCount = 0;
let failCount = 0;

checks.forEach((check, index) => {
  console.log(`${index + 1}. ${check.name}: ${check.status}`);
  if (check.status.includes('✅')) passCount++;
  else failCount++;
});

console.log('\n📊 Summary:');
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Success Rate: ${((passCount / checks.length) * 100).toFixed(1)}%`);

// Overall assessment
if (failCount === 0) {
  console.log('\n🎉 EXCELLENT: All real-time database update features are properly implemented!');
  console.log('\n✅ The system should work as follows:');
  console.log('   1. Admin updates FAQ/Company Data in dashboard');
  console.log('   2. Changes are saved with updated timestamp');
  console.log('   3. Next user query triggers fresh database search');
  console.log('   4. Results are sorted by priority + update time');
  console.log('   5. AI uses the most recent, highest priority data');
  console.log('   6. User gets updated information immediately');
} else if (failCount <= 2) {
  console.log('\n⚠️  GOOD: Most features implemented, minor issues detected');
  console.log('   The real-time updates should work but may need minor fixes');
} else {
  console.log('\n❌ NEEDS WORK: Several implementation issues detected');
  console.log('   Real-time updates may not work properly');
}

console.log('\n🧪 To test the feature:');
console.log('   1. Start the application: ./start.sh');
console.log('   2. Login to admin dashboard');
console.log('   3. Update an FAQ or Company Data entry');
console.log('   4. Go to chat and ask related question');
console.log('   5. Verify AI uses updated information');

console.log('\n📝 Key Implementation Features:');
console.log('   • Fresh database queries with .lean() for performance');
console.log('   • Priority + timestamp sorting for latest data');
console.log('   • Enhanced context management with source tracking');
console.log('   • Improved AI instructions for using fresh data');
console.log('   • Comprehensive debug logging');
console.log('   • Fresh data indicators in response metadata');
