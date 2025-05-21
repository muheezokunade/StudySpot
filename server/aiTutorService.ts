import OpenAI from "openai";
import { db } from './db';
import { concepts, exercises, documentChunks, spacedRepetitionStats } from '@shared/schema';
import { eq, asc, sql } from 'drizzle-orm';
import { InsertConcept, InsertExercise, InsertSpacedRepetitionStat, Concept } from '@shared/schema';

// OpenAI client initialization
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-development"
});

/**
 * Extract concepts from document chunks
 */
export async function extractConceptsFromDocument(documentId: number): Promise<void> {
  try {
    // Get all chunks for the document
    const chunks = await db.query.documentChunks.findMany({
      where: eq(documentChunks.documentId, documentId),
      orderBy: asc(documentChunks.chunkIndex)
    });
    
    if (chunks.length === 0) {
      throw new Error("No chunks found for document");
    }
    
    // Process chunks to extract concepts
    const conceptsMap = new Map<string, { 
      title: string, 
      summary: string, 
      prerequisites: string[],
      pageNumbers: number[]
    }>();
    
    for (const chunk of chunks) {
      const extractedConcepts = await extractConceptsFromChunk(chunk.content);
      
      // Merge with existing concepts or add new ones
      for (const concept of extractedConcepts) {
        const existingConcept = conceptsMap.get(concept.title.toLowerCase());
        
        if (existingConcept) {
          // Merge
          existingConcept.pageNumbers.push(chunk.pageNumber || 0);
          // Keep better summary if available
          if (concept.summary.length > existingConcept.summary.length) {
            existingConcept.summary = concept.summary;
          }
          // Add prerequisites if new
          for (const prereq of concept.prerequisites) {
            if (!existingConcept.prerequisites.includes(prereq)) {
              existingConcept.prerequisites.push(prereq);
            }
          }
        } else {
          // Add new
          conceptsMap.set(concept.title.toLowerCase(), {
            ...concept,
            pageNumbers: [chunk.pageNumber || 0]
          });
        }
      }
    }
    
    // Order concepts based on prerequisites
    const orderedConcepts = topologicalSort(Array.from(conceptsMap.values()));
    
    // Store concepts in database with ordered index
    for (let i = 0; i < orderedConcepts.length; i++) {
      const concept = orderedConcepts[i];
      const pageSpan = getPageSpanString(concept.pageNumbers);
      
      const conceptData: InsertConcept = {
        documentId,
        title: concept.title,
        summary: concept.summary,
        prerequisites: concept.prerequisites,
        orderIndex: i,
        pageSpan
      };
      
      await db.insert(concepts).values(conceptData);
    }
  } catch (error) {
    console.error("Error extracting concepts:", error);
    throw error;
  }
}

/**
 * Extract concepts from a single text chunk
 */
