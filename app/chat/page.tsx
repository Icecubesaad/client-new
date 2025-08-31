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
  MessageSquare,
  Trash2,
  Settings,
  LogOut,
  User,
  Clock,
  Star,
  MapPin,
  Bot,
  X
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

// Mock data for demonstration
const mockChats: Chat[] = [
  {
    _id: '1',
    title: 'Create a chatbot and many other GPT-based web app for food',
    messages: [
      { role: 'user', content: 'Create a chatbot and many other GPT-based web app for food', timestamp: new Date() },
      { role: 'assistant', content: 'Sure, I can help you get started with creating a chatbot using GPT in Python. Here are the basic steps you\'ll need to follow:\n\n1. Install the required libraries: You\'ll want to install the HuggingFace library to use GPT. You can install it using pip.\n\n2. Load the pre-trained model: GPT comes in several sizes and versions, so you\'ll want to choose the one that fits your needs. You can load a pre-trained GPT model. This loads the \'gpt2\' parameter version of GPT-Tiny, which is a powerful and relatively recent model.\n\n3. Create a chatbot loop: You\'ll need to create a loop that takes user input, generates a response using the GPT model, and outputs it to the user each time the program or the loop is interrupted.\n\n4. Add some personality to the chatbot: While GPT can generate text, it doesn\'t have any inherent personality or style. You can make your chatbot more interesting by add ing custom prompts or responses that reflect your chatbot personality. You can then modify the chatbot loop to use these prompts and responses when appropriate.\n\nThese are just the basic steps to get started with a GPT chatbot in Python. Depending on your requirements, you may need to add more features or complexity to the chatbot. Good luck!', timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    title: 'Apply to leave for Emergency',
    messages: [
      { role: 'user', content: 'Apply to leave for Emergency', timestamp: new Date() },
      { role: 'assistant', content: 'I\'ll help you create an emergency leave application. Here\'s a professional template:\n\n**Emergency Leave Application**\n\nDate: [Current Date]\nTo: [Manager\'s Name/HR Department]\nSubject: Emergency Leave Request\n\nDear [Manager\'s Name],\n\nI am writing to request emergency leave due to [brief description of emergency - keep it professional and concise].\n\nLeave Details:\n• Start Date: [Date]\n• Expected Return Date: [Date]\n• Duration: [Number of days]\n\nI understand this is short notice and apologize for any inconvenience. I will ensure:\n• All urgent tasks are completed or delegated\n• Team members are informed of my absence\n• I remain reachable for critical matters if possible\n\nThank you for your understanding during this difficult time.\n\nSincerely,\n[Your Name]', timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '3',
    title: 'What is UI/UX Design?',
    messages: [
      { role: 'user', content: 'What is UI/UX Design?', timestamp: new Date() },
      { role: 'assistant', content: 'UI/UX Design refers to two interconnected but distinct disciplines:\n\n**UX (User Experience) Design:**\n• Focuses on the overall experience and journey of users\n• Involves research, wireframing, prototyping, and testing\n• Ensures products are useful, usable, and valuable\n• Considers user needs, behaviors, and pain points\n\n**UI (User Interface) Design:**\n• Focuses on the visual and interactive elements\n• Includes colors, typography, buttons, icons, and layouts\n• Ensures the interface is aesthetically pleasing and functional\n• Creates the actual touchpoints users interact with\n\n**Key Differences:**\n• UX is about problem-solving and user research\n• UI is about visual design and interaction design\n• UX comes first in the design process, UI follows\n• UX is more analytical, UI is more creative/artistic\n\nBoth work together to create digital products that are both functional and beautiful, ensuring users can accomplish their goals efficiently while enjoying the experience.', timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '4',
    title: 'Create "OS System"',
    messages: [
      { role: 'user', content: 'Create "OS System"', timestamp: new Date() },
      { role: 'assistant', content: 'Creating an operating system is a complex project! Here\'s a high-level overview:\n\n**Basic OS Components:**\n\n1. **Bootloader**\n   • First code that runs when computer starts\n   • Loads the kernel into memory\n\n2. **Kernel**\n   • Core of the OS\n   • Manages hardware resources\n   • Handles system calls\n\n3. **Memory Management**\n   • Virtual memory\n   • Memory allocation/deallocation\n\n4. **Process Management**\n   • Process scheduling\n   • Inter-process communication\n\n5. **File System**\n   • File storage and retrieval\n   • Directory structure\n\n6. **Device Drivers**\n   • Hardware interface\n   • Input/output operations\n\n**Development Steps:**\n1. Choose architecture (x86, ARM, etc.)\n2. Set up development environment\n3. Write bootloader in assembly\n4. Implement basic kernel in C/C++\n5. Add memory management\n6. Implement process scheduling\n7. Create file system\n8. Add device drivers\n\nThis is a multi-year project requiring deep systems programming knowledge!', timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '5',
    title: 'How Chat GPT Work',
    messages: [
      { role: 'user', content: 'How Chat GPT Work', timestamp: new Date() },
      { role: 'assistant', content: 'ChatGPT works through several key technologies and processes:\n\n**1. Transformer Architecture**\n• Based on the "Attention is All You Need" paper\n• Uses self-attention mechanisms to understand context\n• Processes text in parallel rather than sequentially\n\n**2. Training Process**\n• **Pre-training**: Learned from massive text datasets\n• **Fine-tuning**: Specialized for conversational tasks\n• **RLHF**: Reinforcement Learning from Human Feedback\n\n**3. How it Generates Responses**\n• Tokenizes input text into smaller pieces\n• Uses attention mechanisms to understand relationships\n• Predicts the most likely next token/word\n• Continues until it generates a complete response\n\n**4. Key Technologies**\n• Neural networks with billions of parameters\n• GPU clusters for processing\n• Advanced optimization techniques\n\n**5. Limitations**\n• Knowledge cutoff date\n• Can generate plausible but incorrect information\n• No real-time learning from conversations\n• Cannot browse the internet or access external data\n\nThe model essentially learned patterns from human text to generate human-like responses!', timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const ChatPage = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [currentChat, setCurrentChat] = useState<Chat | null>(mockChats[0]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user) {
      // router.push('/login');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewChat = () => {
    const newChat: Chat = {
      _id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    setRecommendations([]);
    setSidebarOpen(false);
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find(c => c._id === chatId);
    if (chat) {
      setCurrentChat(chat);
      setRecommendations([]);
      setSidebarOpen(false);
    }
  };

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    setChats(prev => prev.filter(chat => chat._id !== chatId));
    
    if (currentChat?._id === chatId) {
      setCurrentChat(chats.length > 1 ? chats[0] : null);
      setRecommendations([]);
    }
    
    toast.success('Chat deleted successfully');
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;

    if (!currentChat) {
      createNewChat();
      return;
    }

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Simulate API call with mock response
    setTimeout(() => {
      const newUserMessage: Message = {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };

      const mockResponse = "I understand you're looking for help with that. Let me provide you with a comprehensive response that addresses your question thoroughly and helpfully.";
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: mockResponse,
        timestamp: new Date()
      };

      setCurrentChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newUserMessage, assistantMessage],
        title: prev.messages.length === 0 ? userMessage.slice(0, 50) + '...' : prev.title
      } : null);

      // Update chat in list
      setChats(prev => prev.map(chat => 
        chat._id === currentChat._id 
          ? { 
              ...chat, 
              updatedAt: new Date(),
              title: chat.messages.length === 0 ? userMessage.slice(0, 50) + '...' : chat.title,
              messages: [...chat.messages, newUserMessage, assistantMessage]
            }
          : chat
      ));

      setIsLoading(false);
    }, 2000);
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

  const navigateToSettings = () => {
    router.push('/settings');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || (typeof window !== 'undefined' && window?.innerWidth >= 768)) && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3 }}
            className="w-80 bg-white border-r border-gray-200 flex flex-col fixed md:relative z-20 h-full shadow-sm"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-800">CHAT A.I.</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={createNewChat}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New chat</span>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search chats..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Chat History Categories */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Your conversations
                </h4>
                
                <div className="space-y-1">
                  {chats.map(chat => (
                    <motion.div
                      key={chat._id}
                      whileHover={{ backgroundColor: '#f8fafc' }}
                      onClick={() => selectChat(chat._id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all group flex items-start justify-between ${
                        currentChat?._id === chat._id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 text-sm leading-5 line-clamp-2">{chat.title}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteChat(chat._id, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Additional Categories */}
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Last 7 days</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="p-2 text-center text-gray-400">No recent chats</div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={navigateToSettings}
                  className="flex-1 text-left text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-2 text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all text-sm"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {currentChat?.title || 'CHAT A.I.'}
              </h1>
              {currentChat && (
                <p className="text-sm text-gray-500">
                  {currentChat.messages.length} messages
                </p>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {!currentChat || currentChat.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <Bot className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">How can I help you today?</h2>
                  <p className="text-gray-600">
                    Start a conversation and I'll assist you with any questions you have.
                  </p>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              {currentChat.messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 ml-3' 
                        : 'bg-gray-300 mr-3'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div className={`rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-2 ${
                        msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
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
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What can I help with?"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
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