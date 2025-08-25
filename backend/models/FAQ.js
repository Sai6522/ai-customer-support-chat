const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters'],
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters'],
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  notHelpfulCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamps before saving
faqSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for text search
faqSchema.index({ 
  question: 'text', 
  answer: 'text', 
  tags: 'text' 
});

// Index for efficient queries
faqSchema.index({ category: 1, priority: -1 });
faqSchema.index({ isActive: 1, priority: -1 });

// Static method to search FAQs
faqSchema.statics.search = function(query, limit = 10) {
  // Extract key terms from the query for better matching
  const keyTerms = query.toLowerCase().match(/\b(ceo|chief executive|president|founder|leadership|manager|director|head|team|staff|employees)\b/g) || [];
  
  // Create search conditions
  const searchConditions = [
    { question: { $regex: query, $options: 'i' } },
    { answer: { $regex: query, $options: 'i' } },
    { tags: { $in: [new RegExp(query, 'i')] } },
  ];
  
  // Add key term searches
  keyTerms.forEach(term => {
    searchConditions.push(
      { question: { $regex: term, $options: 'i' } },
      { answer: { $regex: term, $options: 'i' } },
      { tags: { $in: [new RegExp(term, 'i')] } }
    );
  });
  
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: searchConditions
      }
    ]
  })
  .sort({ priority: -1, helpfulCount: -1 })
  .limit(limit);
};

// Static method to find by category
faqSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: new RegExp(category, 'i'), 
    isActive: true 
  })
  .sort({ priority: -1, helpfulCount: -1 });
};

// Static method to get popular FAQs
faqSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ viewCount: -1, helpfulCount: -1 })
    .limit(limit);
};

// Instance method to increment view count
faqSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method to mark as helpful
faqSchema.methods.markHelpful = function() {
  this.helpfulCount += 1;
  return this.save();
};

// Instance method to mark as not helpful
faqSchema.methods.markNotHelpful = function() {
  this.notHelpfulCount += 1;
  return this.save();
};

// Virtual for helpfulness ratio
faqSchema.virtual('helpfulnessRatio').get(function() {
  const total = this.helpfulCount + this.notHelpfulCount;
  return total > 0 ? (this.helpfulCount / total) * 100 : 0;
});

module.exports = mongoose.model('FAQ', faqSchema);