async function extractConceptsFromChunk(chunkText: string): Promise<{ 
  title: string; 
  summary: string; 
  prerequisites: string[];
}[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content analyzer. Extract educational concepts from text chunks. 
          For each concept, provide a title, summary, and list of prerequisite concepts.`
        },
        {
          role: "user",
          content: `Extract educational concepts from the following text. Return as JSON array:
          [
            {
              "title": "Concept Name (keep short and precise)",
              "summary": "Brief explanation of the concept (2-3 sentences)",
              "prerequisites": ["Prerequisite Concept 1", "Prerequisite Concept 2"]
            }
          ]
          
          Text:
          ${chunkText}`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      return [];
    }
    
    const parsed = JSON.parse(content);
    return parsed.concepts || [];
  } catch (error) {
    console.error("Error in concept extraction:", error);
    return [];
  }
}

/**
 * Order concepts based on prerequisite relationships
 */
function topologicalSort(concepts: { 
  title: string; 
  summary: string; 
  prerequisites: string[];
  pageNumbers: number[];
}[]): { 
  title: string; 
  summary: string; 
  prerequisites: string[];
  pageNumbers: number[];
}[] {
  // Create concept title map for lookup
  const titleToIndex = new Map<string, number>();
  concepts.forEach((concept, index) => {
    titleToIndex.set(concept.title.toLowerCase(), index);
  });
  
  // Create adjacency list
  const graph: number[][] = concepts.map(() => []);
  concepts.forEach((concept, index) => {
    concept.prerequisites.forEach(prereq => {
      const prereqIndex = titleToIndex.get(prereq.toLowerCase());
      if (prereqIndex !== undefined) {
        graph[prereqIndex].push(index);
      }
    });
  });
  
  // Topological sort
  const visited = new Array(concepts.length).fill(false);
  const tempMark = new Array(concepts.length).fill(false);
  const result: number[] = [];
  
  function visit(n: number) {
    if (tempMark[n]) {
      // Circular dependency, skip
      return;
    }
    if (!visited[n]) {
      tempMark[n] = true;
      graph[n].forEach(m => visit(m));
      tempMark[n] = false;
      visited[n] = true;
      result.unshift(n);
    }
  }
  
  for (let i = 0; i < concepts.length; i++) {
    if (!visited[i]) {
      visit(i);
    }
  }
  
  return result.map(i => concepts[i]);
}

/**
 * Convert array of page numbers to a page span string
 */
function getPageSpanString(pageNumbers: number[]): string {
  if (pageNumbers.length === 0) return "";
  
  const uniquePages = Array.from(new Set(pageNumbers)).filter(p => p > 0).sort((a, b) => a - b);
  if (uniquePages.length === 0) return "";
  
  return uniquePages.join(', ');
}

/**
 * Generate an exercise for a concept
 */
export async function generateExerciseForConcept(conceptId: number): Promise<void> {
  try {
    // Get the concept
    const concept = await db.query.concepts.findFirst({
      where: eq(concepts.id, conceptId)
    });
    
    if (!concept) {
      throw new Error("Concept not found");
    }
    
    // Generate exercise
    const exercise = await generateExercise(concept);
    
    // Store in database
    await db.insert(exercises).values(exercise);
    
  } catch (error) {
    console.error("Error generating exercise:", error);
    throw error;
  }
}

/**
 * Generate an exercise using AI
 */
async function generateExercise(concept: Concept): Promise<InsertExercise> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an educational content creator. Create challenging but fair practice exercises 
          for students to test their understanding of concepts. Include a question, answer options, 
          correct answer, hints, and full solution.`
        },
        {
          role: "user",
          content: `Create a practice exercise for the concept: "${concept.title}"
          
          Concept summary: ${concept.summary}
          
          Generate a JSON object with:
          - question: The question text
          - type: "mcq" for multiple choice or "short_answer" for text response
          - options: Array of 4 options if MCQ (null for short_answer)
          - correctAnswer: The correct answer
          - hint1: First hint (50% reveal)
          - hint2: Second hint (formula/key phrase)
          - solution: Detailed solution
          - memoryHook: Mnemonic or analogy to help remember`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to generate exercise");
    }
    
    const parsed = JSON.parse(content);
    return {
      conceptId: concept.id,
      question: parsed.question,
      type: parsed.type,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer,
      hint1: parsed.hint1,
      hint2: parsed.hint2,
      solution: parsed.solution,
      memoryHook: parsed.memoryHook
    };
  } catch (error) {
    console.error("Error generating exercise:", error);
    throw new Error("Failed to generate exercise");
  }
}

/**
 * Initialize spaced repetition for a user and document
 */
