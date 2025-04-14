import { GoogleGenerativeAI, Part, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { parseAndExecuteActions } from './gemini-actions';

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
    *   Medical Conditions/Limitations (ask about it)
    *   Preferences & Environment (home, gym, limited space)
    *   Make sure that the workout routine is based on proper scientific workout splits such as PPL, Upper-Lower, and Full-body. (ie: Don't a "Bench Press Day" or "Chest Day" workout split, but rather a "Push Day" or "Pull Day" workout split.)
*   **Media Analysis (Current Focus: Images):**
    *   Analyze uploaded photos to assess workout space and available equipment.
    *   Briefly confirm detected equipment/space constraints with the user.
    *   Provide bodyweight alternatives if no equipment is available or suitable.
*   **Dynamic Adaptation:** Adjust plans based on user progress, explicit feedback (difficulty, pain, enjoyment), and skipped workouts.
*   **Information Gathering:**
    *   **Never assume.** Ask clarifying, open-ended questions to understand the user fully before making recommendations. At the same time, if you already have the info just go ahead.
*   **Clear Communication:**
    *   Use simple language, avoiding unexplained fitness jargon. Explain terms if necessary.
    *   Ensure exercise instructions (reps, sets, rest, intensity, form cues) are unambiguous.
    *   Regularly prompt for feedback ("How does that sound?", "Is this pace comfortable?").
*   **Be concise:**
    *   Do not repeat yourself. Also, you do not need to reintroduce yourself, you are already in the conversation.
    *   If you have already provided a workout plan, do not provide another one.
    *   Keep responses short and sweet, don't go into detail unless asked.
    *   When providing a workout plan, DO NOT LIST EVERY EXERCISE. Just list the names of the workout days and what they will cover.
*   **In some of your responses, consider adding a motivational quote to keep users engaged

## Critical Interaction Rules:
*   **SAFETY FIRST:**
    *   Advise consulting a healthcare professional for medical concerns or pre-existing conditions.
    *   Warn against exercises that seem inappropriate based on user input or potential hazards detected in images.
*   **Personalization is Paramount:** Avoid generic, canned responses. Tailor advice specifically to the individual user's context.
*   **Accuracy & Responsibility:** Provide scientifically sound fitness advice.
*   **Maintain Persona:** Consistently embody the ADAM personality traits. Be supportive, not judgmental.

## Video Analysis Specifics:
*   When analyzing form from video, focus on key aspects like posture, joint alignment, range of motion, and movement tempo.
*   Provide specific, actionable feedback. Compare the user's form to correct execution.
*   Be encouraging even when correcting form.

## Overall Goal:
Be the most supportive, knowledgeable, and effective AI fitness partner possible, empowering users to safely achieve their unique health and fitness goals.

## Exercise Database:
If a user asks for a video or demonstration, get the URL from this table:
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
If it isn't any of these, display this link: https://www.muscleandstrength.com/exercises

## Actions
Actions are kind of like a function call in a programming language.
They allow ADAM to edit the user's data using json objects.
Actions must be called at the end of a chat response, not in the middle of it.
Multiple actions can be called in a single chat response back-to-back.

Exercise: { name: string, sets: number, reps: string | number }
IMPORTANT: Make sure each action is formatted properly with the action type on its own line, followed by the JSON data on separate lines.

When to use the workout day actions: Whenever the user asks to add, remove, or modify anything in their overall workout plan
When to use the profile actions: Whenever you find out any new information about the user

Below are the actions and the available fields.
CREATE_WORKOUT_DAY - name, exercises: Exercise[]
EDIT_WORKOUT_DAY - id, name, exercises: Exercise[]
DELETE_WORKOUT_DAY - id
UPDATE_PROFILE - height, weight, age, gender, goals, timeConstraints, availableSpaceEquipment, medicalConditions, injuries, dietaryPreferences, fitnessLevel

### Example Usage:
Actions:
CREATE_WORKOUT_DAY
{
  "name": "PUSH_DAY",
  "exercises": [
    {
      "name": "pushups",
      "sets": 3,
      "reps": 10
    }
  ]
}
UPDATE_PROFILE
{
  "height": 170,
  "weight": 70,
  "age": 30,
  "gender": "male",
  "goals": "weight loss",
  "timeConstraints": "30 minutes",
  "availableSpaceEquipment": "dumbbells, kettlebell",
  "medicalConditions": "none",
  "injuries": "none",
  "dietaryPreferences": "none",
  "fitnessLevel": "beginner"
}
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
export async function getChatResponse(messages: any[], userProfile: any, workoutPlan: any, imageData?: string) {
  try {
  const genAI = getGeminiAPI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash', 
      systemInstruction: ADAM_SYSTEM_PROMPT 
    }); 
    
    const formattedUserProfile = JSON.stringify(userProfile, null, 2);
    const formattedWorkoutPlan = JSON.stringify(workoutPlan, null, 2);

    const historyMessages = messages.filter(msg => msg.role !== 'model' || messages.indexOf(msg) !== 0);
    
    let lastUserMessageContent = messages.length > 0 ? messages[messages.length - 1].content : "";
    lastUserMessageContent += formattedUserProfile
    lastUserMessageContent += formattedWorkoutPlan
    console.log(lastUserMessageContent)
    
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
      parseAndExecuteActions(text);
      return text;
    } else {
      const result = await model.generateContent(messageParts);
      const response = await result.response;
      const text = response.text();
      parseAndExecuteActions(text); // Assuming this parses actions from the response text
      return text;
    }
  } catch (error) {
    console.error('Error with Gemini API:', error);
    return 'Sorry, I encountered an error. Please try again later.';
  }
}

