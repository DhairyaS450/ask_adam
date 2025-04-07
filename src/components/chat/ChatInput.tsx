import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PhotoIcon, MicrophoneIcon } from '@heroicons/react/24/solid';

// Define SpeechRecognition type for window object
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInputProps {
  onSendMessage: (message: string, imageData?: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(prevMessage => prevMessage + transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech Recognition not supported in this browser.');
    }

  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedImage) && !isLoading) {
      onSendMessage(message, selectedImage || undefined);
      setMessage('');
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceInput = () => {
    if (!speechRecognitionSupported || !recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept="image/*" 
        style={{ display: 'none' }} 
      />
      
      {selectedImage && (
        <div className="absolute bottom-full left-0 mb-2 p-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-md">
          <img 
            src={`data:image/jpeg;base64,${selectedImage}`}
            alt="Selected preview" 
            className="w-16 h-16 object-cover rounded"
          />
          <button 
            type="button"
            onClick={() => { 
              setSelectedImage(null); 
              if (fileInputRef.current) fileInputRef.current.value = "";
              setMessage(""); 
            }}
            className="absolute top-0 right-0 -mt-2 -mr-2 p-1 bg-red-500 text-white rounded-full text-xs"
          >
            X
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={handleImageButtonClick}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          disabled={isLoading}
        >
          <PhotoIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        
        <div className="relative flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-300 dark:border-gray-600">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? "Image selected. Press send or type message..." : "Ask about workouts, nutrition, or upload an image..."}
            className="w-full py-3 px-4 outline-none bg-transparent resize-none max-h-32"
            rows={1}
            style={{ minHeight: '44px' }}
            disabled={isLoading}
          />
        </div>
        
        <button
          type="button"
          onClick={handleVoiceInput}
          className={`p-2 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors ${!speechRecognitionSupported && 'opacity-50 cursor-not-allowed'}`}
          disabled={isLoading || !speechRecognitionSupported}
          title={speechRecognitionSupported ? (isRecording ? "Stop recording" : "Start voice input") : "Voice input not supported"}
        >
          <MicrophoneIcon className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
        </button>
        
        <button
          type="submit"
          className={`p-3 rounded-full ${
            (message.trim() || selectedImage) && !isLoading
              ? 'bg-primary hover:bg-primary-dark'
              : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
          } transition-colors`}
          disabled={!(message.trim() || selectedImage) || isLoading}
        >
          <PaperAirplaneIcon className="w-5 h-5 dark:text-white text-black" />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
