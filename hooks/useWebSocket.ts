import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

interface WebSocketMessage {
  chatId: string;
  messageId: string;
  chunk?: string;
  fullContent?: string;
  isComplete: boolean;
  timestamp: string;
}

interface WebSocketError {
  type: string;
  message: string;
  chatId?: string;
  timestamp: string;
}

interface ChatUpdateData {
  chatId: string;
  title: string;
  updatedAt: string;
}

interface UseWebSocketProps {
  onMessageChunk?: (data: WebSocketMessage) => void;
  onMessageComplete?: (data: WebSocketMessage) => void;
  onTypingStart?: (chatId: string) => void;
  onTypingStop?: (chatId: string) => void;
  onError?: (error: WebSocketError) => void;
  onChatUpdate?: (data: ChatUpdateData) => void;
}

export const useWebSocket = ({
  onMessageChunk,
  onMessageComplete,
  onTypingStart,
  onTypingStop,
  onError,
  onChatUpdate
}: UseWebSocketProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    
    console.log('🔧 WebSocket Connection Debug:', {
      backendUrl: API_BASE_URL,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR',
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'SSR',
      timestamp: new Date().toISOString()
    });
    
    if (!API_BASE_URL) {
      const error = 'Backend URL not configured for WebSocket';
      console.error('❌ WebSocket Config Error:', error);
      toast.error(`WebSocket Error: ${error}`);
      return;
    }

    console.log('Connecting to WebSocket at:', API_BASE_URL);

    const token = Cookies.get('token');
    
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket connection
    const socket = io(BACKEND_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true,
      forceNew: true,
      autoConnect: true,
      upgrade: true
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      toast.success('Connected to chat service');
      setIsConnected(true);
      setIsReconnecting(false);
      reconnectAttemptsRef.current = 0;
      
      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    socket.on('disconnect', (reason) => {
      console.error('❌ WebSocket disconnected:', reason);
      toast.error(`Connection lost: ${reason}`);
      setIsConnected(false);
      
      // Handle reconnection for unexpected disconnects
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        setIsReconnecting(true);
        attemptReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      toast.error(`Connection failed: ${error.message || 'Network error'}`);
      setIsConnected(false);
      setIsReconnecting(true);
      
      reconnectAttemptsRef.current++;
      
      if (reconnectAttemptsRef.current <= 5) {
        console.log(`🔄 Reconnection attempt ${reconnectAttemptsRef.current}/5`);
        toast.loading(`Reconnecting... (${reconnectAttemptsRef.current}/5)`);
        attemptReconnect();
      } else {
        console.error('❌ Max reconnection attempts reached');
        toast.error('Unable to connect to server. Please check your connection.');
        setIsReconnecting(false);
      }
    });

    // AI response event handlers
    socket.on('ai_typing', ({ chatId }) => {
      onTypingStart?.(chatId);
    });

    socket.on('ai_response_start', (data) => {
      onTypingStop?.(data.chatId);
    });

    socket.on('ai_response_chunk', (data: WebSocketMessage) => {
      onMessageChunk?.(data);
    });

    socket.on('ai_response_complete', (data: WebSocketMessage) => {
      onMessageComplete?.(data);
    });

    socket.on('error', (error: WebSocketError) => {
      console.error('WebSocket error:', error);
      
      // Show user-friendly error messages
      switch (error.type) {
        case 'rate_limit':
          toast.error('Too many messages. Please wait a moment.');
          break;
        case 'quota_exceeded':
          toast.error('AI service quota exceeded. Please try again later.');
          break;
        case 'network_error':
          toast.error('Network error. Please check your connection.');
          break;
        default:
          toast.error(error.message || 'An error occurred');
      }
      
      onError?.(error);
    });

    socket.on('generation_cancelled', ({ messageId }) => {
      console.log('Generation cancelled:', messageId);
      toast.success('Response generation cancelled');
    });

    socket.on('chat_updated', (data: ChatUpdateData) => {
      console.log('Chat updated:', data);
      onChatUpdate?.(data);
    });

    socketRef.current = socket;
  }, [BACKEND_URL, onMessageChunk, onMessageComplete, onTypingStart, onTypingStop, onError, onChatUpdate]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= 5) {
      toast.error('Unable to connect to chat service. Please refresh the page.');
      setIsReconnecting(false);
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnection attempt ${reconnectAttemptsRef.current}`);
      connect();
    }, delay);
  }, [connect]);

  const sendMessage = useCallback((message: string, chatId: string, conversationHistory: any[] = [], location?: { lat: number; lng: number } | null) => {
    if (!socketRef.current || !isConnected) {
      toast.error('Not connected to chat service. Reconnecting...');
      connect();
      return false;
    }

    const messageData: any = {
      message,
      chatId,
      conversationHistory
    };

    // Include location if provided
    if (location) {
      messageData.location = location;
      console.log('🌍 Sending message with location:', location);
    }

    socketRef.current.emit('chat_message', messageData);

    return true;
  }, [isConnected, connect]);

  const cancelGeneration = useCallback((messageId: string) => {
    if (!socketRef.current || !isConnected) {
      return false;
    }

    socketRef.current.emit('cancel_generation', { messageId });
    return true;
  }, [isConnected]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    setIsConnected(false);
    setIsReconnecting(false);
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  // Reconnect when token changes
  useEffect(() => {
    const token = Cookies.get('token');
    if (token && !isConnected && !isReconnecting) {
      connect();
    }
  }, [isConnected, isReconnecting, connect]);

  return {
    isConnected,
    isReconnecting,
    sendMessage,
    cancelGeneration,
    reconnect: connect,
    disconnect
  };
};