export async function initializeSpacedRepetition(userId: number, documentId: number): Promise<void> {
  try {
    // Get concepts for the document
    const documentConcepts = await db.query.concepts.findMany({
      where: eq(concepts.documentId, documentId),
      orderBy: asc(concepts.orderIndex)
    });
    
    if (documentConcepts.length === 0) {
      throw new Error("No concepts found for document");
    }
    
    // Calculate initial next review date (today)
    const today = new Date();
    
    // Create spaced repetition stats for each concept
    for (const concept of documentConcepts) {
      const statData: InsertSpacedRepetitionStat = {
        userId,
        conceptId: concept.id,
        nextReviewDate: today
      };
      
      await db.insert(spacedRepetitionStats).values(statData);
    }
  } catch (error) {
    console.error("Error initializing spaced repetition:", error);
    throw error;
  }
}

/**
 * Update a concept's spaced repetition data based on performance
 */
export async function updateSpacedRepetition(userId: number, conceptId: number, isCorrect: boolean): Promise<void> {
  try {
    // Get current stats
    const stats = await db.query.spacedRepetitionStats.findFirst({
      where: sql`${spacedRepetitionStats.userId} = ${userId} AND ${spacedRepetitionStats.conceptId} = ${conceptId}`
    });
    
    if (!stats) {
      throw new Error("Stats not found");
    }
    
    // SuperMemo-2 algorithm
    let easeFactor = stats.easeFactor || 250; // Default if null
    let interval = stats.interval || 1; // Default if null
    
    if (isCorrect) {
      // If answer was correct
      if (interval === 1) {
        interval = 6; // First interval: 6 days
      } else if (interval === 6) {
        interval = 15; // Second interval: 15 days
      } else {
        interval = Math.round(interval * easeFactor / 100);
      }
      
      // Adjust ease factor (minimum 130)
      easeFactor = Math.max(130, easeFactor + 20);
    } else {
      // If answer was wrong
      interval = 1; // Reset interval to 1 day
      
      // Decrease ease factor (minimum 130)
      easeFactor = Math.max(130, easeFactor - 30);
    }
    
    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    // Update stats
    await db.update(spacedRepetitionStats)
      .set({
        interval,
        easeFactor,
        nextReviewDate,
        attempts: (stats.attempts || 0) + 1,
        correctAttempts: (stats.correctAttempts || 0) + (isCorrect ? 1 : 0),
        lastReviewedAt: new Date()
      })
      .where(sql`${spacedRepetitionStats.id} = ${stats.id}`);
    
  } catch (error) {
    console.error("Error updating spaced repetition:", error);
    throw error;
  }
}

/**
 * Get concepts due for review today
 */
export async function getConceptsDueForReview(userId: number): Promise<Concept[]> {
  try {
    const today = new Date();
    
    const stats = await db.query.spacedRepetitionStats.findMany({
      where: sql`${spacedRepetitionStats.userId} = ${userId} AND ${spacedRepetitionStats.nextReviewDate} <= ${today}`,
      with: {
        concept: true
      }
    });
    
    return stats.map(s => s.concept);
  } catch (error) {
    console.error("Error getting concepts for review:", error);
    throw error;
  }
}

/**
 * Generate a mock exam for a document
 */
export async function generateMockExam(documentId: number, questionCount: number = 30): Promise<any> {
  try {
    // Get all concepts for the document
    const documentConcepts = await db.query.concepts.findMany({
      where: eq(concepts.documentId, documentId)
    });
    
    if (documentConcepts.length === 0) {
      throw new Error("No concepts found for document");
    }
    
    // Get a summary of all concepts to send to AI
    const conceptSummaries = documentConcepts.map(c => `${c.title}: ${c.summary}`).join('\n\n');
    
    // Generate exam questions
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert exam creator. Create challenging but fair examination questions 
          covering a range of topics with varying difficulty levels.`
        },
        {
          role: "user",
          content: `Create a mock exam with ${questionCount} questions covering these concepts:
          
          ${conceptSummaries}
          
          Generate a JSON object with an array of questions, each having:
          - questionText: The question
          - options: Array of 4 options (for MCQs)
          - correctAnswer: The correct answer
          - conceptCovered: Which concept this tests
          - difficulty: "easy", "medium", or "hard"`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to generate mock exam");
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating mock exam:", error);
    throw error;
  }
} 