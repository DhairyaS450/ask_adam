'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Configuration
const default_websocket_url = 'ws://localhost:8080';
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || default_websocket_url; // Your backend WebSocket server URL
const AUDIO_TIMESLICE_MS = 500; // Send audio chunks every 500ms
const VIDEO_TIMESLICE_MS = 1000; // Send video chunks every 1000ms (adjust as needed)

export default function VideoChatPage() {
    return (
        <div>
            <h1>Video Chat</h1>
        </div>
    )
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [aiResponseText, setAiResponseText] = useState(''); // To display text from AI

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const aiVideoRef = useRef<HTMLVideoElement>(null); // Placeholder for potential AI video feed (if API provides it)
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingAudioRef = useRef<boolean>(false);

  // --- Audio Playback ---
  const initializeAudioPlayback = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000, // Gemini Live API output sample rate
      });
    }
  }, []);

  const playNextAudioChunk = useCallback(async () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) {
      return;
    }

    isPlayingAudioRef.current = true;
    const audioData = audioQueueRef.current.shift();

    if (audioData && audioContextRef.current) {
      try {
        const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          isPlayingAudioRef.current = false;
          // Immediately check if there's more audio to play
          requestAnimationFrame(playNextAudioChunk);
        };
        source.start();
      } catch (error) {
        console.error("Error decoding or playing audio data:", error);
        isPlayingAudioRef.current = false;
         // Continue trying to play next chunk even if one fails
        requestAnimationFrame(playNextAudioChunk);
      }
    } else {
      isPlayingAudioRef.current = false; // No data, stop playback loop temporarily
    }
  }, []);

  const handleReceivedAudio = useCallback((audioData: ArrayBuffer) => {
     // Ensure audio context is ready (might need user interaction first)
    if (!audioContextRef.current) {
        initializeAudioPlayback();
    }
     // Add received chunk to the queue
    audioQueueRef.current.push(audioData);
    // Start playback if not already playing
    if (!isPlayingAudioRef.current) {
      requestAnimationFrame(playNextAudioChunk);
    }
  }, [initializeAudioPlayback, playNextAudioChunk]);


  // --- WebSocket Handling ---
  const connectWebSocket = useCallback(() => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already open.");
      return;
    }

    setStatus('Connecting to WebSocket...');
    setAiResponseText(''); // Clear previous responses
    webSocketRef.current = new WebSocket(WEBSOCKET_URL);

    webSocketRef.current.onopen = () => {
      setStatus('WebSocket Connected. Streaming...');
      setIsStreaming(true);
      startMediaRecording(); // Start sending media data
    };

    webSocketRef.current.onmessage = (event) => {
      if (typeof event.data === 'string') {
        // Assume text data is JSON
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'text') {
            console.log('Received text:', message.payload);
            setAiResponseText((prev) => prev + message.payload); // Append text response
          } else if (message.type === 'status') {
             setStatus(`Server: ${message.payload}`);
          } else if (message.type === 'error') {
             console.error('Server Error:', message.payload);
             setStatus(`Error: ${message.payload}`);
             stopStreaming();
          }
          // Handle other potential JSON message types (e.g., session info)
        } catch (e) {
          console.error("Failed to parse JSON message or unknown text message:", event.data);
          // Assume plain text if not JSON? Or handle specific error
          setAiResponseText((prev) => prev + event.data + '\n');
        }
      } else if (event.data instanceof Blob) {
         // Assume binary data is audio (or potentially video if backend sends it)
         // Convert Blob to ArrayBuffer for AudioContext processing
        event.data.arrayBuffer().then(handleReceivedAudio);
      } else if (event.data instanceof ArrayBuffer) {
          // Handle raw ArrayBuffer (likely audio)
          handleReceivedAudio(event.data);
      } else {
          console.warn("Received unexpected message type:", event.data);
      }
    };

    webSocketRef.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setStatus('WebSocket Connection Error');
      setIsStreaming(false);
      // No need to call stopStreaming() here, onclose will handle cleanup
    };

    webSocketRef.current.onclose = (event) => {
      setStatus(`WebSocket Disconnected: ${event.reason || 'Connection closed'}`);
      setIsStreaming(false);
      stopMediaRecording(); // Ensure recorders are stopped
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      if (userVideoRef.current) userVideoRef.current.srcObject = null;
      // Reset AI display/audio queue
      setAiResponseText('');
      audioQueueRef.current = [];
      isPlayingAudioRef.current = false;
      audioContextRef.current?.close().then(() => audioContextRef.current = null); // Clean up AudioContext
      webSocketRef.current = null; // Clear the ref
    };
  }, [handleReceivedAudio]); // Include dependencies

  // --- Media Recording ---
  const startMediaRecording = useCallback(() => {
    if (!mediaStreamRef.current || !webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("Cannot start recording: Media stream or WebSocket not ready.");
      return;
    }

    // Audio Recording
    try {
        const audioTracks = mediaStreamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
            const audioStream = new MediaStream(audioTracks);
             // Check for Opus support, fallback to default
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
              ? 'audio/webm;codecs=opus'
              : 'audio/webm'; // Fallback or choose another compatible format

            audioRecorderRef.current = new MediaRecorder(audioStream, { mimeType });

            audioRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0 && webSocketRef.current?.readyState === WebSocket.OPEN) {
                    // Send audio data as binary
                    webSocketRef.current.send(event.data);
                }
            };

            audioRecorderRef.current.start(AUDIO_TIMESLICE_MS);
            console.log(`Audio recording started (mimeType: ${mimeType}, timeslice: ${AUDIO_TIMESLICE_MS}ms)`);
        } else {
            console.warn("No audio tracks found in media stream.");
        }
    } catch (error) {
        console.error("Error starting audio recorder:", error);
    }

    // Video Recording (Optional - uncomment/adapt if needed)
    try {
        const videoTracks = mediaStreamRef.current.getVideoTracks();
        if (videoTracks.length > 0) {
            const videoStream = new MediaStream(videoTracks);
             // Check for VP9/VP8 support, fallback to default
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
              ? 'video/webm;codecs=vp9'
              : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
              ? 'video/webm;codecs=vp8'
              : 'video/webm';

            videoRecorderRef.current = new MediaRecorder(videoStream, { mimeType });

            videoRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0 && webSocketRef.current?.readyState === WebSocket.OPEN) {
                    // Send video data as binary - backend needs to handle this
                    webSocketRef.current.send(event.data);
                     // console.log(`Sent video chunk: ${event.data.size} bytes`);
                }
            };

            videoRecorderRef.current.start(VIDEO_TIMESLICE_MS);
            console.log(`Video recording started (mimeType: ${mimeType}, timeslice: ${VIDEO_TIMESLICE_MS}ms)`);
        } else {
             console.warn("No video tracks found in media stream.");
        }
    } catch (error) {
        console.error("Error starting video recorder:", error);
    }

  }, []); // No external dependencies needed here, refs are stable

  const stopMediaRecording = useCallback(() => {
    if (audioRecorderRef.current && audioRecorderRef.current.state !== "inactive") {
      audioRecorderRef.current.stop();
      console.log("Audio recording stopped.");
    }
    audioRecorderRef.current = null;

    if (videoRecorderRef.current && videoRecorderRef.current.state !== "inactive") {
      videoRecorderRef.current.stop();
      console.log("Video recording stopped.");
    }
    videoRecorderRef.current = null;
  }, []);

  // --- Main Control Functions ---
  const startStreaming = useCallback(async () => {
    // Ensure audio context can start (requires user interaction)
    initializeAudioPlayback();
    if (audioContextRef.current?.state === 'suspended') {
       await audioContextRef.current.resume();
    }

    setStatus('Requesting permissions...');
    setAiResponseText('');
    audioQueueRef.current = []; // Clear audio queue

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        // Request audio at 16kHz if possible, browser might adjust
        audio: {
            sampleRate: 16000, // Gemini Live API input sample rate
            channelCount: 1,   // Mono audio
        }
      });
      mediaStreamRef.current = stream;
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
      // Connect WebSocket AFTER getting media stream
      connectWebSocket();

    } catch (error) {
      console.error('Error accessing media devices:', error);
      setStatus('Permission denied or error.');
      setIsStreaming(false);
    }
  }, [connectWebSocket, initializeAudioPlayback]); // Add dependencies

  const stopStreaming = useCallback(() => {
     // This function mainly initiates the closing sequence.
     // The actual cleanup happens in webSocketRef.current.onclose
    if (webSocketRef.current) {
      setStatus('Disconnecting...');
      webSocketRef.current.close(1000, "User initiated disconnect"); // Graceful disconnect
    } else {
       // If WS never connected or is already closed, clean up media directly
       stopMediaRecording();
       mediaStreamRef.current?.getTracks().forEach(track => track.stop());
       mediaStreamRef.current = null;
       if (userVideoRef.current) userVideoRef.current.srcObject = null;
       setStatus('Idle');
       setIsStreaming(false);
       setAiResponseText('');
       audioQueueRef.current = [];
       isPlayingAudioRef.current = false;
       audioContextRef.current?.close().then(() => audioContextRef.current = null);
    }
  }, [stopMediaRecording]); // Add dependency

  // --- Cleanup Effect ---
  useEffect(() => {
    // Cleanup function to stop streaming when component unmounts
    return () => {
      console.log("VideoChatPage unmounting, cleaning up...");
      stopStreaming();
    };
  }, [stopStreaming]); // Add dependency

  // --- Render ---
  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Gemini Video Chat</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-4 w-full max-w-4xl">
        {/* User Video */}
        <div className="flex-1 border rounded p-2 bg-gray-800">
          <h2 className="text-center text-lg mb-2 text-white">You</h2>
          <video ref={userVideoRef} autoPlay muted playsInline className="w-full rounded aspect-video bg-black" />
        </div>
        {/* AI Response Area */}
        <div className="flex-1 border rounded p-4 bg-gray-700 flex flex-col">
           <h2 className="text-center text-lg mb-2 text-white">Gemini</h2>
           {/* AI Video Placeholder - Render if/when API supports video output */}
           {/* <video ref={aiVideoRef} autoPlay playsInline className="w-full rounded bg-gray-600 aspect-video mb-2" /> */}
           <div className="flex-grow bg-gray-600 rounded p-3 text-white overflow-y-auto min-h-[200px]">
                <pre className="whitespace-pre-wrap text-sm">{aiResponseText || "(AI response will appear here)"}</pre>
           </div>
        </div>
      </div>
      {/* Controls */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={startStreaming}
          disabled={isStreaming}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Chat
        </button>
        <button
          onClick={stopStreaming}
          disabled={!isStreaming}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Stop Chat
        </button>
      </div>
      <p className="text-sm text-gray-300">Status: <span className="font-semibold">{status}</span></p>
    </div>
  );
} 