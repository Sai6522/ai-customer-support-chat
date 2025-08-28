# 🤖 Gemini AI Input Parameters Flow: FAQ & Company Data

## 📋 **Complete Input Parameter Flow from Database to Gemini AI**

This document shows exactly how FAQ and Company Data inputs are processed and passed through Gemini AI, with all the specific code and parameters.

## 🔄 **Step-by-Step Input Parameter Flow**

### **STEP 1: Database Query Results → Raw Input Data**

**Location:** `backend/routes/chat.js` (Lines 56-59)

```javascript
// Fresh database queries return raw data
const [faqs, companyData] = await Promise.all([
  FAQ.search(message, 3).lean(),      // ← FAQ INPUT DATA
  CompanyData.search(message, 3).lean() // ← COMPANY DATA INPUT
]);

// Example FAQ Input Data:
faqs = [
  {
    _id: ObjectId("..."),
    question: "What are your business hours?",
    answer: "We are open Monday-Friday 9 AM to 6 PM EST",
    category: "Support",
    priority: 8,
    tags: ["hours", "support", "schedule"],
    updatedAt: "2025-08-26T10:24:00Z",
    createdBy: ObjectId("..."),
    isActive: true
  }
];

// Example Company Data Input:
companyData = [
  {
    _id: ObjectId("..."),
    title: "Customer Support Policy",
    content: "Our customer support team provides 24/7 assistance through multiple channels including chat, email, and phone support.",
    category: "Policies",
    type: "policy",
    priority: 9,
    tags: ["support", "policy", "customer"],
    updatedAt: "2025-08-26T10:25:00Z",
    createdBy: ObjectId("..."),
    isActive: true
  }
];
```

### **STEP 2: Context Preparation → Structured Input Parameters**

**Location:** `backend/routes/chat.js` (Lines 62-85)

```javascript
// Transform raw data into structured context items
const contextItems = [
  // FAQ transformation
  ...faqs.map(faq => ({ 
    title: faq.question,                    // ← FAQ QUESTION as TITLE
    content: faq.answer,                    // ← FAQ ANSWER as CONTENT
    priority: faq.priority || 0,            // ← PRIORITY for sorting
    source: 'FAQ',                          // ← SOURCE tracking
    updatedAt: faq.updatedAt,               // ← TIMESTAMP for freshness
    id: faq._id                             // ← ID for tracking
  })),
  // Company Data transformation
  ...companyData.map(data => ({ 
    title: data.title,                      // ← DOCUMENT TITLE
    content: data.content,                  // ← DOCUMENT CONTENT
    priority: data.priority || 0,           // ← PRIORITY for sorting
    source: 'CompanyData',                  // ← SOURCE tracking
    updatedAt: data.updatedAt,              // ← TIMESTAMP for freshness
    id: data._id                            // ← ID for tracking
  })),
];

// Example contextItems after transformation:
contextItems = [
  {
    title: "What are your business hours?",
    content: "We are open Monday-Friday 9 AM to 6 PM EST",
    priority: 8,
    source: 'FAQ',
    updatedAt: "2025-08-26T10:24:00Z",
    id: ObjectId("...")
  },
  {
    title: "Customer Support Policy", 
    content: "Our customer support team provides 24/7 assistance...",
    priority: 9,
    source: 'CompanyData',
    updatedAt: "2025-08-26T10:25:00Z",
    id: ObjectId("...")
  }
];
```

### **STEP 3: Priority Sorting → Ordered Input Parameters**

**Location:** `backend/routes/chat.js` (Lines 87-95)

```javascript
// Sort context by priority first, then by update time (most recent first)
const sortedContext = contextItems
  .sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;      // ← HIGHER PRIORITY FIRST
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt); // ← MORE RECENT FIRST
  })
  .slice(0, 6); // ← LIMIT TO TOP 6 ITEMS

// Example sortedContext (priority + timestamp sorted):
sortedContext = [
  {
    title: "Customer Support Policy",        // ← PRIORITY 9 (highest)
    content: "Our customer support team provides 24/7 assistance...",
    priority: 9,
    source: 'CompanyData',
    updatedAt: "2025-08-26T10:25:00Z"      // ← More recent
  },
  {
    title: "What are your business hours?",  // ← PRIORITY 8
    content: "We are open Monday-Friday 9 AM to 6 PM EST",
    priority: 8,
    source: 'FAQ', 
    updatedAt: "2025-08-26T10:24:00Z"      // ← Less recent
  }
];
```

### **STEP 4: AI Context Format → Gemini Input Parameters**

**Location:** `backend/routes/chat.js` (Lines 97-100)

