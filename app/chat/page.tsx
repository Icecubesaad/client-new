'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Send,
  Plus,
  Menu,
  Sun,
  Zap,
  AlertTriangle,
  MessageSquare,
  Trash2,
  Settings,
  LogOut,
  User,
  Clock,
  Star,
  MapPin
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
}

interface Chat {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface Recommendation {
  name: string;
  distance?: string;
  rating?: number;
  offer?: string;
  expires?: string;
  cuisine?: string;
}

const ChatPage = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchChats();
  }, [user, router]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chats`);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chats`);
      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      setRecommendations([]);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create new chat');
    }
  };

  const selectChat = async (chatId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chats/${chatId}`);
      setCurrentChat(response.data);
      setRecommendations([]);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error fetching chat:', error);
      toast.error('Failed to load chat');
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/chats/${chatId}`);
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      
      if (currentChat?._id === chatId) {
        setCurrentChat(null);
        setRecommendations([]);
      }
      
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;

    if (!currentChat) {
      await createNewChat();
      return;
    }

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chats/${currentChat._id}/messages`,
        { message: userMessage }
      );

      const { userMessage: newUserMessage, assistantMessage, recommendations: newRecommendations } = response.data;

      setCurrentChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newUserMessage, assistantMessage]
      } : null);

      setRecommendations(newRecommendations || []);

      // Update chat in list
      setChats(prev => prev.map(chat => 
        chat._id === currentChat._id 
          ? { ...chat, updatedAt: new Date() }
          : chat
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
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

  const exampleQuestions = [
    {
      icon: Sun,
      title: 'Examples',
      subtitle: 'Explain quantum computing in simple terms',
      questions: [
        "Find the nearest location to buy cheesecake",
        "What are the best deals available today?",
        "Recommend good restaurants near me"
      ]
    },
    {
      icon: Zap,
      title: 'Capabilities',
      subtitle: 'Personalized recommendations and local business info',
      questions: [
        "Provide personalized shopping recommendations",
        "Find local business hours and contact info", 
        "Compare prices across different stores"
      ]
    },
    {
      icon: AlertTriangle,
      title: 'Limitations',
      subtitle: 'May occasionally generate incorrect information',
      questions: [
        "Cannot access real-time inventory data",
        "Limited to publicly available business info",
        "Recommendations based on general data"
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-dark-gradient overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || (typeof window !== 'undefined' && window?.innerWidth >= 768)) && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3 }}
            className="w-80 bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col fixed md:relative z-20 h-full"
          >
            {/* User Profile */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{user?.name}</h3>
                  <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                </div>
              </div>
              
              <button
                onClick={createNewChat}
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-gray-400 text-sm font-medium mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Today
              </h4>
              
              <div className="space-y-2">
                {chats.map(chat => (
                  <motion.div
                    key={chat._id}
                    whileHover={{ x: 4 }}
                    onClick={() => selectChat(chat._id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all group flex items-center justify-between ${
                      currentChat?._id === chat._id
                        ? 'bg-white/10 border border-white/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{chat.title}</p>
                        <p className="text-gray-400 text-xs">
                          {formatTime(chat.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat._id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* User Actions */}
            <div className="p-4 border-t border-white/10 space-y-2">
              <button className="w-full text-left text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all flex items-center space-x-3">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left text-gray-300 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-white/5 transition-all flex items-center space-x-3"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-300 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-white">AI GPT</h1>
          </div>
          <div className="text-sm text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!currentChat ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="max-w-4xl w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-4xl font-bold text-white mb-4">AI GPT</h2>
                  <p className="text-gray-400 text-lg">
                    How can I help you today? Ask me about local businesses, deals, or get personalized recommendations.
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                  {exampleQuestions.map((section, index) => (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card-gradient backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <section.icon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-white font-semibold">{section.title}</h3>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-4">{section.subtitle}</p>
                      
                      <div className="space-y-2">
                        {section.questions.map((question, qIndex) => (
                          <button
                            key={qIndex}
                            onClick={() => setMessage(question)}
                            className="w-full text-left text-gray-400 text-sm hover:text-gray-300 p-2 rounded-lg hover:bg-white/5 transition-all"
                          >
                            "{question}"
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {currentChat.messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-3xl ${msg.role === 'user' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-card-gradient border border-white/10'} backdrop-blur-xl rounded-2xl p-4`}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-white/20' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
                        {msg.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-white text-sm font-bold">A</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-gray-400 text-xs mt-2">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl"
                >
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-400" />
                    Recommendations
                  </h3>
                  <div className="grid gap-4">
                    {recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card-gradient backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{rec.name}</h4>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                              {rec.distance && (
                                <span className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {rec.distance}
                                </span>
                              )}
                              {rec.rating && (
                                <span className="flex items-center">
                                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                                  {rec.rating}/5
                                </span>
                              )}
                              {rec.cuisine && (
                                <span className="px-2 py-1 bg-purple-500/20 rounded-full text-purple-300">
                                  {rec.cuisine}
                                </span>
                              )}
                            </div>
                            {rec.offer && (
                              <div className="mt-2">
                                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                                  🎉 {rec.offer}
                                </span>
                                {rec.expires && (
                                  <span className="ml-2 text-xs text-gray-400">
                                    Expires: {rec.expires}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-card-gradient backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">A</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-black/20 backdrop-blur-xl border-t border-white/10 p-4">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything about deals, restaurants, or local businesses..."
                className="w-full bg-card-gradient backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 pr-14 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl flex items-center justify-center hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">
              AI GPT can make mistakes. Consider checking important information and deals before making purchases.
            </p>
          </form>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;