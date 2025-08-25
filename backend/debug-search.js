const mongoose = require('mongoose');
const FAQ = require('./models/FAQ');
const CompanyData = require('./models/CompanyData');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ai-chat-support', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugSearch() {
  console.log('🔍 Debug Search for CEO Question');
  console.log('================================');
  
  const query = 'Who is the CEO of the company?';
  
  try {
    console.log(`\n🔎 Searching for: "${query}"`);
    
    // Search FAQs
    console.log('\n📋 FAQ Search Results:');
    const faqs = await FAQ.search(query, 3);
    console.log(`Found ${faqs.length} FAQs`);
    faqs.forEach((faq, index) => {
      console.log(`${index + 1}. Priority: ${faq.priority} - ${faq.question}`);
      console.log(`   Answer: ${faq.answer}`);
      console.log(`   Active: ${faq.isActive}`);
    });
    
    // Search Company Data
    console.log('\n🏢 Company Data Search Results:');
    const companyData = await CompanyData.search(query, 3);
    console.log(`Found ${companyData.length} company data items`);
    companyData.forEach((data, index) => {
      console.log(`${index + 1}. Priority: ${data.priority} - ${data.title}`);
      console.log(`   Content: ${data.content ? data.content.substring(0, 100) + '...' : 'No content'}`);
    });
    
    // Test with simpler queries
    console.log('\n🔎 Testing simpler queries:');
    
    const ceoFaqs = await FAQ.search('CEO', 5);
    console.log(`\nFAQ search for "CEO": ${ceoFaqs.length} results`);
    ceoFaqs.forEach((faq, index) => {
      console.log(`${index + 1}. ${faq.question} (Priority: ${faq.priority})`);
    });
    
    const ceoCompanyData = await CompanyData.search('CEO', 5);
    console.log(`\nCompany Data search for "CEO": ${ceoCompanyData.length} results`);
    ceoCompanyData.forEach((data, index) => {
      console.log(`${index + 1}. ${data.title} (Priority: ${data.priority})`);
    });
    
    // Combined and sorted context
    console.log('\n🔄 Combined Context (as used in chat):');
    const contextItems = [
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
    
    const sortedContext = contextItems
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6);
    
    console.log(`Total context items: ${contextItems.length}`);
    console.log(`After sorting and limiting: ${sortedContext.length}`);
    
    sortedContext.forEach((item, index) => {
      console.log(`${index + 1}. [${item.source}] Priority: ${item.priority} - ${item.title}`);
      console.log(`   Content: ${item.content ? item.content.substring(0, 80) + '...' : 'No content'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugSearch();
