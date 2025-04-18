import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import ChatInput from './ChatInput';
import { getChatResponse } from '@/lib/gemini';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ACTION_MARKERS } from '@/lib/gemini-actions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date; // Keep as Date object for internal use
  isActionConfirmation?: boolean;
};

// Type for stored messages (dates as strings)
interface StoredChatMessage extends Omit<ChatMessage, 'timestamp'> {
  timestamp: string;
}

interface UserProfile {
  name?: string;
  height?: string;
  weight?: string;
  age?: string;
  gender?: string;
  goals?: string[];
  timeConstraints?: string;
  availableSpaceEquipment?: string;
  medicalConditions?: string;
  injuries?: string;
  dietaryPreferences?: string;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

const CHAT_STORAGE_KEY = 'adamChatMessages';

const defaultInitialMessage: ChatMessage = {
  id: '1',
  content: "Hi there! I'm Adam, your personal fitness assistant. I can help you create personalized workout plans, provide nutrition advice, and analyze your workout form. However, to make it more personalized, you should go to the settings tab and check out your profile. How can I assist you today?",
  role: 'assistant',
  timestamp: new Date(),
};

const Chat: React.FC = () => {
  // Load messages directly in useState initializer
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') { // Check if running on server
      return [defaultInitialMessage];
    }
    try {
      const storedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedMessages && storedMessages !== '[]') {
        const parsedMessages: StoredChatMessage[] = JSON.parse(storedMessages);
        return parsedMessages.map(msg => ({ // Return loaded messages
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      } else {
        return [defaultInitialMessage]; // Return default if storage empty
      }
    } catch (error) {
      console.error('Error loading messages from local storage:', error);
      return [defaultInitialMessage]; // Fallback to default message on error
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, userData } = useAuth();

  // Save messages to local storage whenever they change
  useEffect(() => {
    try {
      // Convert Date objects to strings for JSON compatibility
      const messagesToStore: StoredChatMessage[] = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }));
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToStore));
    } catch (error) {
      console.error('Error saving messages to local storage:', error);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, imageData?: string) => {
    if (!content.trim() && !imageData) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let response = "";
    let userProfile: UserProfile | null = null; 
    let workoutPlan; 

    // Construct userProfile object from userData.preferences if available
    if (userData?.preferences) {
        const prefs = userData.preferences;
        userProfile = {
            // Basic Info
            name: prefs.firstName, // Use firstName as the primary name
            age: prefs.age ? String(prefs.age) : undefined, // Convert age to string if exists
            gender: prefs.gender,
            // Physical Characteristics - handle complex height/weight
            height: typeof prefs.height === 'object' && prefs.height?.ft 
                      ? `${prefs.height.ft}ft ${prefs.height.in ?? 0}in` 
                      : typeof prefs.height === 'number' 
                      ? `${prefs.height}cm`
                      : undefined,
            weight: prefs.weight ? `${prefs.weight}${prefs.weightUnit ?? 'lbs'}` : undefined,
            // Goals
            goals: [prefs.primaryGoal, prefs.secondaryGoal].filter(Boolean) as string[], // Combine goals, filter empty
            // Activity & Time
            fitnessLevel: prefs.activityLevel, // Map activityLevel to fitnessLevel
            timeConstraints: `${prefs.workoutDuration ?? 'any'} duration, on ${prefs.availableDays?.join(', ') ?? 'any day'}`, // Combine duration/days
            // Equipment & Environment
            availableSpaceEquipment: `${prefs.availableEquipment?.join(', ') ?? 'None specified'}. ${prefs.hasGymMembership ? 'Has gym membership.' : 'No gym membership.'}`,
            // Medical/Limitations (Combine into single fields for simplicity in prompt)
            medicalConditions: [prefs.medicalConditions, prefs.otherLimitations].filter(Boolean).join('; ') || undefined,
            injuries: prefs.injuries || undefined,
            // Dietary preferences seem missing from UserPreferences, keep undefined for now
            dietaryPreferences: undefined,
        };
    }

    const workoutPlanDoc = doc(db, 'userWorkouts', user?.uid!);
    const workoutPlanSnapshot = await getDoc(workoutPlanDoc);
    if (workoutPlanSnapshot.exists()) {
      workoutPlan = workoutPlanSnapshot.data();
    }

    try {
      const messageHistoryForApi = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content,
      })) as { role: 'user' | 'model'; content: string }[];

      messageHistoryForApi.push({
        role: 'user',
        content: content,
      });

      response = await getChatResponse(messageHistoryForApi, userProfile, workoutPlan, imageData);

      // Check if response contains any action markers
      const containsAction = ACTION_MARKERS.some(marker => response.includes(marker));
      
      if (containsAction) {
        // Process the response to extract actions and clean content
        let cleanedContent = response;
        const actionMessages: ChatMessage[] = [];
        
        // Process each action marker
        for (const marker of ACTION_MARKERS) {
          let markerIndex = cleanedContent.indexOf(marker);
          
          while (markerIndex !== -1) {
            // Extract content before the marker
            const contentBeforeMarker = cleanedContent.substring(0, markerIndex).trim();
            
            // Look for the JSON object that follows the marker
            // It starts with '{' and ends with '}'
            const jsonStartIndex = cleanedContent.indexOf('{', markerIndex);
            if (jsonStartIndex !== -1) {
              let bracketCount = 1;
              let jsonEndIndex = jsonStartIndex + 1;
              
              // Find the matching closing bracket
              while (bracketCount > 0 && jsonEndIndex < cleanedContent.length) {
                if (cleanedContent[jsonEndIndex] === '{') bracketCount++;
                if (cleanedContent[jsonEndIndex] === '}') bracketCount--;
                jsonEndIndex++;
              }
              
              if (bracketCount === 0) {
                // We found the complete JSON object
                // Remove it and the marker from the content
                cleanedContent = contentBeforeMarker;
                
                // Create action confirmation message
                let actionMessage = '';
                if (marker === 'CREATE_WORKOUT_DAY') {
                  actionMessage = "Created a workout day on your account. To see your changes, go to the [Workouts tab](/workout).";
                } else if (marker === 'EDIT_WORKOUT_DAY') {
                  actionMessage = "Updated your workout day. To see your changes, go to the [Workouts tab](/workout).";
                } else if (marker === 'DELETE_WORKOUT_DAY') {
                  actionMessage = "Deleted a workout day from your account. To see your changes, go to the [Workouts tab](/workout).";
                } else if (marker === 'UPDATE_PROFILE') {
                  actionMessage = "Updated your profile. To see your changes, go to the [Settings tab](/settings).";
                }
                
                actionMessages.push({
                  id: (Date.now() + Math.random() * 1000).toString(),
                  content: actionMessage,
                  role: 'assistant',
                  timestamp: new Date(),
                  isActionConfirmation: true
                });
              }
            }
            
            // Look for the next occurrence of this marker
            markerIndex = cleanedContent.indexOf(marker, markerIndex + 1);
          }
        }
        
        // Add the main content message first if there's any content left
        if (cleanedContent.trim()) {
          const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            content: cleanedContent,
            role: 'assistant',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, assistantMessage, ...actionMessages]);
        } else {
          // If no main content, just add the action messages
          setMessages(prev => [...prev, ...actionMessages]);
        }
      } else {
        // Regular message with no actions
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response,
          role: 'assistant',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error getting chat response:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I couldn't process your request. Please try again.",
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([defaultInitialMessage]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    // Optionally: You might want to immediately save the default message state back
    // localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([{...defaultInitialMessage, timestamp: defaultInitialMessage.timestamp.toISOString()}]));
  };

  const LoadingAnimation = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start mb-4"
      >
        <div className="flex max-w-[80%]">
          <div className="mr-3">
            <div className="w-10 h-10 overflow-hidden rounded-full">
              <img 
                src="/images/logo-512x512.png" 
                alt="Ask Adam Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-start">
            <div className="rounded-2xl px-5 py-3 bg-gray-100 dark:bg-black text-gray-800 dark:text-white">
              <div className="flex items-center h-6">
                <motion.div 
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="w-2 h-2 mx-2 rounded-full bg-primary"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
            
            <span className="text-xs text-gray-500 mt-1">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-lg max-h-[90vh] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <Message
              key={message.id}
              content={message.content}
              isUser={message.role === 'user'}
              timestamp={message.timestamp}
              isActionConfirmation={message.isActionConfirmation}
            />
          ))}
          {isLoading && <LoadingAnimation />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          {/* Add Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none"
          >
            Clear Chat History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
