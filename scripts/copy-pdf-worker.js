import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  // Create public directory if it doesn't exist
  mkdirSync(join(__dirname, '../public'), { recursive: true });

  // Copy PDF.js worker from node_modules to public directory
  const workerSrc = join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');
  const workerDest = join(__dirname, '../public/pdf.worker.min.js');

  copyFileSync(workerSrc, workerDest);
  console.log('✓ PDF.js worker copied successfully');
} catch (error) {
  console.error('Error copying PDF.js worker:', error);
  process.exit(1);
}