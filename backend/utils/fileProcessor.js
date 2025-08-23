const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Process text file
const processTextFile = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      success: true,
      content: content.trim(),
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
    };
  } catch (error) {
    console.error('Error processing text file:', error);
    return {
      success: false,
      error: 'Failed to process text file',
    };
  }
};

// Process PDF file with proper text extraction
const processPDFFile = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    const content = data.text.trim();
    
    if (!content || content.length === 0) {
      return {
        success: false,
        error: 'PDF file appears to be empty or contains no extractable text',
      };
    }
    
    return {
      success: true,
      content: content,
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
      pageCount: data.numpages,
      metadata: {
        info: data.info,
        pages: data.numpages,
      },
    };
  } catch (error) {
    console.error('Error processing PDF file:', error);
    return {
      success: false,
      error: 'Failed to process PDF file. Please ensure it contains readable text.',
    };
  }
};

// Process JSON file
const processJSONFile = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(content);
    
    // Convert JSON to readable text
    let textContent = '';
    
    if (Array.isArray(jsonData)) {
      // Handle array of objects (like FAQ data)
      jsonData.forEach((item, index) => {
        textContent += `Item ${index + 1}:\n`;
        Object.entries(item).forEach(([key, value]) => {
          textContent += `${key}: ${JSON.stringify(value)}\n`;
        });
        textContent += '\n';
      });
    } else if (typeof jsonData === 'object') {
      // Handle single object
      Object.entries(jsonData).forEach(([key, value]) => {
        textContent += `${key}: ${JSON.stringify(value, null, 2)}\n`;
      });
    } else {
      textContent = JSON.stringify(jsonData, null, 2);
    }
    
    return {
      success: true,
      content: textContent.trim(),
      wordCount: textContent.split(/\s+/).length,
      charCount: textContent.length,
      originalFormat: 'JSON',
    };
  } catch (error) {
    console.error('Error processing JSON file:', error);
    return {
      success: false,
      error: 'Failed to process JSON file. Please ensure it contains valid JSON.',
    };
  }
};

// Process CSV file
const processCSVFile = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return {
        success: false,
        error: 'CSV file appears to be empty',
      };
    }
    
    // Convert CSV to readable text format
    let textContent = '';
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    textContent += `CSV Data with ${lines.length} rows:\n\n`;
    textContent += `Headers: ${headers.join(', ')}\n\n`;
    
    // Process data rows
    for (let i = 1; i < Math.min(lines.length, 100); i++) { // Limit to first 100 rows
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      textContent += `Row ${i}:\n`;
      headers.forEach((header, index) => {
        textContent += `  ${header}: ${values[index] || 'N/A'}\n`;
      });
      textContent += '\n';
    }
    
    if (lines.length > 100) {
      textContent += `... and ${lines.length - 100} more rows\n`;
    }
    
    return {
      success: true,
      content: textContent.trim(),
      wordCount: textContent.split(/\s+/).length,
      charCount: textContent.length,
      rowCount: lines.length - 1,
      columnCount: headers.length,
    };
  } catch (error) {
    console.error('Error processing CSV file:', error);
    return {
      success: false,
      error: 'Failed to process CSV file',
    };
  }
};

// Process Word document (basic - would need additional libraries for full support)
const processWordFile = async (filePath) => {
  try {
    // For now, return a message that Word processing requires additional setup
    return {
      success: false,
      error: 'Word document processing requires additional libraries. Please convert to PDF or TXT format.',
    };
  } catch (error) {
    console.error('Error processing Word file:', error);
    return {
      success: false,
      error: 'Failed to process Word document',
    };
  }
};

// Main file processing function
const processFile = async (filePath, mimeType) => {
  try {
    console.log(`Processing file: ${filePath}, MIME type: ${mimeType}`);
    
    switch (mimeType) {
      case 'text/plain':
        return await processTextFile(filePath);
      
      case 'application/pdf':
        return await processPDFFile(filePath);
      
      case 'application/json':
        return await processJSONFile(filePath);
      
      case 'text/csv':
        return await processCSVFile(filePath);
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await processWordFile(filePath);
      
      default:
        return {
          success: false,
          error: `Unsupported file type: ${mimeType}`,
        };
    }
  } catch (error) {
    console.error('Error in processFile:', error);
    return {
      success: false,
      error: 'Failed to process file',
    };
  }
};

// Extract metadata from content
const extractMetadata = (content) => {
  if (!content || typeof content !== 'string') {
    return {
      title: 'Untitled Document',
      wordCount: 0,
      charCount: 0,
      lineCount: 0,
      keywords: [],
    };
  }

  const lines = content.split('\n');
  const words = content.split(/\s+/).filter(word => word.length > 0);
  
  // Extract potential title (first non-empty line, limited to 100 chars)
  const title = lines.find(line => line.trim().length > 0)?.trim().substring(0, 100) || 'Untitled Document';
  
  // Extract keywords (words longer than 3 characters, excluding common words)
  const commonWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use']);
  
  const keywords = [...new Set(
    words
      .filter(word => word.length > 3 && !commonWords.has(word.toLowerCase()))
      .map(word => word.toLowerCase().replace(/[^\w]/g, ''))
      .filter(word => word.length > 3)
  )].slice(0, 10); // Top 10 keywords
  
  return {
    title,
    wordCount: words.length,
    charCount: content.length,
    lineCount: lines.length,
    keywords,
  };
};

module.exports = {
  processFile,
  extractMetadata,
  processTextFile,
  processPDFFile,
  processJSONFile,
  processCSVFile,
  processWordFile,
};