```javascript
// Convert to format expected by AI (clean title + content only)
const context = sortedContext.map(item => ({
  title: item.title,                       // ← CLEAN TITLE for AI
  content: item.content                    // ← CLEAN CONTENT for AI
}));

// Example context sent to Gemini AI:
context = [
  {
    title: "Customer Support Policy",
    content: "Our customer support team provides 24/7 assistance through multiple channels including chat, email, and phone support."
  },
  {
    title: "What are your business hours?", 
    content: "We are open Monday-Friday 9 AM to 6 PM EST"
  }
];
```

### **STEP 5: Gemini AI Function Call → Input Parameters**

**Location:** `backend/routes/chat.js` (Line 115)

```javascript
// Call Gemini AI with prepared parameters
const aiResponse = await generateResponse(
  conversation.messages,    // ← CONVERSATION HISTORY
  context,                  // ← FAQ + COMPANY DATA CONTEXT
  isCompanyQuery           // ← QUERY TYPE FLAG
);

// Function signature and parameters:
generateResponse(messages, context, isEnhanced)
//               ↑        ↑        ↑
//               │        │        └── Boolean: Enhanced processing flag
//               │        └─────────── Array: FAQ + Company Data context
//               └──────────────────── Array: Conversation message history
```

### **STEP 6: Gemini Service Processing → Prompt Construction**

**Location:** `backend/utils/geminiService.js` (Lines 203-250)

