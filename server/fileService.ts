import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { InsertDocument, InsertDocumentChunk } from '@shared/schema';
import { db } from './db';
import { documents, documentChunks } from '@shared/schema';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

// Set up file filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only PDFs and DOCXs
  if (file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'));
  }
};

// Create multer upload instance
export const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB file size limit
});

/**
 * Process a PDF file to extract text and create chunks
 */
export async function processPdfDocument(documentId: number, filePath: string): Promise<void> {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    // Update document with page count
    await db.update(documents)
      .set({ 
        pageCount: pdfData.numpages,
        status: 'processing'
      })
      .where(eq(documents.id, documentId));
    
    // Split the text into chunks (500-700 tokens with 20% overlap)
    const chunks = splitTextIntoChunks(pdfData.text, 500, 0.2);
    
    // Store each chunk in the database
    for (let i = 0; i < chunks.length; i++) {
      const chunk: InsertDocumentChunk = {
        documentId,
        content: chunks[i],
        chunkIndex: i,
        // Simple heuristic for page number - can be improved with PDF structure analysis
        pageNumber: Math.floor((i / chunks.length) * pdfData.numpages) + 1,
      };
      
      await db.insert(documentChunks).values(chunk);
    }
    
    // Update document status to indexed
    await db.update(documents)
      .set({ status: 'indexed' })
      .where(eq(documents.id, documentId));
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    
    // Update document with error
    await db.update(documents)
      .set({ 
        status: 'failed',
        processingError: error instanceof Error ? error.message : 'Unknown error'
      })
      .where(eq(documents.id, documentId));
    
    throw error;
  }
}

/**
 * Split text into chunks of roughly the specified token count with overlap
 */
function splitTextIntoChunks(text: string, targetTokens: number, overlapPercentage: number): string[] {
  // Rough approximation: 1 token ≈ 4 characters for English text
  const charsPerToken = 4;
  const targetChars = targetTokens * charsPerToken;
  const overlapChars = Math.floor(targetChars * overlapPercentage);
  
  const chunks: string[] = [];
  let startPos = 0;
  
  while (startPos < text.length) {
    let endPos = startPos + targetChars;
    if (endPos >= text.length) {
      endPos = text.length;
    } else {
      // Try to break at sentence or paragraph boundary
      const nextPeriod = text.indexOf('.', endPos - 30);
      const nextNewline = text.indexOf('\n', endPos - 30);
      
      if (nextPeriod > 0 && nextPeriod < endPos + 30) {
        endPos = nextPeriod + 1;
      } else if (nextNewline > 0 && nextNewline < endPos + 30) {
        endPos = nextNewline + 1;
      }
    }
    
    chunks.push(text.substring(startPos, endPos).trim());
    startPos = endPos - overlapChars;
  }
  
  return chunks;
}

/**
 * Create a document record in the database
 */
export async function createDocumentRecord(document: InsertDocument): Promise<number> {
  const [result] = await db.insert(documents).values(document).returning({ id: documents.id });
  return result.id;
}

// Import the necessary functions
import { eq } from 'drizzle-orm'; 