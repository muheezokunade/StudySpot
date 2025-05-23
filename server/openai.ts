import { OpenAI } from 'openai';

// Use a placeholder key for development if real key is not available
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'placeholder-key-for-development';

console.log('Environment API key value:', OPENAI_API_KEY ? 'API key exists' : 'No API key found');

// Set OpenAI model to use
const OPENAI_MODEL = 'gpt-3.5-turbo'; // Using gpt-3.5-turbo which is more widely available

// Debug: Print part of the API key to verify it's loaded
const firstChars = OPENAI_API_KEY.substring(0, 10);
const lastChars = OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 5);
console.log(`API Key loaded - starts with: ${firstChars}... ends with: ...${lastChars}`);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Check if we have a valid API key - explicitly check for sk-proj- prefix too
const hasValidApiKey = OPENAI_API_KEY !== 'placeholder-key-for-development' && 
                      (OPENAI_API_KEY.startsWith('sk-') || OPENAI_API_KEY.startsWith('sk-proj-'));
console.log(`API Key valid: ${hasValidApiKey}, starts with sk-proj-: ${OPENAI_API_KEY.startsWith('sk-proj-')}`);

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function generateAIResponse(prompt: string, context?: string): Promise<string> {
  // If no valid API key, return a helpful message
  if (!hasValidApiKey) {
    console.warn('No OpenAI API key provided. Using fallback response.');
    return "I'm sorry, but the AI service is not configured properly. Please add an OpenAI API key to the .env file to enable this feature.";
  }

  try {
    const messages: { role: 'system' | 'user'; content: string }[] = [];
    
    // Add system context if provided
    if (context) {
      messages.push({
        role: "system",
        content: context
      });
    } else {
      // Default system context for NOUN students
      messages.push({
        role: "system",
        content: "You are an advanced AI tutor specializing in National Open University of Nigeria (NOUN) courses. You provide detailed, accurate, and insightful responses about academic subjects, course materials, exam preparation, and learning strategies. When discussing NOUN courses, incorporate specific curriculum details when available. Your expertise covers Mathematics, Computer Science, Business Administration, Law, Education, and other programs offered by NOUN. Provide practical examples, study techniques, and clear explanations. Be encouraging, helpful, and tailored to the Nigerian educational context. When asked about computer science topics, provide thorough technical explanations with code examples when appropriate."
      });
    }
    
    // Add user prompt
    messages.push({
      role: "user",
      content: prompt
    });

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again later.";
  }
}

export async function generateCourseSummary(courseCode: string, topic: string): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: "You are an educational content creator for the National Open University of Nigeria (NOUN). Create concise, informative summaries of course topics that follow academic standards."
      },
      {
        role: "user",
        content: `Create a concise summary about '${topic}' for the course '${courseCode}'. The summary should be well-structured, educational, and highlight key concepts that students need to understand.`
      }
    ];

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages,
      temperature: 0.5,
      max_tokens: 800,
    });

    return response.choices[0].message.content || "Unable to generate course summary.";
  } catch (error) {
    console.error("Error generating course summary:", error);
    return "Sorry, I couldn't generate a summary for this topic. Please try again later.";
  }
}

export async function generateQuizQuestions(courseCode: string, topic: string, count: number = 5): Promise<any> {
  try {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: "You are an educational assessment expert. Create challenging but fair quiz questions with multiple-choice answers (4 options) and explanations for each correct answer. Return the response in a structured JSON format."
      },
      {
        role: "user",
        content: `Generate ${count} multiple-choice quiz questions about '${topic}' for the course '${courseCode}'. For each question, provide 4 answer options (A, B, C, D), indicate which is correct, and include a brief explanation for the correct answer. Format the response as JSON with the structure: { "questions": [{ "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A", "explanation": "..." }] }`
      }
    ];

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { questions: [] };
    }
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Error parsing JSON from OpenAI:", e);
      return { questions: [] };
    }
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    return { questions: [] };
  }
}

export default {
  generateAIResponse,
  generateCourseSummary,
  generateQuizQuestions
};
