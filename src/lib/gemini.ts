import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize the Google Generative AI with API key
// Note: In production, always use environment variables
const getGeminiAPI = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env file.');
  }

  return new GoogleGenerativeAI(apiKey);
};

// Function to get a response from Gemini for text and images
export async function getChatResponse(messages: any[], imageData?: string) {
  try {
    const genAI = getGeminiAPI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const historyMessages = messages.filter(msg => msg.role !== 'model' || messages.indexOf(msg) !== 0);
    
    const lastUserMessageContent = messages.length > 0 ? messages[messages.length - 1].content : "";

    const messageParts: (string | Part)[] = [lastUserMessageContent || "Analyze the provided media."];
    if (imageData) {
      messageParts.push({
        inlineData: {
          data: imageData,
          mimeType: 'image/jpeg'
        }
      });
    }

    if (historyMessages.length > 0) {
      const chat = model.startChat({
        history: historyMessages.slice(0, -1).map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(messageParts);
      const response = await result.response;
      const text = response.text();
      return text;
    } else {
      const result = await model.generateContent(messageParts);
      const response = await result.response;
      const text = response.text();
      return text;
    }
  } catch (error) {
    console.error('Error with Gemini API:', error);
    return 'Sorry, I encountered an error. Please try again later.';
  }
}

// Function to analyze workout form from video (placeholder, uses flash as requested)
export async function analyzeWorkoutForm(videoData: any) {
  try {
    const genAI = getGeminiAPI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = "Analyze this workout video frame by frame and provide feedback.";
    
    console.warn("Video analysis with gemini-2.0-flash is complex and not fully implemented here.");
    return "Video analysis feature is under development.";

  } catch (error) {
    console.error('Error analyzing workout form (video placeholder):' , error);
    return 'Sorry, I encountered an error analyzing your workout form. Please try again later.';
  }
}
