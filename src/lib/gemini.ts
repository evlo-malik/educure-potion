import { z } from "zod";
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
}

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Get Gemini model
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash-001' });

function handleGeminiError(error: any): never {
  console.error('Gemini API Error:', error);
  
  if (error.message?.includes('503') || 
      error.message?.toLowerCase().includes('overloaded') ||
      error.message?.toLowerCase().includes('unavailable') ||
      error.message?.toLowerCase().includes('quota exceeded')) {
    throw new Error('API rate limit exceeded. Please try again in a few moments.');
  }

  if (error.message) {
    throw new Error(`AI Service Error: ${error.message}`);
  }

  throw new Error('An unexpected error occurred with the AI service. Please try again.');
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface TestQuestion {
  type: 'multiple_choice' | 'true_false';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

const flashcardSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  answer: z.string().min(1, "Answer cannot be empty")
});

const flashcardsResponseSchema = z.object({
  flashcards: z.array(flashcardSchema).min(1, "At least one flashcard is required")
});

const testQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false']),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string()
});

const testSchema = z.object({
  questions: z.array(testQuestionSchema)
});

// Helper function to clean JSON response from Gemini
const cleanJsonResponse = (text: string): string => {
  // Remove markdown code block if present
  if (text.includes('```json')) {
    text = text.replace(/```json\n|\n```/g, '');
  } else if (text.includes('```')) {
    text = text.replace(/```\n|\n```/g, '');
  }
  
  // Remove any leading/trailing whitespace
  return text.trim();
};

