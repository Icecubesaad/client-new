import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  onReconnect?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isReconnecting,
  onReconnect
}) => {
  if (isConnected) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
          ${isReconnecting 
            ? 'bg-yellow-100 border border-yellow-300 text-yellow-800' 
            : 'bg-red-100 border border-red-300 text-red-800'
          }
        `}>
          {isReconnecting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium">Reconnecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Connection lost</span>
              {onReconnect && (
                <button
                  onClick={onReconnect}
                  className="ml-2 text-xs underline hover:no-underline"
                >
                  Retry
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