```javascript
const generateResponse = async (messages, context = null, isEnhanced = false) => {
  // INPUT PARAMETERS:
  // messages = [
  //   { content: "What are your support hours?", sender: "user", timestamp: "..." },
  //   { content: "Previous response...", sender: "bot", timestamp: "..." }
  // ]
  // context = [
  //   { title: "Customer Support Policy", content: "Our customer support..." },
  //   { title: "What are your business hours?", content: "We are open..." }
  // ]
  // isEnhanced = true

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Get latest user message
  const latestMessage = messages[messages.length - 1];
  // latestMessage = { content: "What are your support hours?", sender: "user" }

  // Start with system prompt
  let conversationContext = SYSTEM_PROMPT + '\n\n';
  // conversationContext = "You are a helpful customer support assistant..."

  // PRIORITY 1: Use specific context (FAQ + Company Data)
  if (context && context.length > 0) {
    console.log('🔍 DEBUG: Using priority context from chat route:', context.length, 'items');
    
    // Transform context into numbered list for AI
    const contextContent = context.map((item, index) => 
      `${index + 1}. ${item.title}: ${item.content}`
    ).join('\n\n');
    
    // Example contextContent:
    // "1. Customer Support Policy: Our customer support team provides 24/7 assistance through multiple channels including chat, email, and phone support.
    //  
    //  2. What are your business hours?: We are open Monday-Friday 9 AM to 6 PM EST"

    // Add critical instructions for AI
    conversationContext += `CRITICAL INSTRUCTIONS: You MUST use the information below in the EXACT ORDER provided. The information is sorted by priority and recency - ALWAYS use the FIRST item that answers the user's question. This data is FRESH from the database and reflects the most recent updates.\n\n`;
    
    conversationContext += `PRIORITY-ORDERED INFORMATION (FRESH DATA):\n${contextContent}\n\n`;
    
    conversationContext += `STRICT RULE: If the user asks about something mentioned in item #1, use ONLY item #1. Ignore all other items. If item #1 doesn't answer the question, then check item #2, and so on. This ensures you're using the most up-to-date information.\n\n`;
    
    conversationContext += `EXAMPLE: If user asks "Who is the CEO?" and item #1 mentions a CEO, use ONLY that information. Do not look at other items.\n\n`;
  }

  // Add conversation history
  conversationContext += 'Conversation History:\n';
  messages.forEach(msg => {
    conversationContext += `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
  });
  // Example:
  // "User: Hello
  //  Assistant: Hi! How can I help you today?
  //  User: What are your support hours?"

  // Final prompt construction
  const prompt = `${conversationContext}\n\nPlease respond to the user's latest message: "${latestMessage.content}"\n\nRemember: If specific information was provided above, use ONLY that information. Do not supplement with general knowledge. Always use the most recent and highest priority information available.`;
```

### **STEP 7: Complete Gemini AI Input → Final Prompt**

**The complete prompt sent to Gemini AI looks like this:**

```
You are a helpful customer support assistant. Your role is to:

1. Provide accurate and helpful information to customers
2. Be polite, professional, and empathetic
3. Ask clarifying questions when needed
4. Escalate complex issues to human agents when appropriate
5. Use the provided company information and FAQs to answer questions
6. Keep responses concise but comprehensive
7. Always maintain a friendly and supportive tone

If you don't know the answer to a question, be honest about it and suggest alternative ways to help the customer.

CRITICAL INSTRUCTIONS: You MUST use the information below in the EXACT ORDER provided. The information is sorted by priority and recency - ALWAYS use the FIRST item that answers the user's question. This data is FRESH from the database and reflects the most recent updates.

PRIORITY-ORDERED INFORMATION (FRESH DATA):
1. Customer Support Policy: Our customer support team provides 24/7 assistance through multiple channels including chat, email, and phone support.

2. What are your business hours?: We are open Monday-Friday 9 AM to 6 PM EST

STRICT RULE: If the user asks about something mentioned in item #1, use ONLY item #1. Ignore all other items. If item #1 doesn't answer the question, then check item #2, and so on. This ensures you're using the most up-to-date information.

EXAMPLE: If user asks "Who is the CEO?" and item #1 mentions a CEO, use ONLY that information. Do not look at other items.

Conversation History:
User: Hello
Assistant: Hi! How can I help you today?
User: What are your support hours?

Please respond to the user's latest message: "What are your support hours?"

Remember: If specific information was provided above, use ONLY that information. Do not supplement with general knowledge. Always use the most recent and highest priority information available.
```

### **STEP 8: Gemini API Call → Technical Parameters**

**Location:** `backend/utils/geminiService.js` (Lines 260-270)

```javascript
// Call Gemini API with constructed prompt
const result = await model.generateContent(prompt);
//                    ↑
//                    └── Complete prompt with FAQ + Company Data

// Gemini API Parameters:
// - model: 'gemini-1.5-flash'
// - input: Complete prompt string (shown above)
// - temperature: Default (not specified, uses Gemini default)
// - maxTokens: Default (not specified, uses Gemini default)

const response = await result.response;
const text = response.text();

// Example Gemini AI Response:
// "Based on our customer support policy, we provide 24/7 assistance through multiple channels. However, our regular business hours are Monday-Friday 9 AM to 6 PM EST for standard inquiries."
```

## 🎯 **Input Parameter Summary**

### **Key Input Parameters to Gemini AI:**

1. **System Prompt**: Base instructions for AI behavior
2. **Context Data**: FAQ + Company Data (priority sorted)
3. **Conversation History**: Previous messages in the chat
4. **User Query**: Latest user message
5. **Instructions**: Specific rules for using fresh data

### **Data Transformation Chain:**

```
Raw Database Data → Structured Context → Priority Sorted → Clean Format → AI Prompt → Gemini Response
```

### **Input Parameter Structure:**

```javascript
// Function Call Parameters
generateResponse(
  messages: [                           // ← Conversation history
    { content: string, sender: string, timestamp: Date }
  ],
  context: [                            // ← FAQ + Company Data
    { title: string, content: string }
  ],
  isEnhanced: boolean                   // ← Processing flag
)

// Gemini API Input
model.generateContent(
  prompt: string                        // ← Complete formatted prompt
)
```

## 🔍 **Debug Information Available**

### **Console Logging Shows Input Flow:**

```javascript
console.log('🔄 DEBUG: Fresh search results - FAQs:', faqs.length, 'Company Data:', companyData.length);
console.log('🔍 DEBUG: Final context sent to AI (with fresh data):');
context.forEach((item, index) => {
  console.log(`  ${index + 1}. [${sourceItem.source}] ${item.title} (Priority: ${sourceItem.priority}, Updated: ${sourceItem.updatedAt})`);
  console.log(`     Content: ${item.content.substring(0, 100)}...`);
});
```

### **Response Metadata Tracks Input Usage:**

```javascript
return {
  content: text,                        // ← AI response
  metadata: {
    model: 'gemini-1.5-flash',
    tokens: response.usageMetadata?.totalTokenCount || 0,
    responseTime: responseTime,
    contextUsed: context ? context.length : 0,    // ← Number of context items used
    isCompanyQuery: isCompanyDataQuery(latestMessage.content),
    freshDataUsed: true,                          // ← Fresh data indicator
    timestamp: new Date().toISOString()
  }
};
```

## ✅ **Complete Input Parameter Flow Summary**

1. **Database Query** → Raw FAQ + Company Data
2. **Context Preparation** → Structured objects with metadata
3. **Priority Sorting** → Ordered by priority + timestamp
4. **Format Cleaning** → Simple title + content pairs
5. **Prompt Construction** → Complete AI instructions + context
6. **Gemini API Call** → Single prompt string parameter
7. **Response Processing** → AI output with metadata

**The input flows seamlessly from database to Gemini AI with complete traceability and fresh data guarantee!** 🚀
