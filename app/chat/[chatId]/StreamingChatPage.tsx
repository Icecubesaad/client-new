'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ConnectionStatus } from '../../../components/ConnectionStatus';
import { useLocation } from '../../../hooks/useLocation';
import { useWebSocket } from '../../../hooks/useWebSocket';
import LocationDebug from '../../../components/LocationDebug';
import { StreamingMessage } from '../../../components/StreamingMessage';
import { TypingIndicator } from '../../../components/TypingIndicator';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Send,
  Plus,
  Menu,
  MessageSquare,
  Trash2,
  Settings,
  LogOut,
  Clock,
  MapPin,
  Bot,
  X,
  Search,
  Pencil,
  Check,
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface Chat {
  _id: string;
  title: string;
  messages?: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const StreamingChatPage = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  // Handle both /chat/new and /chat/[chatId] routes
  const chatId = (params.chatId as string) || 'new';

  // State management
  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeChatId, setActiveChatId] = useState<string>(chatId); // Track actual active chat ID
  // Location hook
  const {
    location: currentLocation,
    isLoading: locationLoading,
    error: locationError,
    isSupported: locationSupported,
    requestLocation,
    clearLocation,
    getCurrentLocation,
    forceRefreshLocation
  } = useLocation();
  const [chatLoading, setChatLoading] = useState(false); // Start with false for new chats
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  // WebSocket setup
  const {
    isConnected,
    isReconnecting,
    sendMessage: sendWebSocketMessage,
    cancelGeneration,
    reconnect
  } = useWebSocket({
    onMessageChunk: (data) => {
      setMessages(prev => {
        const existingIndex = prev.findIndex(m => m.id === data.messageId);
        if (existingIndex >= 0) {
          // Update existing message
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            content: updated[existingIndex].content + (data.chunk || ''),
            isStreaming: !data.isComplete
          };
          return updated;
        } else {
          // Add new streaming message
          return [...prev, {
            id: data.messageId,
            role: 'assistant',
            content: data.chunk || '',
            timestamp: new Date(data.timestamp),
            isStreaming: !data.isComplete
          }];
        }
      });
      setStreamingMessageId(data.messageId);
    },
    onMessageComplete: (data) => {
      setMessages(prev => {
        const updated = prev.map(m => 
          m.id === data.messageId 
            ? { ...m, content: data.fullContent || m.content, isStreaming: false }
            : m
        );
        return updated;
      });
      setStreamingMessageId(null);
      setIsTyping(false);
      
      // Save to database
      saveMessageToDatabase(data.fullContent || '', 'assistant');
    },
    onTypingStart: () => setIsTyping(true),
    onTypingStop: () => setIsTyping(false),
    onError: (error) => {
      setIsTyping(false);
      setStreamingMessageId(null);
    },
    onChatUpdate: (data) => {
      console.log('📢 Received chat update:', data);
      console.log('🔍 Current chat ID:', currentChat?._id);
      console.log('🔍 Update chat ID:', data.chatId);
      
      // Update current chat if it matches
      if (currentChat && currentChat._id === data.chatId) {
        console.log('✅ Updating current chat title');
        setCurrentChat(prev => prev ? { ...prev, title: data.title, updatedAt: new Date(data.updatedAt) } : null);
      }
      
      // Update in chats list
      setChats(prev => {
        const updated = prev.map(chat => 
          chat._id === data.chatId 
            ? { ...chat, title: data.title, updatedAt: new Date(data.updatedAt) }
            : chat
        );
        console.log('📋 Updated chats list');
        return updated;
      });
    }
  });

  // Initialize
  useEffect(() => {
    console.log('🔧 Initializing StreamingChatPage with chatId:', chatId);
    console.log('📍 Current route params:', params);
    setMounted(true);
    if (user) {
      loadChats();
      if (chatId && chatId !== 'new') {
        console.log('📥 Loading existing chat from database');
        setChatLoading(true);
        loadCurrentChat(chatId);
      } else {
        console.log('📝 New chat mode - ready for first message');
        setChatLoading(false);
      }
    }
  }, [user, chatId]);

  // Update activeChatId when chatId changes
  useEffect(() => {
    setActiveChatId(chatId);
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (mounted) {
      scrollToBottom();
    }
  }, [messages, mounted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chats`);
      setChats(response.data);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    }
  };

  const loadCurrentChat = async (chatId: string) => {
    setChatLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chats/${chatId}`);
      setCurrentChat(response.data);
      setMessages(response.data.messages?.map((m: any) => ({
        ...m,
        id: `msg_${Date.now()}_${Math.random()}`,
        isStreaming: false
      })) || []);
      
      setChats(prev => {
        const existingIndex = prev.findIndex(chat => chat._id === chatId);
        if (existingIndex >= 0) {
          const newChats = [...prev];
          newChats[existingIndex] = response.data;
          return newChats;
        } else {
          return [response.data, ...prev];
        }
      });
    } catch (error: any) {
      console.error('Error loading chat:', error);
      if (error.response?.status === 404) {
        toast.error('Chat not found');
        router.push('/chat/new');
      } else {
        toast.error('Failed to load chat');
      }
    } finally {
      setChatLoading(false);
    }
  };

  // Location is now handled by useLocation hook

  const saveMessageToDatabase = async (content: string, role: 'user' | 'assistant') => {
    if (!currentChat || activeChatId === 'new') return;

    try {
      // Update local chat state
      const updatedChat = {
        ...currentChat,
        messages: [...(currentChat.messages || []), { role, content, timestamp: new Date() }],
        updatedAt: new Date()
      };
      setCurrentChat(updatedChat);
      
      // Update chats list
      setChats(prev => prev.map(chat => 
        chat._id === activeChatId ? updatedChat : chat
      ));
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to UI
    const userMsg: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      isStreaming: false
    };
    setMessages(prev => [...prev, userMsg]);

    // Create new chat if needed (seamless experience like Claude)
    let newChatId = activeChatId;
    if (activeChatId === 'new') {
      try {
        console.log('📝 Creating new chat...');
        console.log('🔑 Auth header:', axios.defaults.headers.common['Authorization'] ? 'Present' : 'Missing');
        const response = await axios.post(`${API_BASE_URL}/api/chats`);
        console.log('✅ Chat created:', response.data);
        newChatId = response.data._id;
        setCurrentChat(response.data);
        setActiveChatId(newChatId); // Update active chat ID immediately
        
        // Update URL silently without triggering Next.js re-render
        console.log('🔄 Updating URL silently to:', `/chat/${newChatId}`);
        window.history.replaceState({}, '', `/chat/${newChatId}`);
        
        // Update chats list
        setChats(prev => {
          console.log('📋 Adding chat to sidebar');
          return [response.data, ...prev];
        });
      } catch (error: any) {
        console.error('❌ Failed to create chat:', error);
        console.error('Error details:', error.response?.data || error.message);
        toast.error(`Failed to create chat: ${error.response?.data?.error || error.message}`);
        return;
      }
    }

    // Send via WebSocket for streaming response (send immediately, save later)
    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Get fresh current location if location is enabled
    let locationToSend = null;
    if (currentLocation) {
      try {
        locationToSend = await getCurrentLocation();
        console.log('📍 Using fresh location for message:', locationToSend);
      } catch (error) {
        console.warn('⚠️ Failed to get fresh location, using cached:', error);
        locationToSend = currentLocation;
      }
    } else {
      console.log('📍 No location available - location sharing disabled or not set');
    }
    
    console.log('📤 Sending message with location data:', locationToSend);

    const sent = sendWebSocketMessage(userMessage, newChatId, conversationHistory, locationToSend);
    
    // Save user message to database after sending (non-blocking)
    if (newChatId !== 'new') {
      saveMessageToDatabase(userMessage, 'user');
    }
    
    if (!sent) {
      toast.error('Failed to send message. Please check your connection.');
      // Remove the user message if sending failed
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    }
  };

  const handleCancelGeneration = () => {
    if (streamingMessageId) {
      cancelGeneration(streamingMessageId);
      setStreamingMessageId(null);
      setIsTyping(false);
    }
  };

  const handleRetryMessage = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (message.role === 'user') {
      // Resend the user message
      const userMessage = message.content;
      const conversationHistory = messages.slice(0, messageIndex).map(m => ({
        role: m.role,
        content: m.content
      }));
      
      sendWebSocketMessage(userMessage, chatId, conversationHistory);
    }
  };

  const createNewChat = () => {
    // Reset all state for new chat
    setCurrentChat(null);
    setMessages([]);
    setActiveChatId('new');
    setIsTyping(false);
    setStreamingMessageId(null);
    setChatLoading(false);
    
    router.push('/chat/new');
    setSidebarOpen(false);
  };

  const selectChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
    setSidebarOpen(false);
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/chats/${chatId}`);
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      
      if (chatId === chatId) {
        router.push('/chat/new');
      }
      
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (!mounted || authLoading || chatLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Auth check
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Connection Status */}
      <ConnectionStatus 
        isConnected={isConnected}
        isReconnecting={isReconnecting}
        onReconnect={reconnect}
      />

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || (typeof window !== 'undefined' && window?.innerWidth >= 768)) && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-80 bg-white border-r border-gray-200 flex flex-col fixed md:relative z-20 h-full shadow-lg"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-800">AI Chat Pro</h1>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={createNewChat}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </motion.button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Recent Conversations
                </h4>
                
                {chatLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading chats...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chats
                      .filter(chat => 
                        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((chat) => {
                      const isSelected = chatId === chat._id;
                      
                      return (
                        <motion.div
                          key={chat._id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => selectChat(chat._id)}
                          className={`p-3 rounded-xl cursor-pointer transition-all duration-200 group flex items-start justify-between ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <MessageSquare className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                              isSelected ? 'text-blue-500' : 'text-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              {editingChatId === chat._id ? (
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onBlur={() => {
                                    // Save edited title
                                    setEditingChatId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      setEditingChatId(null);
                                    }
                                    if (e.key === 'Escape') {
                                      e.preventDefault();
                                      setEditingChatId(null);
                                    }
                                  }}
                                  className="w-full text-sm font-medium text-gray-800 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <>
                                  <p className={`text-sm leading-5 line-clamp-2 font-medium transition-colors duration-200 ${
                                    isSelected ? 'text-blue-700' : 'text-gray-800'
                                  }`}>
                                    {chat.title}
                                  </p>
                                  <p className={`text-xs mt-1 transition-colors duration-200 ${
                                    isSelected ? 'text-blue-500' : 'text-gray-500'
                                  }`}>
                                    {formatTime(chat.updatedAt)}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChatId(chat._id);
                                setEditTitle(chat.title);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all duration-200 p-1 rounded-lg hover:bg-blue-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => deleteChat(chat._id, e)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-200 p-1 rounded-lg hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {chats.length === 0 && !searchQuery && (
                      <div className="text-center text-gray-400 text-sm mt-4">
                        No chats yet. Start a new conversation!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ backgroundColor: '#f3f4f6' }}
                  onClick={() => router.push('/settings')}
                  className="flex-1 text-left text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg transition-all flex items-center space-x-2 text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </motion.button>
                <motion.button
                  whileHover={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg transition-all text-sm"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <span>{currentChat?.title || 'New Chat'}</span>
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <Zap className={`w-3 h-3 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>{isConnected ? 'Connected' : 'Offline'}</span>
                </span>
                {currentLocation && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    <span>Location enabled</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Temporary Location Debug Tool - COMMENTED OUT */}
        <div className="p-4 border-b border-gray-200 bg-yellow-50">
          <LocationDebug />
        </div> 

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-lg">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    🗺️ Place Discovery Assistant
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    Discover amazing places around you! I specialize in finding the best local businesses, restaurants, and attractions.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                    {[
                      "Best pizza places near me",
                      "Coffee shops around me",
                      "Top restaurants in my area",
                      "Shopping malls nearby"
                    ].map((suggestion, index) => (
                      <motion.button
                        key={suggestion}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        onClick={() => setInputMessage(suggestion)}
                        className="p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-sm text-gray-700"
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <StreamingMessage
                    key={message.id || index}
                    role={message.role}
                    content={message.content}
                    isStreaming={message.isStreaming}
                    timestamp={message.timestamp}
                    onRetry={message.role === 'user' ? () => handleRetryMessage(index) : undefined}
                    onCancel={message.isStreaming ? handleCancelGeneration : undefined}
                    messageId={message.id}
                  />
                ))}
                {isTyping && <TypingIndicator />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2">
              {/* Location Toggle Button */}
              {locationSupported && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={currentLocation ? clearLocation : requestLocation}
                  disabled={locationLoading}
                  className={`p-3 rounded-xl transition-all shadow-lg ${
                    currentLocation 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  } ${locationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={currentLocation ? 'Location enabled - Click to disable' : 'Click to enable location for better recommendations'}
                >
                  <MapPin className={`w-5 h-5 ${locationLoading ? 'animate-pulse' : ''}`} />
                </motion.button>
              )}
              
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  !isConnected 
                    ? "Connecting..." 
                    : currentLocation 
                    ? "Ask about places near you..." 
                    : "Type your message..."
                }
                disabled={!isConnected || isTyping}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!isConnected || !inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
            {!isConnected && (
              <p className="text-xs text-red-500 mt-2">
                Connection lost. Attempting to reconnect...
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default StreamingChatPage;
