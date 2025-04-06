'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpTrayIcon, PlayCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { analyzeWorkoutForm } from '@/lib/gemini'; // Assuming this will handle video later
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

const FormCheckUI: React.FC = () => {
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clean up the object URL when the component unmounts or video changes
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedVideoFile(file);
      setFeedback(""); // Clear previous feedback

      // Create a URL for preview
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    } else {
      alert("Please select a valid video file.");
      setSelectedVideoFile(null);
      setVideoPreviewUrl(null);
    }
    // Reset file input value so the same file can be selected again
     if (event.target) {
       event.target.value = "";
     }
  };

  const handleRemoveVideo = () => {
    setSelectedVideoFile(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
    setFeedback("");
    setIsLoading(false);
  };

  const handleAnalyzeClick = async () => {
    if (!selectedVideoFile) {
      alert("Please select a video first.");
      return;
    }

    setIsLoading(true);
    setFeedback("");

    try {
      // Placeholder: Pass necessary video data to the function.
      // analyzeWorkoutForm currently expects 'any' and returns placeholder text.
      // Real implementation will depend on how the API needs the video data.
      const analysisResult = await analyzeWorkoutForm(selectedVideoFile); // Pass the file object for now
      setFeedback(analysisResult);
    } catch (error) {
      console.error("Error analyzing video:", error);
      setFeedback("An error occurred while analyzing the video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading animation (similar to Chat.tsx)
  const LoadingAnimation = () => (
    <div className="flex items-center justify-center space-x-2 my-4">
        <motion.div
            className="w-3 h-3 rounded-full bg-primary"
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="w-3 h-3 rounded-full bg-primary"
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="w-3 h-3 rounded-full bg-primary"
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
        />
         <span className="ml-2 text-gray-600 dark:text-gray-300">Analyzing your form...</span>
    </div>
  );


  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        style={{ display: 'none' }}
      />

      {!selectedVideoFile && (
        <div className="text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 cursor-pointer hover:border-primary dark:hover:border-primary transition" onClick={handleFileButtonClick}>
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Click to upload a video</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">MP4, AVI, MOV, etc. up to 20MB</p>
        </div>
      )}

      {selectedVideoFile && videoPreviewUrl && (
        <div className="mb-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
             <video controls src={videoPreviewUrl} className="w-full h-full object-contain">
               Your browser does not support the video tag.
            </video>
            <button
              onClick={handleRemoveVideo}
              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition"
              title="Remove video"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 truncate" title={selectedVideoFile.name}>
            Selected: {selectedVideoFile.name}
          </p>
          <button
            onClick={handleAnalyzeClick}
            disabled={isLoading}
            className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm dark:text-white text-gray-800 bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <PlayCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {isLoading ? 'Analyzing...' : 'Analyze Form'}
          </button>
        </div>
      )}

      {isLoading && <LoadingAnimation />}

      {feedback && !isLoading && (
         <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
             <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Feedback:</h3>
             <div className="prose dark:prose-invert max-w-none markdown-content text-gray-700 dark:text-gray-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
             </div>
         </div>
       )}
    </div>
  );
};

export default FormCheckUI;
