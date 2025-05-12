import { getDocument, GlobalWorkerOptions, PDFPageProxy } from 'pdfjs-dist';
import { createWorker, Worker } from 'tesseract.js';

// Configure worker to use local file
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

async function getPageAsImage(page: PDFPageProxy): Promise<string> {
  const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas.toDataURL('image/png');
}

async function performOCR(imageData: string): Promise<string> {
  const worker = await createWorker('eng');
  
  const { data: { text } } = await worker.recognize(imageData);
  await worker.terminate();
  
  return text;
}

export async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdf = await getDocument({ data: pdfBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Try normal text extraction first
      const content = await page.getTextContent();
      let pageText = content.items
        .filter((item: any) => typeof item.str === 'string')
        .map((item: any) => item.str.trim())
        .join(' ');

      // If little or no text was extracted, try OCR
      if (pageText.trim().length < 200) { // Arbitrary threshold, adjust as needed
        try {
          const imageData = await getPageAsImage(page);
          const ocrText = await performOCR(imageData);
          pageText = ocrText;
        } catch (ocrError) {
          console.error('OCR failed for page', i, ocrError);
          // Keep the original text if OCR fails
        }
      }

      fullText += pageText + ' ';
    }

    return fullText.trim().replace(/\s+/g, ' ');
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}