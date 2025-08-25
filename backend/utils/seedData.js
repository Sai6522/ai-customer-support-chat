const mongoose = require('mongoose');
const User = require('../models/User');
const FAQ = require('../models/FAQ');
const CompanyData = require('../models/CompanyData');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await FAQ.deleteMany({});
    await CompanyData.deleteMany({});
    console.log('Cleared existing data');

    // Create demo users
    const adminUser = new User({
      username: 'admin',
      email: 'admin@demo.com',
      password: 'password123',
      role: 'admin',
    });

    const regularUser = new User({
      username: 'user',
      email: 'user@demo.com',
      password: 'password123',
      role: 'user',
    });

    await adminUser.save();
    await regularUser.save();
    console.log('Created demo users');

    // Create demo FAQs
    const faqs = [
      {
        question: 'How do I reset my password?',
        answer: 'To reset your password, click on the "Forgot Password" link on the login page and follow the instructions sent to your email.',
        category: 'Account',
        tags: ['password', 'reset', 'account'],
        priority: 5,
        createdBy: adminUser._id,
      },
      {
        question: 'What are your business hours?',
        answer: 'Our customer support is available 24/7. However, our live agents are available Monday to Friday, 9 AM to 6 PM EST.',
        category: 'General',
        tags: ['hours', 'support', 'availability'],
        priority: 4,
        createdBy: adminUser._id,
      },
      {
        question: 'How do I cancel my subscription?',
        answer: 'You can cancel your subscription at any time by going to your account settings and clicking on "Cancel Subscription". Your access will continue until the end of your current billing period.',
        category: 'Billing',
        tags: ['subscription', 'cancel', 'billing'],
        priority: 5,
        createdBy: adminUser._id,
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes, we take data security very seriously. All data is encrypted in transit and at rest. We comply with industry-standard security practices and regulations.',
        category: 'Security',
        tags: ['security', 'data', 'privacy'],
        priority: 5,
        createdBy: adminUser._id,
      },
      {
        question: 'How do I contact technical support?',
        answer: 'You can contact technical support through this chat interface, email us at support@company.com, or call our support hotline at 1-800-SUPPORT.',
        category: 'Support',
        tags: ['contact', 'support', 'help'],
        priority: 4,
        createdBy: adminUser._id,
      },
    ];

    await FAQ.insertMany(faqs);
    console.log('Created demo FAQs');

    // Create demo company data
    const companyDataItems = [
      {
        title: 'Company Information & Location',
        content: `Company Overview:
Name: AI Customer Support Platform Inc.
Founded: 2024
Type: Technology Company specializing in AI-powered customer support solutions

Headquarters:
Address: 123 Innovation Drive, Tech Valley, CA 94000, USA
Phone: +1 (800) SUPPORT (786-7678)
Email: info@aicustomersupport.com
Support Email: support@aicustomersupport.com

Regional Offices:
- New York: 456 Business Ave, New York, NY 10001
- London: 789 Tech Street, London, UK EC1A 1BB
- Singapore: 321 Innovation Hub, Singapore 018989

Business Hours:
- Customer Support: 24/7 (AI-powered)
- Live Agent Support: Monday-Friday, 9 AM - 6 PM EST
- Technical Support: Monday-Sunday, 8 AM - 8 PM EST
- Sales Team: Monday-Friday, 8 AM - 7 PM EST

Mission: To revolutionize customer support through intelligent AI solutions
Vision: Making customer support accessible, efficient, and delightful for everyone`,
        category: 'Company Info',
        type: 'knowledge_base',
        tags: ['company', 'location', 'contact', 'address', 'phone'],
        priority: 10,
        createdBy: adminUser._id,
      },
      {
        title: 'Data Management & Security Policies',
        content: `Data Management Framework:

1. Data Collection:
- User account information (name, email, preferences)
- Conversation history and chat logs
- Usage analytics and performance metrics
- Support tickets and feedback

2. Data Storage:
- Primary Database: MongoDB Atlas (encrypted)
- Backup Systems: AWS S3 with encryption
- Data Retention: 7 years for compliance
- Geographic Storage: US, EU, APAC regions

3. Data Security Measures:
- End-to-end encryption (AES-256)
- Multi-factor authentication for admin access
- Regular security audits and penetration testing
- SOC 2 Type II certified
- GDPR and CCPA compliant
- ISO 27001 certified

4. Data Access Controls:
- Role-based access permissions
- Audit logs for all data access
- Regular access reviews
- Principle of least privilege

5. Data Processing:
- AI model training (anonymized data only)
- Performance analytics and reporting
- Customer support optimization
- Compliance reporting

6. User Rights:
- Data portability (export your data)
- Right to deletion (GDPR Article 17)
- Data correction and updates
- Opt-out of analytics tracking

Contact our Data Protection Officer: dpo@aicustomersupport.com`,
        category: 'Data Management',
        type: 'policy',
        tags: ['data', 'security', 'privacy', 'gdpr', 'management'],
        priority: 9,
        createdBy: adminUser._id,
      },
      {
        title: 'Services & Product Offerings',
        content: `Our Services:

1. AI Customer Support Platform:
- 24/7 AI-powered chat support
- Multi-language support (15+ languages)
- Intelligent routing and escalation
- Real-time sentiment analysis
- Custom knowledge base integration

2. Admin Dashboard:
- User management and analytics
- Conversation monitoring
- FAQ and knowledge base management
- Performance metrics and reporting
- System health monitoring

3. Integration Services:
- REST API for third-party integration
- Webhook support for real-time updates
- CRM integration (Salesforce, HubSpot)
- Help desk integration (Zendesk, Freshdesk)
- E-commerce platform integration

4. Enterprise Features:
- Single Sign-On (SSO) support
- Custom branding and white-labeling
- Advanced analytics and reporting
- Dedicated account management
- SLA guarantees (99.9% uptime)

5. Pricing Plans:
- Starter: $29/month (up to 1,000 conversations)
- Professional: $99/month (up to 10,000 conversations)
- Enterprise: Custom pricing (unlimited conversations)
- All plans include: AI support, basic analytics, email support

6. Add-on Services:
- Custom AI model training: $500/month
- Advanced analytics: $200/month
- Priority support: $100/month
- Custom integrations: Quote on request

Contact our sales team: sales@aicustomersupport.com`,
        category: 'Services',
        type: 'knowledge_base',
        tags: ['services', 'products', 'pricing', 'features'],
        priority: 8,
        createdBy: adminUser._id,
      },
      {
        title: 'Team & Management Information',
        content: `Our Team:

Leadership Team:
- CEO: Sarah Johnson (Former VP of Customer Success at TechCorp)
- CTO: Michael Chen (Ex-Google AI Research)
- VP of Engineering: David Rodriguez (Former Amazon Principal Engineer)
- VP of Sales: Emily Watson (Former Salesforce Director)
- Head of Customer Success: James Kim (Former Zendesk Manager)

Engineering Team:
- 15 Full-stack developers
- 8 AI/ML engineers
- 5 DevOps engineers
- 6 QA engineers
- 4 Security specialists

Customer Success Team:
- 12 Customer success managers
- 8 Technical support specialists
- 6 Implementation consultants
- 4 Training specialists

Company Culture:
- Remote-first company with global talent
- Commitment to diversity and inclusion
- Continuous learning and development
- Work-life balance priority
- Innovation and experimentation encouraged

Certifications & Partnerships:
- Google Cloud Partner
- AWS Advanced Technology Partner
- Microsoft Azure Certified
- Salesforce ISV Partner
- SOC 2 Type II Certified
- ISO 27001 Certified

Awards & Recognition:
- 2024 Best AI Customer Support Solution
- 2024 TechCrunch Startup of the Year Finalist
- 2024 Customer Choice Award Winner`,
        category: 'Team',
        type: 'knowledge_base',
        tags: ['team', 'management', 'leadership', 'culture'],
        priority: 7,
        createdBy: adminUser._id,
      },
      {
        title: 'Company Privacy Policy',
        content: `Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

1. Information We Collect
We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.

2. How We Use Your Information
We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.

3. Information Sharing
We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

4. Data Security
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. Contact Us
If you have any questions about this Privacy Policy, please contact us at privacy@company.com.`,
        category: 'Legal',
        type: 'policy',
        tags: ['privacy', 'policy', 'legal'],
        priority: 5,
        createdBy: adminUser._id,
      },
      {
        title: 'Getting Started Guide',
        content: `Getting Started Guide

Welcome to our platform! This guide will help you get started quickly.

Step 1: Create Your Account
Sign up with your email address and create a secure password.

Step 2: Complete Your Profile
Add your personal information and preferences to customize your experience.

Step 3: Explore Features
Take a tour of our main features:
- Dashboard: Overview of your account
- Chat Support: Get help from our AI assistant
- Settings: Customize your preferences

Step 4: Get Help
If you need assistance, use our chat support or check our FAQ section.

Tips for Success:
- Keep your profile updated
- Use strong passwords
- Contact support if you have questions

We're here to help you succeed!`,
        category: 'Documentation',
        type: 'knowledge_base',
        tags: ['getting-started', 'guide', 'tutorial'],
        priority: 4,
        createdBy: adminUser._id,
      },
      {
        title: 'Troubleshooting Common Issues',
        content: `Troubleshooting Guide

Common Issues and Solutions:

1. Login Problems
- Check your username and password
- Clear browser cache and cookies
- Try using a different browser
- Reset your password if needed

2. Slow Performance
- Check your internet connection
- Close unnecessary browser tabs
- Clear browser cache
- Try using a different device

3. Feature Not Working
- Refresh the page
- Check if you have the required permissions
- Contact support if the issue persists

4. Account Issues
- Verify your email address
- Check if your account is active
- Contact support for account-related problems

5. Payment Problems
- Check your payment method
- Verify billing information
- Contact billing support

For additional help, contact our support team.`,
        category: 'Support',
        type: 'knowledge_base',
        tags: ['troubleshooting', 'issues', 'help'],
        priority: 4,
        createdBy: adminUser._id,
      },
    ];

    await CompanyData.insertMany(companyDataItems);
    console.log('Created demo company data');

    console.log('✅ Seed data created successfully!');
    console.log('\nDemo Credentials:');
    console.log('Admin: admin / password123');
    console.log('User: user / password123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
