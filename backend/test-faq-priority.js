const mongoose = require('mongoose');
const FAQ = require('./models/FAQ');
const CompanyData = require('./models/CompanyData');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ai-customer-support', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testSearchPriority() {
  console.log('🔍 Testing FAQ vs Company Data Search Priority');
  console.log('==============================================');
  
  const query = 'CEO';
  
  try {
    // Search FAQs
    const faqs = await FAQ.search(query, 3);
    console.log('\n📋 FAQ Search Results:');
    faqs.forEach((faq, index) => {
      console.log(`${index + 1}. Priority: ${faq.priority} - ${faq.question}`);
      console.log(`   Answer: ${faq.answer}`);
    });
    
    // Search Company Data
    const companyData = await CompanyData.search(query, 3);
    console.log('\n🏢 Company Data Search Results:');
    companyData.forEach((data, index) => {
      console.log(`${index + 1}. Priority: ${data.priority} - ${data.title}`);
      console.log(`   Content: ${data.content ? data.content.substring(0, 100) + '...' : 'No content'}`);
    });
    
    // Combined context (as used in chat route)
    const context = [
      ...faqs.map(faq => ({ 
        title: faq.question, 
        content: faq.answer, 
        priority: faq.priority,
        source: 'FAQ'
      })),
      ...companyData.map(data => ({ 
        title: data.title, 
        content: data.content, 
        priority: data.priority,
        source: 'CompanyData'
      })),
    ];
    
    console.log('\n🔄 Combined Context (as sent to AI):');
    context.forEach((item, index) => {
      console.log(`${index + 1}. [${item.source}] Priority: ${item.priority} - ${item.title}`);
      console.log(`   Content: ${item.content ? item.content.substring(0, 100) + '...' : 'No content'}`);
    });
    
    // Sort by priority to see what should come first
    const sortedContext = context.sort((a, b) => b.priority - a.priority);
    console.log('\n⭐ Context Sorted by Priority (what AI should prioritize):');
    sortedContext.forEach((item, index) => {
      console.log(`${index + 1}. [${item.source}] Priority: ${item.priority} - ${item.title}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testSearchPriority();