// Helper function to clean text for speech synthesis
function cleanTextForSpeech(text: string): string {
  return text
    // Remove any remaining markdown-style formatting
    .replace(/[#*_~`]/g, '')
    // Remove any HTML-like tags
    .replace(/<[^>]*>/g, '')
    // Remove any URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove only specific special characters that might cause issues with speech
    .replace(/[^\p{L}\p{N}\s.,!?;:'"()-]/gu, '')
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Ensure proper spacing after punctuation
    .replace(/([.,!?;:])\s*/g, '$1 ')
    .trim();
}

export async function generateNotes(text: string, customInstructions?: string, language: string = 'en', customLanguage?: string): Promise<string> {
  console.log('📝 Starting notes generation...');
  try {
    const targetLanguage = customLanguage || language;
    const baseSystemPrompt = `You are an expert study notes creator. Create detailed, well-structured revision notes from the provided PDF document. Cover every single topic and explain it. Make the notes very detailed. 

CRITICAL: GENERATE THE NOTES IN ${targetLanguage.toUpperCase()} LANGUAGE. EVEN IF THE DOCUMENT IS IN A DIFFERENT LANGUAGE, THE NOTES MUST BE IN ${targetLanguage.toUpperCase()}. THIS IS EXTREMELY IMPORTANT.

CRITICAL: IF CUSTOM INSTRUCTIONS ARE PROVIDED, YOU MUST FOLLOW THEM. THEY MUST BE PRIORITIZED OVER ANYTHING ELSE, EXCLUDING THE FORMATTING RULES BELOW.

IMPORTANT: DO NOT WRAP THE NOTES IN ANY CODE BLOCKS. Only use code blocks for code. DO NOT USE \`\`\` ANYWHERE IN YOUR RESPONSE.

1. Use clear headings with # for main sections and ## for subsections
2. Use bullet points (- ) for key points
3. Use numbered lists (1. ) for sequential information or steps
4. Add two blank lines between main sections for better readability
5. Use bold (**text**) for important terms and concepts
6. Use > for important quotes or definitions
7. Group related information under appropriate headings
8. Use --- for horizontal rules between major sections
9. Keep paragraphs short and focused
10. Use lists and bullet points liberally for better scanning
11. For mathematical expressions:
    - Use double dollar signs ($$...$$) for display/block equations
    - Use single dollar signs ($...$) for inline math
    - Use \\text{} for text within equations
    - Format complex equations properly with LaTeX syntax
    - Add explanations after complex equations
12. For equations, always:
    - Define all variables and symbols used
    - Break down complex equations into steps
    - Use proper mathematical notation (e.g., fractions with \\frac{}{}, subscripts with _{}, etc.)
    - Align multi-line equations using proper LaTeX alignment

Make the notes visually organized and easy to read. Use English by default, BUT if additional instructions mention using another language, use that language. IMPORTNT: ALWAYS use LaTeX format (dollar signs) for math expressions - ALWAYS use $ or $$, AROUND maths expressions.`;

    const systemPrompt = customInstructions 
      ? `${baseSystemPrompt}\n\nAdditional Instructions that must be priritized: ${customInstructions}`
      : baseSystemPrompt;

    const result = await model.generateContent([
      {
        text: `${systemPrompt}\n\nCreate comprehensive revision notes from the following text in ${targetLanguage.toUpperCase()} language, organizing key concepts and important details in a clear, structured format. Make sure to cover every single topic of the text in depth and explain harder concepts with your own knowledge. IMPORTNT: ALWAYS use LaTeX format (dollar signs) for math expressions - ALWAYS use $ or $$, AROUND maths expressions. DO NOT WRAP THE RESPONSE IN CODE BLOCKS.\n\nText to analyze: ${text}`
      }
    ]);

    let notes = result.response.text();
    if (!notes) {
      console.error('❌ No notes generated by Gemini');
      throw new Error('No notes generated');
    }

    // Remove any code block wrapping if present
    notes = notes.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '');
    
    console.log('✅ Successfully generated notes with Gemini');
    return notes.trim();
  } catch (error: any) {
    console.error('❌ Final error in notes generation:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    return handleGeminiError(error);
  }
}

export async function generateTest(text: string, customInstructions?: string, language: string = 'en', customLanguage?: string): Promise<TestQuestion[]> {
  console.log('📝 Starting test generation...');
  try {
    const targetLanguage = customLanguage || language;
    const baseSystemPrompt = `You are an expert test creator. Create a comprehensive test with multiple-choice and true/false questions based on the provided PDF document. 

CRITICAL: GENERATE THE TEST IN ${targetLanguage.toUpperCase()} LANGUAGE. EVEN IF THE DOCUMENT IS IN A DIFFERENT LANGUAGE, THE TEST MUST BE IN ${targetLanguage.toUpperCase()}. THIS IS EXTREMELY IMPORTANT.

IMPORTANT: Focus ONLY on the actual educational content that students need to learn and that will help them in their exams. DO NOT include any meta-information like who the lecturer is, what topics were covered, course structure, etc.

CRITICAL: IF CUSTOM INSTRUCTIONS ARE PROVIDED, YOU MUST FOLLOW THEM. THEY MUST BE PRIORITIZED OVER ANYTHING ELSE, EXCLUDING THE FORMATTING RULES BELOW.

IMPORTANT: For any mathematical expressions:
1. Formatting Rules:
   - Use double dollar signs ($$...$$) for display/block equations
   - Use single dollar signs ($...$) for inline math
   - NEVER use parentheses ( ) around equations or matrices - ALWAYS use $ or $$
   - ALL backslashes in LaTeX must be doubled (\\\\)

2. Common LaTeX Commands (always use double backslashes):
   - Fractions: $\\\\frac{numerator}{denominator}$
   - Greek letters: $\\\\tau$, $\\\\alpha$, etc.
   - Subscripts: $x_{\\\\text{subscript}}$
   - Superscripts: $x^{\\\\text{superscript}}$
   - Text in math: $\\\\text{text here}$

3. Examples:
   - Correct: $\\\\frac{dt}{\\\\tau}$
   - Incorrect: \\\\frac{dt}{\\\\tau}
   - Correct: $(1 - \\\\frac{dt}{\\\\tau})$
   - Incorrect: (1 - \\\\frac{dt}{\\\\tau})

CRITICAL REQUIREMENTS:
1. You MUST create AT LEAST 15 questions, NO EXCEPTIONS
2. If custom instructions specify more questions (e.g. "make 25 questions"), you MUST create that many questions
3. If no specific number is given, create 15-25 questions depending on content length (must cover every topic)
4. The test must be on the educational part of the content
5. Nothing like "How many times this word has appeared in the text" or "Who is teaching this course"
6. Imagine that you're making an exam for a student, and it must be a proper exam with proper questions
7. NEVER create fewer than 15 questions under any circumstances
8. important: MAKE SURE THAT EACH QUESTION HAS ONLY ONE CORRECT ANSWER. ONLY ONE SINGLE CORRECT ANSWER.
9. GENERATE THE TEST IN ${targetLanguage.toUpperCase()} LANGUAGE.`;

    const systemPrompt = customInstructions 
      ? `${baseSystemPrompt}\n\nAdditional Instructions: ${customInstructions}\n\nPrioritize following these custom instructions while maintaining the general guidelines and minimum question requirements above. Remember to generate the test in ${targetLanguage.toUpperCase()} language, unless specified otherwise in custom instructions. \n\n`
      : baseSystemPrompt + '\n\n';

    const result = await model.generateContent([
      {
        text: `${systemPrompt}\n\nFollow these rules:
1. MINIMUM 15 questions - this is mandatory and non-negotiable
2. If custom instructions specify more questions, create that exact number
3. If no specific number given, create 15-25 questions based on content length
4. Ensure questions cover every key concept and topic
5. Make questions clear and unambiguous
6. Include short but detailed explanations of the answer
7. Return only valid JSON in the specified format
8. Cover every single topic of the document
9. Keep your answer under 8000 tokens (under 20000 characters)
10. ALWAYS wrap math expressions in $ or $$ signs
11. ALWAYS use double backslashes in LaTeX commands
12. Make approximately 70% multiple-choice and 30% true/false questions

Create a test with both multiple-choice and true/false questions based on this PDF document. YOU MUST CREATE AT LEAST 15 QUESTIONS - THIS IS A STRICT REQUIREMENT. Return the response in this exact JSON format:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Clear question text. Example with math: What is the probability given by $\\\\frac{dt}{\\\\tau}$?",
      "options": [
        "$\\\\frac{dt}{\\\\tau}$",
        "$1 - \\\\frac{dt}{\\\\tau}$",
        "$\\\\tau dt$",
        "$dt$"
      ],
      "correctAnswer": "$\\\\frac{dt}{\\\\tau}$",
      "explanation": "The probability is $\\\\frac{dt}{\\\\tau}$ because..."
    },
    {
      "type": "true_false",
      "question": "The expression $\\\\frac{dt}{\\\\tau}$ represents the probability of scattering.",
      "correctAnswer": "True",
      "explanation": "This is correct because..."
    }
  ]
}

Text to analyze: ${text}`
      }
    ]);

    const content = result.response.text();
    if (!content) {
      console.error('❌ No test questions generated by Gemini');
      throw new Error('No test questions generated');
    }

    try {
      const parsedTest = JSON.parse(cleanJsonResponse(content));
      const validatedTest = testSchema.parse(parsedTest);
      
      console.log('✅ Successfully generated test with Gemini');
      return validatedTest.questions;
    } catch (parseError) {
      // If parsing fails, try to clean up the response
      console.warn('Initial JSON parse failed, attempting to clean response:', parseError);
      
      // More comprehensive cleanup of LaTeX expressions
      let cleanedResponse = content
        // Fix common LaTeX command issues
        .replace(/\\(?!\\|"|\n|\r|\t)([a-zA-Z]+)/g, '\\\\$1')
        // Fix fraction commands specifically
        .replace(/\\frac/g, '\\\\frac')
        // Fix other common LaTeX commands
        .replace(/\\text/g, '\\\\text')
        .replace(/\\tau/g, '\\\\tau')
        .replace(/\\alpha/g, '\\\\alpha')
        // Ensure math expressions are properly wrapped in $ signs
        .replace(/([^$])(\\\\[a-zA-Z]+{[^}]*})/g, '$1$$$2$$')
        // Clean up any double $$ that might have been created
        .replace(/\${3,}/g, '$$');
      
      const parsedTest = JSON.parse(cleanedResponse);
      const validatedTest = testSchema.parse(parsedTest);
      return validatedTest.questions;
    }
  } catch (error: any) {
    console.error('❌ Final error in test generation:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    return handleGeminiError(error);
  }
}

export async function generateFlashcards(text: string, customInstructions?: string, language: string = 'en', customLanguage?: string): Promise<{ question: string; answer: string }[]> {
  console.log('📝 Starting flashcards generation...');
  try {
    const targetLanguage = customLanguage || language;
    const baseSystemPrompt = `Create 20-50 educational flashcards from the provided PDF document. 
    
CRITICAL: GENERATE THE FLASHCARDS IN ${targetLanguage.toUpperCase()} LANGUAGE. EVEN IF THE DOCUMENT IS IN A DIFFERENT LANGUAGE, THE FLASHCARDS MUST BE IN ${targetLanguage.toUpperCase()}. THIS IS EXTREMELY IMPORTANT.

Make them proper flashcards that will ask the user about the educational content (nothing like teacher's name) of the document provided. Don't make the answers too long. Do not make any True/False questions. Make sure to cover every topic of the document. Questions must be about the educational content of the document. Keep the answers concise

CRITICAL: IF CUSTOM INSTRUCTIONS ARE PROVIDED, YOU MUST FOLLOW THEM. THEY MUST BE PRIORITIZED OVER ANYTHING ELSE, EXCLUDING THE FORMATTING RULES BELOW.

IMPORTANT: For any mathematical expressions:
1. Formatting Rules:
   - Use double dollar signs ($$...$$) for display/block equations
   - Use single dollar signs ($...$) for inline math
   - NEVER use parentheses ( ) around equations or matrices - ALWAYS use $ or $$
   - ALL backslashes in LaTeX must be doubled (\\\\)

2. Common LaTeX Commands (always use double backslashes):
   - Fractions: $\\\\frac{numerator}{denominator}$
   - Greek letters: $\\\\tau$, $\\\\alpha$, etc.
   - Subscripts: $x_{\\\\text{subscript}}$
   - Superscripts: $x^{\\\\text{superscript}}$
   - Text in math: $\\\\text{text here}$

3. Examples:
   - Correct: $\\\\frac{dt}{\\\\tau}$
   - Incorrect: \\\\frac{dt}{\\\\tau}
   - Correct: $(1 - \\\\frac{dt}{\\\\tau})$
   - Incorrect: (1 - \\\\frac{dt}{\\\\tau})

Return only valid JSON in the specified format. Make sure to answer in the exact format as specified!

Create flashcards in this exact JSON format:
{
  "flashcards": [
    {
      "question": "What is the probability of electron scattering in the Drude model? (Example with proper math formatting)",
      "answer": "The probability is $\\\\frac{dt}{\\\\tau}$ where $\\\\tau$ is the mean free time between collisions"
    }
  ]
}`;

    const systemPrompt = customInstructions 
      ? `${baseSystemPrompt}\n\nAdditional Instructions: ${customInstructions}\n\nPrioritize following these custom instructions while maintaining the general guidelines and JSON format above. Remember that if custom instructions do not specify the language, then generate the flashcards in ${targetLanguage.toUpperCase()} language.`
      : baseSystemPrompt;

    const result = await model.generateContent([
      {
        text: `${systemPrompt}\n\nCreate flashcards in ${targetLanguage.toUpperCase()} language, in this exact JSON format:
{
  "flashcards": [
    {
      "question": "What is the probability of electron scattering in the Drude model? (Example with proper math formatting)",
      "answer": "The probability is $\\\\frac{dt}{\\\\tau}$ where $\\\\tau$ is the mean free time between collisions"
    }
  ]
}

Text to analyze: ${text}`
      }
    ]);

    const content = result.response.text();
    if (!content) {
      console.error('❌ No flashcards generated by Gemini');
      throw new Error('No flashcards generated');
    }

    try {
      const parsedFlashcards = JSON.parse(cleanJsonResponse(content));
      const validatedFlashcards = flashcardsResponseSchema.parse(parsedFlashcards);
      
      console.log('✅ Successfully generated flashcards with Gemini');
      return validatedFlashcards.flashcards;
    } catch (parseError) {
      // If parsing fails, try to clean up the response
      console.warn('Initial JSON parse failed, attempting to clean response:', parseError);
      
      // More comprehensive cleanup of LaTeX expressions
      let cleanedResponse = content
        // Fix common LaTeX command issues
        .replace(/\\(?!\\|"|\n|\r|\t)([a-zA-Z]+)/g, '\\\\$1')
        // Fix fraction commands specifically
        .replace(/\\frac/g, '\\\\frac')
        // Fix other common LaTeX commands
        .replace(/\\text/g, '\\\\text')
        .replace(/\\tau/g, '\\\\tau')
        .replace(/\\alpha/g, '\\\\alpha')
        // Ensure math expressions are properly wrapped in $ signs
        .replace(/([^$])(\\\\[a-zA-Z]+{[^}]*})/g, '$1$$$2$$')
        // Clean up any double $$ that might have been created
        .replace(/\${3,}/g, '$$');
      
      const parsedFlashcards = JSON.parse(cleanedResponse);
      const validatedFlashcards = flashcardsResponseSchema.parse(parsedFlashcards);
      return validatedFlashcards.flashcards;
    }
  } catch (error: any) {
    console.error('❌ Final error in flashcards generation:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    return handleGeminiError(error);
  }
}

export async function generateStyledText(text: string, style: 'Lecture' | 'News' | 'Soft' | 'ASMR' | 'Motivational' | 'Storytelling', selectedLanguage: string = 'English', customLanguage?: string): Promise<string> {
  const targetLanguage = customLanguage || selectedLanguage;
  const stylePrompts = {
    Lecture: `You are a university professor giving a clear, structured lecture. THIS IS EXTREMELY IMPORTANT AND NON-NEGOTIABLE. Explain the content in an academic but engaging way, using appropriate terminology and examples. Your response will then be converted to Speech, so take that into account. Make sure to cover all topics, in detail and with explanations if needed. Make sure to keep it under 6000 characters long. `,
    News: `You are a professional news anchor presenting educational content. THIS IS EXTREMELY IMPORTANT AND NON-NEGOTIABLE. Deliver the information in a clear, authoritative, and well-structured manner, similar to how news broadcasts present complex topics to their audience. Use precise language and maintain a formal, broadcast-style tone while ensuring the content remains engaging and accessible. Your response will be converted to Speech, so take that into account. Make sure to cover all topics thoroughly, with clear explanations where needed. Keep it under 6000 characters long.`,
    Soft: `You are a gentle and nurturing educator with a soft, feminine voice. THIS IS EXTREMELY IMPORTANT AND NON-NEGOTIABLE. Present the content in a warm, clear, and comforting way - similar to how a caring teacher or ASMR artist would explain concepts. Keep your tone gentle but professional, focusing on clear explanations while maintaining a soothing presence. Your response will be converted to Speech, so take that into account. Make sure to cover all topics thoroughly, with clear explanations where needed. Keep it under 6000 characters long.`,
    ASMR: `You are a gentle, soothing ASMR content creator (like a caring mommy figure). CRITICAL INSTRUCTION: YOU MUST GENERATE THE TEXT IN ${targetLanguage.toUpperCase()} LANGUAGE. THIS IS EXTREMELY IMPORTANT AND NON-NEGOTIABLE. Explain the content in a soft, intimate, and calming way, using personal attention and reassuring language. Include appropriate ASMR-style phrases and transitions. Your response will then be converted to Speech, so take that into account. Make sure to cover all topics, in detail and with explanations if needed. Concentrate more on explaining the content, then on playing your role. But still add some ASMR stuff from time to time. Make sure to keep it under 4000 characters long. REMEMBER: THE TEXT MUST BE IN ${targetLanguage.toUpperCase()} LANGUAGE.`,
    Motivational: `You are an inspiring motivational speaker. CRITICAL INSTRUCTION: YOU MUST GENERATE THE TEXT IN ${targetLanguage.toUpperCase()} LANGUAGE. THIS IS EXTREMELY IMPORTANT AND NON-NEGOTIABLE. Present the content with energy and enthusiasm, using powerful metaphors and encouraging language to inspire and motivate the listener. You have to motivate the listener, make him/her want to take action and learn the stuff that you are explaining. Your response will then be converted to Speech, so take that into account. Make sure to cover all topics, in detail and with explanations if needed. Make sure to keep it under 4000 characters long. REMEMBER: THE TEXT MUST BE IN ${targetLanguage.toUpperCase()} LANGUAGE.`,
    Storytelling: `You are a masterful storyteller. CRITICAL INSTRUCTION: YOU MUST GENERATE THE TEXT IN ${targetLanguage.toUpperCase()} LANGUAGE. THIS IS EXTREMELY IMPORTANT AND NON-NEGOTIABLE. Weave the educational content into an engaging narrative, using vivid descriptions and maintaining a clear story arc while ensuring the educational value is preserved. Your response will then be converted to Speech, so take that into account. Make sure to cover all topics, in detail and with explanations if needed. Make sure to keep it under 4000 characters long. REMEMBER: THE TEXT MUST BE IN ${targetLanguage.toUpperCase()} LANGUAGE.`
  };

  try {
    const result = await model.generateContent([
      stylePrompts[style],
      `Transform this educational content into a ${style.toLowerCase()} style explanation: ${text}. ${['ASMR', 'Motivational', 'Storytelling'].includes(style) ? `CRITICAL: GENERATE THE TEXT IN ${targetLanguage.toUpperCase()} LANGUAGE. THIS IS EXTREMELY IMPORTANT.` : ''} Concentrate more on explaining the content, then on playing your role. Make sure to explain every single topic from the content, adding your own knowldege to explain it harder topics from time to time. Make sure to explain the content in a structured format, like you are teaching someone. If the content's explanation doesn't require long text, explain it in a short text. Only describe the content that is provided to you, never make up content to explain. Generate the text that will then be converted to speech, so without including any special characters used for visual formatting, such as hashtags or symbols. However, keep punctuation like exclamation marks, question marks, commas, and periods that enhance the natural flow of speech. The output should be text suitable for direct conversion to speech. DO NOT include any highlighted messages (so no hashtags). Do not include any formatting symbols. Your response must be pure text, with punctuation marks and numbers being the only symbols allowed. Keep your answer under specified character limit.`
    ]);

    const styledText = result.response.text();
    if (!styledText) {
      throw new Error('No styled text generated');
    }

    // Clean the text before returning
    return cleanTextForSpeech(styledText.trim());
  } catch (error) {
    console.error('Error generating styled text with Gemini:', error);
    return handleGeminiError(error);
  }
}

export async function generateGeminiResponse(messages: ChatMessage[], documentId: string, contextText?: string, documentType?: string): Promise<any> {
  try {
    const lastUserMessage = messages[messages.length - 1];
    const userQuery = typeof lastUserMessage.content === 'string' ? lastUserMessage.content : '';

    // Format chat history as a string (excluding the last message which is the current query)
    const chatHistory = messages.slice(0, -1);
    let chatHistoryText = '';
    if (chatHistory.length > 0) {
      chatHistoryText = chatHistory.map(msg => {
        const role = msg.role === 'assistant' ? 'AI' : 'User';
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return `${role}: ${content}`;
      }).join('\n\n');
      chatHistoryText = '\n\nPrevious conversation:\n' + chatHistoryText;
    }

    const systemPrompt = documentType === 'youtube' 
      ? `You are a knowledgeable tutor analyzing a YouTube video transcript. When referencing specific parts of the video, always include timestamps in [X] format, where X is the number of seconds into the video.

IMPORTANT: Keep your response under 400 tokens!!! (1200 characters)

Key instructions:
1. Structure your response in a clear, organized format:
   - Use "## " (exactly two #) for ALL section headings
   - Start with a brief overview/summary
   - Break down key points into sections with headings
   - Use bullet points for listing details
   - End with a conclusion if appropriate

2. Timestamps and References:
   - ALWAYS include timestamps in [X] format (e.g., [150] for 2:30)
   - NEVER USE time ranges like [150-160], only single timestamps
   - Make timestamps clickable by wrapping them in [X]
   - Reference specific parts with clear context

3. Formatting:
   - Use bold text for section headings
   - Use bullet points (•) for lists
   - Add line breaks between sections
   - Indent sub-points for better readability

4. Content Guidelines:
   - Be clear and concise in explanations
   - Keep responses focused and relevant
   - If unsure about something, say so
   - Never say "based on the video transcript"
   - For mathematical expressions, use LaTeX format:
     * Double dollar signs for display math: $$ \\epsilon = a_{\\text{actual}} - a_{\\text{setpoint}} $$
     * Single dollar signs for inline math: $k_d$ (no spaces)
     * Never use parentheses ( ) around equations - always use $ or $$

Remember: 
- ALWAYS use "## " for headings
- NEVER use bare asterisks
- ALWAYS use "* " for bullet points
- MAXIMUM 5 timestamps
- NEVER use time ranges in timestamps. FOR TIMESTAMPS WRITE JUST 1 NUMBER PER TIMESTAMP. NO RANGES. NO DECIMALS. JUST ONE NUMBER IN ONE TIMESTAMP (e.g. [55]`
      : documentType === 'lecture' 
      ? `You are a knowledgeable tutor analyzing a lecture recording transcript. You have access to relevant sections of the lecture in the context message.

IMPORTANT: Keep your response under 400 tokens!!! (1200 characters)

Key instructions:
1. Base your responses primarily on the provided lecture transcript
2. ALWAYS include timestamps when referencing specific parts of the lecture
3. DO NOT INCLUDE ANY TIMESTAMPS IN YOUR RESPONSE.
5. Be clear and concise in your explanations
6. If you're not sure about something, say so
7. Keep responses focused and relevant to the question
8. If the context doesn't fully answer the question, use your knowledge to supplement
9. If the user asks something specifically about the lecture, but the transcript doesn't provide an answer, say that there's no answer to that question in the available transcript
10. Structure your responses with clear sections and bullet points when appropriate
11. Make your response in a very beautiful, well structured and easy to read format
12. For mathematical expressions, use LaTeX format with double dollar signs for display math (e.g., $$ \\epsilon = a_{\\text{actual}} - a_{\\text{setpoint}} $$) and single dollar signs for inline math (e.g., $\\epsilon$). Again, For inline math, use single dollar signs with NO SPACES, e.g.: The diffusion constant $k_d$ depends on temperature $T$. Never use parentheses ( ) around equations or matrices - ALWAYS use $ or $$`
      : documentType === 'pdf'
      ? `You are a knowledgeable tutor analyzing a PDF document. You have access to relevant sections of the document in the context message.

IMPORTANT: Keep your response under 400 tokens!!! (1200 characters)

Key instructions:
1. Base your responses primarily on the provided document content
2. When referencing specific parts, mention page numbers if available (e.g., "On page X...")
3. Be clear and concise in your explanations
4. If you're not sure about something, say so
5. Keep responses focused and relevant to the question
6. If the context doesn't fully answer the question, use your knowledge to supplement
7. If referencing figures, tables, or diagrams, clearly indicate their location in the document
8. Structure your responses with clear sections and bullet points when appropriate
9. If the user asks something specifically about the document, but the document doesn't provide an answer, say that there's no answer to that question in the available content
10. Make your response in a very beautiful, well structured and easy to read format
11. If mathematical equations or formulas are present, explain them clearly and break down complex concepts
12. For mathematical expressions, use LaTeX format with double dollar signs for display math (e.g., $$ \\epsilon = a_{\\text{actual}} - a_{\\text{setpoint}} $$) and single dollar signs for inline math (e.g., $\\epsilon$). Again, For inline math, use single dollar signs with NO SPACES, e.g.: The diffusion constant $k_d$ depends on temperature $T$. Never use parentheses ( ) around equations or matrices - ALWAYS use $ or $$`
      : `You are a knowledgeable tutor analyzing a document. You have access to relevant sections of the document in the context message.

IMPORTANT: Keep your response under 400 tokens!!! (1200 characters)

Key instructions:
1. Base your responses primarily on the provided content
2. Be clear and concise in your explanations
3. If you're not sure about something, say so
4. Keep responses focused and relevant to the question
5. If the context doesn't fully answer the question, use your knowledge to supplement
6. Structure your responses with clear sections and bullet points when appropriate
7. Make your response in a very beautiful, well structured and easy to read format
8. For mathematical expressions, use LaTeX format with double dollar signs for display math (e.g., $$ \\epsilon = a_{\\text{actual}} - a_{\\text{setpoint}} $$) and single dollar signs for inline math (e.g., $\\epsilon$). Again, For inline math, use single dollar signs with NO SPACES, e.g.: The diffusion constant $k_d$ depends on temperature $T$. Never use parentheses ( ) around equations or matrices - ALWAYS use $ or $$`;

    const result = await model.generateContentStream([
      systemPrompt,
      `Context: ${contextText}${chatHistoryText}\n\nUser's question (Make Sure to answer it. If user specifically asks his question in another language, answer that question in the language the the question was asked in. But if unsure, answer in English (only if it is VERY unclear which language the user is speaking). Use your own knowledge if needed): ${userQuery}.`
    ]);

    // Return a stream that matches the OpenAI format
    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            yield {
              choices: [{
                delta: {
                  role: 'assistant',
                  content: chunkText
                }
              }]
            };
          }
        }
      }
    };
  } catch (error) {
    console.error('Error in generateGeminiResponse:', error);
    return handleGeminiError(error);
  }
}

export async function generateAreaSelectionResponse(messages: ChatMessage[], selectedImage?: string): Promise<any> {
  try {
    if (!selectedImage) {
      throw new Error('No image provided for image analysis');
    }

    const lastUserMessage = messages[messages.length - 1];
    const userQuery = typeof lastUserMessage.content === 'string' ? lastUserMessage.content : '';

    // Get chat history for context
    const chatHistory = messages.slice(0, -1); // Exclude the last message which is the current query
    let contextText = '';
    if (chatHistory.length > 0) {
      contextText = chatHistory
        .map(msg => {
          const content = typeof msg.content === 'string' ? msg.content : 
            Array.isArray(msg.content) ? msg.content
              .filter(item => item.type === 'text')
              .map(item => item.text)
              .join('\n') 
            : '';
          return content;
        })
        .join('\n\n');
    }

    const systemPrompt = `You are a knowledgeable tutor analyzing visual content from documents. You have access to the document's context to help you better understand and explain the image. KEEP YOUR RESPONSE UNDER 500 TOKENS (1500 CHARACTERS). MOST IMPORTANT RULE FOR THAT YOU MUST NEVER BREAK: Never use parentheses ( ) around equations or matrices or anything related to maths - ALWAYS use $ or $$. Follow these key instructions:

1. Use the provided context to understand where this image fits in the broader document/lecture
2. Analyze the image content thoroughly and accurately. Explain EVERY SINGLE PART OF THE IMAGE.
3. Connect the image content with relevant concepts from the context when applicable
4. For diagrams and figures:
   - Describe visual elements clearly
   - Explain relationships between components
   - Reference specific parts using clear terminology
   - Connect with relevant concepts from the context
5. Make your response in a very beautiful, well structured and easy to read format
6. Keep responses focused and relevant to the question
7. You are explaining content to students, so explain the content of the image very well to make sure that they understand
8. If the image contains concepts mentioned in the context, use that information to provide a more comprehensive explanation

Make sure to explain every single part of the image. You really have to teach the user.

THESE RULES ARE ABSOLUTE AND MUST BE FOLLOWED FOR EVERY SINGLE MATHEMATICAL EXPRESSION:

1. For display/block equations, use double dollar signs with NO SPACES after/before the dollars:
   $$k_d = k_0 e^{-E_a/RT}$$

2. For inline math, use single dollar signs with NO SPACES:
   The diffusion constant $k_d$ depends on temperature $T$

3. NEVER use parentheses ( ) around equations or matrices - ALWAYS use $ or $$

4. For matrices, use double dollar signs:
   $$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$$

5. For fractions in inline math, use \\frac{numerator}{denominator}:
   The rate is $\\frac{dx}{dt}$

6. For integrals, use proper LaTeX notation:
   $$\\int_0^\\infty f(x) dx$$`;

    // Extract base64 data and detect MIME type
    const mimeTypeMatch = selectedImage.match(/^data:([^;]+);base64,/);
    const base64Data = selectedImage.replace(/^data:([^;]+);base64,/, '');
    const detectedType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

    const result = await model.generateContentStream([
      systemPrompt,
      contextText ? `Context from the document/lecture:\n${contextText}\n\nPlease use this context to understand and help explain the image more comprehensively. Remember to keep your response under 500 tokens.` : '',
      {
        inlineData: {
          data: base64Data,
          mimeType: detectedType
        }
      },
      userQuery || "Please analyze and explain this content from the document, using the provided context to give a more comprehensive explanation. Answer the question in the language that user asked the question in. KEEP YOUR RESPONSE UNDER 500 TOKENS (1500 CHARACTERS)"
    ]);

    // Return a stream that matches the OpenAI format
    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            yield {
              choices: [{
                delta: {
                  role: 'assistant',
                  content: chunkText
                }
              }]
            };
          }
        }
      }
    };
  } catch (error) {
    console.error('Error in generateAreaSelectionResponse:', error);
    return handleGeminiError(error);
  }
}
