import express from 'express';
import { upload, createDocumentRecord, processPdfDocument } from './fileService';
import { extractConceptsFromDocument, generateExerciseForConcept, initializeSpacedRepetition, updateSpacedRepetition, getConceptsDueForReview, generateMockExam } from './aiTutorService';
import { db } from './db';
import { documents, concepts, exercises, documentChunks } from '@shared/schema';
import { eq, asc } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Middleware to check if user is authenticated
function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Upload document
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.session.userId as number;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Create document record
    const document = {
      userId,
      title,
      fileName: req.file.originalname,
      fileType: path.extname(req.file.originalname).substring(1).toLowerCase(),
      filePath: req.file.path,
      fileSize: req.file.size,
    };
    
    // Save document to database
    const documentId = await createDocumentRecord(document);
    
    // Process document asynchronously (in real prod, use a worker queue)
    setImmediate(async () => {
      try {
        // Process the document based on file type
        if (document.fileType === 'pdf') {
          await processPdfDocument(documentId, req.file!.path);
        } else {
          // Handle other file types as needed
          throw new Error(`Unsupported file type: ${document.fileType}`);
        }
        
        // Extract concepts
        await extractConceptsFromDocument(documentId);
        
        // Get all concepts
        const documentConcepts = await db.query.concepts.findMany({
          where: eq(concepts.documentId, documentId)
        });
        
        // Generate exercises for each concept
        for (const concept of documentConcepts) {
          await generateExerciseForConcept(concept.id);
        }
        
        // Initialize spaced repetition for the user
        await initializeSpacedRepetition(userId, documentId);
      } catch (error) {
        console.error('Document processing error:', error);
      }
    });
    
    res.status(201).json({ 
      message: 'Document uploaded and processing started',
      documentId 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading document' });
  }
});

// Get user documents
router.get('/documents', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId as number;
    
    const userDocuments = await db.query.documents.findMany({
      where: eq(documents.userId, userId),
      orderBy: [{ column: documents.createdAt, order: 'desc' }]
    });
    
    res.json(userDocuments);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

// Get document details
router.get('/documents/:id', isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.session.userId as number;
    
    // Get document
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, documentId)
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check ownership
    if (document.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this document' });
    }
    
    // Get concepts
    const documentConcepts = await db.query.concepts.findMany({
      where: eq(concepts.documentId, documentId),
      orderBy: asc(concepts.orderIndex)
    });
    
    res.json({
      document,
      concepts: documentConcepts
    });
  } catch (error) {
    console.error('Error fetching document details:', error);
    res.status(500).json({ message: 'Error fetching document details' });
  }
});

// Get concept details with exercises
router.get('/concepts/:id', isAuthenticated, async (req, res) => {
  try {
    const conceptId = parseInt(req.params.id);
    
    // Get concept
    const concept = await db.query.concepts.findFirst({
      where: eq(concepts.id, conceptId)
    });
    
    if (!concept) {
      return res.status(404).json({ message: 'Concept not found' });
    }
    
    // Get document
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, concept.documentId)
    });
    
    // Check ownership
    if (document && document.userId !== (req.session.userId as number)) {
      return res.status(403).json({ message: 'Not authorized to access this concept' });
    }
    
    // Get exercises for this concept
    const conceptExercises = await db.query.exercises.findMany({
      where: eq(exercises.conceptId, conceptId)
    });
    
    // Get next and previous concepts
    const siblingConcepts = await db.query.concepts.findMany({
      where: eq(concepts.documentId, concept.documentId),
      orderBy: asc(concepts.orderIndex)
    });
    
    const currentIndex = siblingConcepts.findIndex(c => c.id === concept.id);
    const previousConcept = currentIndex > 0 ? siblingConcepts[currentIndex - 1] : null;
    const nextConcept = currentIndex < siblingConcepts.length - 1 ? siblingConcepts[currentIndex + 1] : null;
    
    res.json({
      concept,
      exercises: conceptExercises,
      navigation: {
        previous: previousConcept ? { id: previousConcept.id, title: previousConcept.title } : null,
        next: nextConcept ? { id: nextConcept.id, title: nextConcept.title } : null
      }
    });
  } catch (error) {
    console.error('Error fetching concept details:', error);
    res.status(500).json({ message: 'Error fetching concept details' });
  }
});

// Submit answer to exercise
router.post('/exercises/:id/answer', isAuthenticated, async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.id);
    const userId = req.session.userId as number;
    const { answer } = req.body;
    
    if (answer === undefined) {
      return res.status(400).json({ message: 'Answer is required' });
    }
    
    // Get exercise
    const exercise = await db.query.exercises.findFirst({
      where: eq(exercises.id, exerciseId)
    });
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    // Check if answer is correct
    const isCorrect = answer.toLowerCase() === exercise.correctAnswer.toLowerCase();
    
    // Update spaced repetition
    await updateSpacedRepetition(userId, exercise.conceptId, isCorrect);
    
    res.json({
      isCorrect,
      correctAnswer: exercise.correctAnswer,
      solution: exercise.solution
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ message: 'Error submitting answer' });
  }
});

// Get concepts due for review
router.get('/review', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId as number;
    
    const conceptsForReview = await getConceptsDueForReview(userId);
    
    res.json(conceptsForReview);
  } catch (error) {
    console.error('Error fetching review concepts:', error);
    res.status(500).json({ message: 'Error fetching review concepts' });
  }
});

// Generate mock exam
router.post('/exams/generate', isAuthenticated, async (req, res) => {
  try {
    const { documentId, questionCount = 30 } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }
    
    // Get document
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, documentId)
    });
    
    // Check ownership
    if (document && document.userId !== (req.session.userId as number)) {
      return res.status(403).json({ message: 'Not authorized to access this document' });
    }
    
    const exam = await generateMockExam(documentId, questionCount);
    
    res.json(exam);
  } catch (error) {
    console.error('Error generating mock exam:', error);
    res.status(500).json({ message: 'Error generating mock exam' });
  }
});

export default router; 