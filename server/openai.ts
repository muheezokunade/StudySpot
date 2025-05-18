import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-development"
});

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function generateAIResponse(prompt: string, context?: string): Promise<string> {
  try {
    const messages: ChatMessage[] = [];
    
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
        content: "You are an AI tutor for National Open University of Nigeria (NOUN) students. You provide helpful, accurate, and concise information about courses, exams, and academic concepts. When asked about specific NOUN courses, assume standard university curriculum for those courses. You can suggest study techniques, explain concepts, and help with exam preparation. Keep your responses clear, educational, and supportive."
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
