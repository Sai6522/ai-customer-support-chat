// MongoDB initialization script
db = db.getSiblingDB('ai-chat-support');

// Create collections
db.createCollection('users');
db.createCollection('conversations');
db.createCollection('faqs');
db.createCollection('companydatas');

// Create indexes for better performance
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

db.conversations.createIndex({ "userId": 1, "createdAt": -1 });
db.conversations.createIndex({ "sessionId": 1 });

db.faqs.createIndex({ "question": "text", "answer": "text", "tags": "text" });
db.faqs.createIndex({ "category": 1, "priority": -1 });

db.companydatas.createIndex({ "title": "text", "content": "text", "tags": "text" });
db.companydatas.createIndex({ "category": 1, "priority": -1 });

print('Database initialized successfully!');
