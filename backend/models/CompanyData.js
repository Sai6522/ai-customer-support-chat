const mongoose = require('mongoose');

const companyDataSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['document', 'policy', 'procedure', 'faq', 'knowledge_base', 'other'],
    default: 'document',
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
  fileName: {
    type: String,
    trim: true,
  },
  filePath: {
    type: String,
    trim: true,
  },
  fileSize: {
    type: Number,
  },
  mimeType: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  accessCount: {
    type: Number,
    default: 0,
  },
  lastAccessed: {
    type: Date,
  },
  version: {
    type: String,
    default: '1.0',
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
companyDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for text search
companyDataSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
});

// Index for efficient queries
companyDataSchema.index({ category: 1, type: 1, priority: -1 });
companyDataSchema.index({ isActive: 1, priority: -1 });
companyDataSchema.index({ createdAt: -1 });

// Static method to search company data
companyDataSchema.statics.search = function(query, limit = 10) {
  // Extract key terms from the query for better matching
  const keyTerms = query.toLowerCase().match(/\b(ceo|chief executive|president|founder|leadership|manager|director|head|team|staff|employees|management)\b/g) || [];
  
  // Create search conditions
  const searchConditions = [
    { title: { $regex: query, $options: 'i' } },
    { content: { $regex: query, $options: 'i' } },
    { tags: { $in: [new RegExp(query, 'i')] } },
  ];
  
  // Add key term searches
  keyTerms.forEach(term => {
    searchConditions.push(
      { title: { $regex: term, $options: 'i' } },
      { content: { $regex: term, $options: 'i' } },
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
  .sort({ priority: -1, accessCount: -1 })
  .limit(limit)
  .populate('createdBy', 'username')
  .populate('updatedBy', 'username');
};

// Static method to find by category
companyDataSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: new RegExp(category, 'i'), 
    isActive: true 
  })
  .sort({ priority: -1, accessCount: -1 })
  .populate('createdBy', 'username');
};

// Static method to find by type
companyDataSchema.statics.findByType = function(type) {
  return this.find({ 
    type: type, 
    isActive: true 
  })
  .sort({ priority: -1, accessCount: -1 })
  .populate('createdBy', 'username');
};

// Static method to get recent documents
companyDataSchema.statics.getRecent = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'username');
};

// Static method to get most accessed documents
companyDataSchema.statics.getMostAccessed = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ accessCount: -1 })
    .limit(limit)
    .populate('createdBy', 'username');
};

// Instance method to increment access count
companyDataSchema.methods.incrementAccess = function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Instance method to update content
companyDataSchema.methods.updateContent = function(newContent, updatedBy) {
  this.content = newContent;
  this.updatedBy = updatedBy;
  this.updatedAt = new Date();
  return this.save();
};

// Virtual for content preview
companyDataSchema.virtual('contentPreview').get(function() {
  return this.content.length > 200 
    ? this.content.substring(0, 200) + '...' 
    : this.content;
});

// Virtual for file size in human readable format
companyDataSchema.virtual('fileSizeFormatted').get(function() {
  if (!this.fileSize) return 'N/A';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

module.exports = mongoose.model('CompanyData', companyDataSchema);
