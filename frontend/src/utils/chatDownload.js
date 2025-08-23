import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';

// Download chat as TXT file
export const downloadChatAsTXT = async (sessionId) => {
  try {
    const response = await api.get(`/chat/download/${sessionId}/txt`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_${sessionId}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading chat as TXT:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to download chat as TXT' 
    };
  }
};

// Download chat as PDF file
export const downloadChatAsPDF = async (sessionId) => {
  try {
    // Get HTML content from backend
    const response = await api.get(`/chat/download/${sessionId}/html`);
    const { htmlContent, fileName, title } = response.data.data;

    // Create a temporary container for the HTML content
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlContent;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20px';
    document.body.appendChild(tempContainer);

    // Convert HTML to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: tempContainer.scrollHeight,
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const imgData = canvas.toDataURL('image/png');
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(fileName);

    return { success: true };
  } catch (error) {
    console.error('Error downloading chat as PDF:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to download chat as PDF' 
    };
  }
};

// Alternative PDF generation using direct HTML to PDF conversion
export const downloadChatAsPDFDirect = async (sessionId) => {
  try {
    // Get HTML content from backend
    const response = await api.get(`/chat/download/${sessionId}/html`);
    const { htmlContent, fileName, title } = response.data.data;

    // Create PDF from HTML content
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add title
    pdf.setFontSize(20);
    pdf.text(title || 'Chat Conversation', 20, 20);
    
    // Add content (simplified version)
    pdf.setFontSize(12);
    
    // Parse HTML content to extract text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const messages = tempDiv.querySelectorAll('.message');
    let yPosition = 40;
    const pageHeight = 280;
    const lineHeight = 7;
    
    messages.forEach((message, index) => {
      const sender = message.querySelector('.sender')?.textContent || '';
      const content = message.querySelector('.message-content')?.textContent || '';
      const timestamp = message.querySelector('.timestamp')?.textContent || '';
      
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Add sender and timestamp
      pdf.setFont(undefined, 'bold');
      pdf.text(`${sender} - ${timestamp}`, 20, yPosition);
      yPosition += lineHeight;
      
      // Add message content
      pdf.setFont(undefined, 'normal');
      const lines = pdf.splitTextToSize(content, 170);
      lines.forEach(line => {
        if (yPosition > pageHeight - 10) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 20, yPosition);
        yPosition += lineHeight;
      });
      
      yPosition += lineHeight; // Extra space between messages
    });

    // Download the PDF
    pdf.save(fileName);

    return { success: true };
  } catch (error) {
    console.error('Error downloading chat as PDF (direct):', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to download chat as PDF' 
    };
  }
};

// Get user's chat sessions
export const getUserChatSessions = async (page = 1, limit = 20) => {
  try {
    const response = await api.get(`/chat/sessions?page=${page}&limit=${limit}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to get chat sessions',
    };
  }
};
