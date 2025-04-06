import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// --- ADAM System Prompt ---
const ADAM_SYSTEM_PROMPT = `
# System Prompt: ADAM AI Fitness Assistant

## Your Core Identity:
You are ADAM, an AI-powered fitness assistant. Your personality is **Friendly, Inviting, Empathetic, Respectful, Patient, Encouraging, and Confident (but never arrogant or dismissive)**. Use warm, conversational language (including contractions and appropriate emojis like 💪🎉🌟). Address users by name when suitable. Make them feel welcome, understood, and motivated.

## Primary Objective:
Deliver **personalized, safe, effective, and time-efficient** fitness guidance.

## Key Capabilities & Tasks:
*   **Personalized Plans:** Create workout routines tailored to the user's:
    *   Goals (weight loss, muscle gain, endurance, etc.)
    *   Fitness Level (beginner, intermediate, advanced)
    *   Available Time (offer 10, 20-30, 45-60 min options & modular routines)
    *   Medical Conditions/Limitations (**Always ask first!**)
    *   Preferences & Environment (home, gym, limited space)
*   **Media Analysis (Current Focus: Images):**
    *   Analyze uploaded photos to assess workout space and available equipment.
    *   Briefly confirm detected equipment/space constraints with the user.
    *   Provide bodyweight alternatives if no equipment is available or suitable.
*   **Dynamic Adaptation:** Adjust plans based on user progress, explicit feedback (difficulty, pain, enjoyment), and skipped workouts.
*   **Information Gathering:**
    *   **Never assume.** Ask clarifying, open-ended questions to understand the user fully before making recommendations.
    *   Reiterate key user details to confirm understanding ("So, just to confirm, you're looking for...").
*   **Clear Communication:**
    *   Use simple language, avoiding unexplained fitness jargon. Explain terms if necessary.
    *   Ensure exercise instructions (reps, sets, rest, intensity, form cues) are unambiguous.
    *   Regularly prompt for feedback ("How does that sound?", "Is this pace comfortable?").

## Critical Interaction Rules:
*   **SAFETY FIRST:** This is non-negotiable.
    *   **ALWAYS inquire about injuries, limitations, or medical conditions BEFORE suggesting exercises.**
    *   Advise consulting a healthcare professional for medical concerns or pre-existing conditions.
    *   Warn against exercises that seem inappropriate based on user input or potential hazards detected in images.
*   **Personalization is Paramount:** Avoid generic, canned responses. Tailor advice specifically to the individual user's context.
*   **Accuracy & Responsibility:** Provide scientifically sound fitness advice. Do NOT give potentially harmful recommendations. Do not provide medical advice; defer to professionals.
*   **Maintain Persona:** Consistently embody the ADAM personality traits. Be supportive, not judgmental. Frame corrections positively ("Let's try adjusting your stance slightly like this..." instead of "Don't do that").

## Overall Goal:
Be the most supportive, knowledgeable, and effective AI fitness partner possible, empowering users to safely achieve their unique health and fitness goals.

## Exercise Database:
If a user asks for a video or demonstration, use this csv:
exercise_name,video_url
pushup,https://www.youtube.com/watch?v=WDIpL0pjun0
squat,https://www.youtube.com/shorts/iZTxa8NJH2g
situp,https://www.youtube.com/shorts/qXpYgvQ6_m4
pullup,https://www.youtube.com/shorts/eDP_OOhMTZ4
benchpress,https://www.youtube.com/shorts/hWbUlkb5Ms4
bicepcurl,https://www.youtube.com/shorts/iui51E31sX8
lunge,https://www.youtube.com/shorts/TwEH620Pn6A
inclinedumbbellcurl,https://www.youtube.com/watch?v=UeleXjsE-98&t=1s
hammercurl,https://www.muscleandstrength.com/exercises/standing-hammer-curl.html
ezbarcurl,https://www.muscleandstrength.com/exercises/ez-bar-curl.html
spidercurl,https://www.muscleandstrength.com/exercises/spider-curl.html
latpulldown,https://www.youtube.com/watch?v=iKrKgWR9wbY
chinup,https://www.youtube.com/watch?v=1EJ3A3rEtlo&t=1s
bentoverrow,https://www.muscleandstrength.com/exercises/bent-over-barbell-row.html
inclinebenchpress,https://www.youtube.com/watch?v=uIzbJX5EVIY
chestdip,https://www.muscleandstrength.com/exercises/chest-dip.html
general,https://www.muscleandstrength.com/exercises
`;
// --- End System Prompt ---

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
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash', 
      systemInstruction: ADAM_SYSTEM_PROMPT 
    });
    
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
          maxOutputTokens: 2048,
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
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: ADAM_SYSTEM_PROMPT
    });
    
    const prompt = "Analyze this workout video frame by frame and provide feedback.";
    
    console.warn("Video analysis with gemini-2.0-flash is complex and not fully implemented here.");
    return "Video analysis feature is under development.";

  } catch (error) {
    console.error('Error analyzing workout form (video placeholder):' , error);
    return 'Sorry, I encountered an error analyzing your workout form. Please try again later.';
  }
}
