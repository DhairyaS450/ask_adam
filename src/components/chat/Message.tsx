import React from 'react';
import { motion } from 'framer-motion';
import { UserIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
  content: string;
  isUser: boolean;
  timestamp?: Date;
  isActionConfirmation?: boolean;
}

const Message: React.FC<MessageProps> = ({ 
  content, 
  isUser, 
  timestamp = new Date(),
  isActionConfirmation = false
}) => {
  // Define markdown components - reuse the link renderer
  const markdownComponents: Components = {
    a: ({ node, ...props }: any) => (
      <a 
        className="text-green-700 dark:text-green-300 font-medium hover:underline"
        style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }} 
        {...props} 
      />
    ),
  };

  if (isActionConfirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center mb-4"
      >
        <div className="flex items-center bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100 px-4 py-2 rounded-full shadow-sm">
          <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          {/* Use ReactMarkdown here */}
          <div className="text-sm font-medium">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents} // Use the defined link renderer
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          {isUser ? (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-gray-500 dark:text-white dark:bg-gray-600">
              <UserIcon className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 overflow-hidden rounded-full">
              <img 
                src="/images/logo-512x512.png" 
                alt="Ask Adam Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`rounded-2xl px-4 py-3 ${ isUser
                ? 'bg-blue-100 text-gray-800 dark:text-white dark:bg-gray-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white'
              }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap m-0 break-words">{content}</p>
            ) : (
              <div className="markdown-content max-w-none break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline ? (
                        <pre className="bg-gray-200 dark:bg-gray-700 p-3 rounded-md my-2 overflow-x-auto">
                          <code className={`language-${match?.[1] || ''}`} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                    a: ({ node, ...props }: any) => (
                      <a 
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }} 
                        {...props} 
                      />
                    ),
                    ul: ({ node, ...props }: any) => (
                      <ul className="list-disc pl-5 my-2" {...props} />
                    ),
                    ol: ({ node, ...props }: any) => (
                      <ol className="list-decimal pl-5 my-2" {...props} />
                    ),
                    li: ({ node, ...props }: any) => <li className="mb-1" {...props} />,
                    h1: ({ node, ...props }: any) => (
                      <h1 className="text-2xl font-bold my-4" {...props} />
                    ),
                    h2: ({ node, ...props }: any) => (
                      <h2 className="text-xl font-semibold my-3" {...props} />
                    ),
                    h3: ({ node, ...props }: any) => (
                      <h3 className="text-lg font-semibold my-2" {...props} />
                    ),
                  } as Components}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          <span className="text-xs text-gray-500 mt-1">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default Message;
