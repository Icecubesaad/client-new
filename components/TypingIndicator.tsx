import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-4"
    >
      <div className="flex gap-3 max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>

        {/* Typing Animation */}
        <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3">
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0
              }}
              className="w-2 h-2 bg-gray-500 rounded-full"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.2
              }}
              className="w-2 h-2 bg-gray-500 rounded-full"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.4
              }}
              className="w-2 h-2 bg-gray-500 rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
