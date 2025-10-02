import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, RotateCcw, StopCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface StreamingMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp?: Date | string;
  onRetry?: () => void;
  onCancel?: () => void;
  messageId?: string;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  role,
  content,
  isStreaming = false,
  timestamp,
  onRetry,
  onCancel,
  messageId
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef<boolean>(false);

  useEffect(() => {
    if (isStreaming && content !== displayedContent) {
      // For streaming, show content immediately as it arrives
      setDisplayedContent(content);
    } else if (!isStreaming) {
      // For non-streaming, show full content
      setDisplayedContent(content);
    }
  }, [content, isStreaming]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const formatTime = (date?: Date | string) => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-[80%] ${role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            role === 'user' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
          }`}
        >
          {role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </motion.div>

        {/* Message Content */}
        <div className="flex-1">
          <div
            className={`rounded-2xl px-4 py-3 ${
              role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            {role === 'assistant' ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom rendering for code blocks
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="relative group">
                          <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(String(children));
                              toast.success('Code copied!');
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                    // Custom rendering for links
                    a({ href, children }) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          {children}
                        </a>
                      );
                    },
                    // Custom rendering for lists
                    ul({ children }) {
                      return <ul className="list-disc list-inside space-y-1">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-inside space-y-1">{children}</ol>;
                    },
                    // Custom rendering for paragraphs
                    p({ children }) {
                      return <p className="mb-2 last:mb-0">{children}</p>;
                    }
                  }}
                >
                  {displayedContent}
                </ReactMarkdown>
                
                {/* Streaming indicator */}
                {isStreaming && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-gray-600 ml-1"
                  />
                )}
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {displayedContent}
              </div>
            )}
          </div>

          {/* Message Actions */}
          <div className="flex items-center gap-2 mt-2">
            {timestamp && (
              <span className="text-xs text-gray-500">
                {formatTime(timestamp)}
              </span>
            )}
            
            {role === 'assistant' && (
              <div className="flex items-center gap-1">
                {/* Copy button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyToClipboard}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Copy message"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </motion.button>

                {/* Retry button */}
                {onRetry && !isStreaming && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRetry}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Regenerate response"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                  </motion.button>
                )}

                {/* Cancel button */}
                {isStreaming && onCancel && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCancel}
                    className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                    title="Stop generating"
                  >
                    <StopCircle className="w-3.5 h-3.5 text-red-500" />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
