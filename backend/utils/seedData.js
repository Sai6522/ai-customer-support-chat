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