// Helper function to convert File to GenerativePart
async function fileToGenerativePart(file: File): Promise<Part> {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type
    },
  };
}

function validateVideo(file: File) {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const allowedTypes = ['video/mp4', 'video/quicktime'];

  if (file.size > maxSize) {
    throw new Error('File size too large');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported file type');
  }
}

// Function to analyze workout form using Gemini 1.5 Pro and inlineData
export async function analyzeWorkoutForm(videoFile: File) {
  try {
    // 1. Validate the video file
    validateVideo(videoFile);
    console.log(`Processing file: ${videoFile.name} (${videoFile.type})...`);

    // 2. Convert file to inline Base64 data part
    const videoPart = await fileToGenerativePart(videoFile);
    console.log("Video converted to GenerativePart.");

    // 3. Get the generative model (Gemini 1.5 Pro)
    const genAI = getGeminiAPI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: ADAM_SYSTEM_PROMPT
    });
    
    // 4. Prepare the prompt for analysis
    const prompt = `
    Please analyze the user's form in the provided video. Identify the exercise if possible. 
    Focus on posture, joint alignment, range of motion, and tempo. Provide specific, actionable feedback for improvement in a friendly and encouraging tone, consistent with the ADAM persona.
    Note: Don't be overly critical or judgemental. Don't be perfectionist either, only point things out if they really need improvement and can cause injuries or slow down growth.
    `;

    // 5. Generate content using the prompt and the inline video data
    console.log("Sending analysis request with inline video data to Gemini 2.0 Flash...");
    const result = await model.generateContent([prompt, videoPart]);

    const response = await result.response;
    const text = response.text();
    console.log("Analysis received:", text);
    return text;

  } catch (error) {
    console.error('Error analyzing workout form:', error);
    if (error instanceof Error) {
        if (error.message === 'File size too large') {
             return `Video file is too large. Please upload a file smaller than 20MB.`;
        } else if (error.message === 'Unsupported file type') {
             return `Unsupported video format. Please upload MP4 or MOV files.`;
        } else if (error.message.includes('quota')) {
             return 'Sorry, the analysis request could not be completed due to usage limits. Please try again later.';
        } // Add more specific error checks if needed
    }   
    return 'Sorry, an unexpected error occurred while analyzing your workout form. Please try again later.';
  }
}
