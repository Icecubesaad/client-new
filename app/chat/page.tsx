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
  X,
  Search,
  Pencil
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

// Food-related mock chats
const initialMockChats: Chat[] = [
  {
    _id: '1',
    title: 'Create a chatbot and many other food-based web app for food',
    messages: [
      { role: 'user', content: 'Create a chatbot and many other food-based web app for food', timestamp: new Date() },
      { role: 'assistant', content: 'I can help you create a comprehensive food-based web application! Here are some key features we can include:\n\n1. **Restaurant Discovery**: Find nearby restaurants, cafes, and food vendors\n2. **Menu Integration**: Display real-time menus with prices and availability\n3. **Food Delivery**: Connect with delivery services and track orders\n4. **Recipe Recommendations**: AI-powered recipe suggestions based on available ingredients\n5. **Nutritional Analysis**: Track calories, macros, and dietary restrictions\n6. **Review System**: User ratings and reviews for restaurants and dishes\n7. **Special Offers**: Real-time deals and discounts from local food businesses\n\nWould you like me to focus on any specific aspect of the food app development?', timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    title: 'List all bakeries near me',
    messages: [
      { role: 'user', content: 'List all bakeries near me', timestamp: new Date() },
      { role: 'assistant', content: 'Here are the top bakeries near you in Lahore:\n\n🥖 **Bread & Beyond**\n📍 MM Alam Road, Gulberg III\n⭐ 4.8/5 • 0.8 km away\n🔗 [View Details](https://maps.google.com/bakery1)\n\n🧁 **Sweet Tooth Bakery**\n📍 Liberty Market, Gulberg II\n⭐ 4.6/5 • 1.2 km away\n🔗 [View Menu](https://maps.google.com/bakery2)\n\n🍰 **The Cake Shop**\n📍 Main Boulevard, DHA Phase 5\n⭐ 4.7/5 • 2.1 km away\n🔗 [Order Online](https://maps.google.com/bakery3)\n\n🥐 **French Bakehouse**\n📍 Packages Mall, Walton Road\n⭐ 4.5/5 • 3.5 km away\n🔗 [Visit Website](https://maps.google.com/bakery4)\n\nWould you like more details about any specific bakery or their specialties?', timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '3',
    title: 'Best pizza places in my area',
    messages: [
      { role: 'user', content: 'Best pizza places in my area', timestamp: new Date() },
      { role: 'assistant', content: 'Here are the highest-rated pizza places near you:\n\n🍕 **Pizza Republic**\n📍 Fortress Stadium, Cantt\n⭐ 4.9/5 • 1.5 km away\n💰 PKR 800-1500\n🔗 [Order Now](https://foodpanda.pk/pizza1)\n\n🍕 **Domino\'s Pizza**\n📍 MM Alam Road Branch\n⭐ 4.4/5 • 0.9 km away\n💰 PKR 600-1200\n🔗 [Online Menu](https://dominos.pk)\n\n🍕 **Broadway Pizza**\n📍 Liberty Market\n⭐ 4.6/5 • 1.1 km away\n💰 PKR 700-1400\n🔗 [View Deals](https://broadway.pk)\n\n🍕 **Johnny & Jugnu**\n📍 DHA Phase 5\n⭐ 4.5/5 • 2.3 km away\n💰 PKR 900-1600\n🔗 [Delivery](https://johnnyjugnu.com)\n\nAll locations offer delivery. Would you like to see current promotions?', timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '4',
    title: 'Chinese restaurants with delivery',
    messages: [
      { role: 'user', content: 'Chinese restaurants with delivery', timestamp: new Date() },
      { role: 'assistant', content: 'Top Chinese restaurants offering delivery in your area:\n\n🥢 **Dragon City**\n📍 M.M. Alam Road, Gulberg\n⭐ 4.7/5 • Delivers in 25-35 mins\n🚚 Free delivery over PKR 1000\n🔗 [Order via Foodpanda](https://foodpanda.pk/dragon)\n\n🥢 **Bamboo Union**\n📍 Liberty Market\n⭐ 4.5/5 • Delivers in 30-40 mins\n🚚 PKR 50 delivery fee\n🔗 [Direct Order](https://bamboo-union.pk)\n\n🥢 **Hong Kong Restaurant**\n📍 Fortress Stadium\n⭐ 4.6/5 • Delivers in 20-30 mins\n🚚 Free delivery over PKR 800\n🔗 [Call: 042-111-HONG](tel:042111hong)\n\n🥢 **Golden Dragon**\n📍 DHA Phase 2\n⭐ 4.4/5 • Delivers in 35-45 mins\n🚚 Express delivery available\n🔗 [Uber Eats](https://ubereats.com/golden)\n\nAll restaurants are currently open and accepting orders!', timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '5',
    title: 'Healthy food options near me',
    messages: [
      { role: 'user', content: 'Healthy food options near me', timestamp: new Date() },
      { role: 'assistant', content: 'Here are the best healthy food spots in your area:\n\n🥗 **Green Bowl**\n📍 Gulberg III, Main Market\n⭐ 4.8/5 • Vegan & Organic options\n🥬 Specializes in salads, smoothie bowls\n🔗 [View Menu](https://greenbowl.pk)\n\n🥙 **The Salad Co.**\n📍 Liberty Market\n⭐ 4.6/5 • Keto & Paleo friendly\n🥑 Build-your-own salad bar\n🔗 [Online Ordering](https://saladco.pk)\n\n🍲 **Fitness Kitchen**\n📍 DHA Phase 5\n⭐ 4.7/5 • Macro-counted meals\n💪 High protein, low carb options\n🔗 [Meal Plans](https://fitnesskitchen.pk)\n\n🌯 **Wrap & Roll**\n📍 MM Alam Road\n⭐ 4.5/5 • Grilled wraps & bowls\n🌱 Gluten-free options available\n🔗 [Order Now](https://wraproll.pk)\n\nAll locations provide nutritional information for their meals!', timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock user data
const mockUser = {
  id: 'mock-user-1',
  name: 'Ahmad Hassan',
  email: 'ahmad.hassan@example.com',
  preferredLanguage: 'en'
};

const ChatPage = () => {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();
  
  // Use mock user if no authenticated user
  const user = authUser || mockUser;
  
  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useState<Chat[]>(initialMockChats);
  const [currentChatId, setCurrentChatId] = useState<string>(initialMockChats[0]._id); // Track by ID instead
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Get current chat from ID
  const currentChat = chats.find(chat => chat._id === currentChatId) || null;

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      scrollToBottom();
    }
  }, [currentChat?.messages, mounted]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
    setCurrentChatId(newChat._id); // Use ID instead of object
    setSidebarOpen(false);
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setSidebarOpen(false);
    // Prevent scroll jump when switching chats
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  // Fixed search functionality
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const foundChat = chats.find(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.messages.some(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    
    if (foundChat) {
      selectChat(foundChat._id);
      setSearchQuery('');
      toast.success('Chat found!');
    } else {
      toast.error('No chat found with that search term');
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const startEditingTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const saveEditedTitle = () => {
    if (!editingChatId || !editTitle.trim()) return;
    
    setChats(prev => prev.map(chat => 
      chat._id === editingChatId 
        ? { ...chat, title: editTitle.trim(), updatedAt: new Date() }
        : chat
    ));
    
    // Move edited chat to top
    moveChatToTop(editingChatId);
    
    setEditingChatId(null);
    setEditTitle('');
    toast.success('Chat title updated');
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditTitle('');
  };

  const moveChatToTop = (chatId: string) => {
    setChats(prev => {
      const chatIndex = prev.findIndex(chat => chat._id === chatId);
      if (chatIndex === -1 || chatIndex === 0) return prev;
      
      const chat = prev[chatIndex];
      const newChats = [...prev];
      newChats.splice(chatIndex, 1);
      newChats.unshift({ ...chat, updatedAt: new Date() });
      
      return newChats;
    });
  };

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    setChats(prev => prev.filter(chat => chat._id !== chatId));
    
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat._id !== chatId);
      setCurrentChatId(remainingChats.length > 0 ? remainingChats[0]._id : '');
    }
    
    toast.success('Chat deleted successfully');
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;

    let targetChatId = currentChatId;
    let targetChat = currentChat;

    // If no current chat, create a new one
    if (!targetChat) {
      const newChat: Chat = {
        _id: Date.now().toString(),
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat._id);
      targetChat = newChat;
      targetChatId = newChat._id;
    }

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message immediately
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    // Update chats with user message
    setChats(prev => prev.map(chat => {
      if (chat._id === targetChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newUserMessage],
          title: chat.messages.length === 0 ? (userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')) : chat.title,
          updatedAt: new Date()
        };
      }
      return chat;
    }));

    // Move to top
    moveChatToTop(targetChatId);

    // Simulate API call with food-related mock response
    setTimeout(() => {
      const foodResponses = [
        "I'd be happy to help you find great food options! Based on your location in Lahore, I can recommend restaurants, cafes, and local food vendors. What type of cuisine are you craving?",
        "Here are some popular food spots near you that offer delivery and dine-in options. Would you like me to show you specific categories like fast food, fine dining, or street food?",
        "I found several highly-rated restaurants in your area! They offer various cuisines including Pakistani, Chinese, Italian, and Continental. Which would you prefer to explore?",
        "Great choice! I can help you discover the best local eateries, check their current offers, and even help you place orders. What kind of food experience are you looking for today?"
      ];
      
      const randomResponse = foodResponses[Math.floor(Math.random() * foodResponses.length)];
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };

      // Update chats with assistant message
      setChats(prev => prev.map(chat => {
        if (chat._id === targetChatId) {
          return {
            ...chat,
            messages: [...chat.messages, assistantMessage],
            updatedAt: new Date()
          };
        }
        return chat;
      }));

      // Move to top again after assistant response
      moveChatToTop(targetChatId);
      setIsLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    if (authUser) {
      logout();
    }
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

  // Function to render text with markdown-style bold formatting
  const renderMessageContent = (content: string) => {
    // Split by double asterisks and render bold text
    const parts = content.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        // Remove the asterisks and make bold
        const boldText = part.slice(2, -2);
        return (
          <span key={index} className="font-bold">
            {boldText}
          </span>
        );
      }
      return part;
    });
  };

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-800">CHAT A.I+</h1>
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
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>New chat</span>
              </motion.button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </form>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Your conversations
                </h4>
                
                <div className="space-y-2">
                  <AnimatePresence mode="wait" initial={false}>
                    {filteredChats.map((chat, index) => {
                      const isSelected = currentChatId === chat._id;
                      
                      return (
                        <motion.div
                          key={chat._id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ 
                            duration: 0.2,
                            ease: "easeOut",
                            layout: { duration: 0.3 }
                          }}
                          onClick={() => selectChat(chat._id)}
                          className={`p-3 rounded-xl cursor-pointer transition-all duration-200 group flex items-start justify-between ${
                            isSelected
                              ? 'bg-blue-50 border border-blue-200 shadow-sm'
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
                                  ref={editInputRef}
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onBlur={saveEditedTitle}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      saveEditedTitle();
                                    }
                                    if (e.key === 'Escape') {
                                      e.preventDefault();
                                      cancelEditing();
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
                            {editingChatId === chat._id ? (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveEditedTitle();
                                }}
                                className="text-green-500 hover:text-green-600 p-1 rounded-lg hover:bg-green-50 transition-all"
                              >
                                ✓
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingTitle(chat._id, chat.title);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all duration-200 p-1 rounded-lg hover:bg-blue-50"
                              >
                                <Pencil className="w-4 h-4" />
                              </motion.button>
                            )}
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
                  </AnimatePresence>
                </div>

                {filteredChats.length === 0 && searchQuery && (
                  <div className="text-center text-gray-400 text-sm mt-4">
                    No chats found matching "{searchQuery}"
                  </div>
                )}

                {filteredChats.length === 0 && !searchQuery && (
                  <div className="text-center text-gray-400 text-sm mt-4">
                    No chats yet. Start a new conversation!
                  </div>
                )}

                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Last 7 days</h4>
                  <div className="text-sm text-gray-400 text-center py-4">
                    No recent chats
                  </div>
                </div>
              </div>
            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'Ahmad Hassan'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'ahmad.hassan@example.com'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ backgroundColor: '#f3f4f6' }}
                  onClick={navigateToSettings}
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
              <h1 className="text-lg font-bold text-gray-800">
                {currentChat?.title || 'CHAT A.I+'}
              </h1>
              {currentChat && (
                <p className="text-sm text-gray-500">
                  {currentChat.messages.length} messages • Food Assistant
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
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white" style={{ scrollBehavior: 'smooth' }}>
          {!currentChat || currentChat.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-lg">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-8"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">What can I help you find today?</h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    I'm your AI food assistant. Ask me about restaurants, recipes, dietary options, or food delivery near you!
                  </p>
                </motion.div>

                {/* Suggestion Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8"
                >
                  {[
                    { text: "Find pizza places nearby", query: "Best pizza places near me" },
                    { text: "Healthy food options", query: "Healthy restaurants in my area" },
                    { text: "Local bakeries", query: "List all bakeries near me" },
                    { text: "Food delivery services", query: "Food delivery options available" }
                  ].map((suggestion, index) => (
                    <motion.button
                      key={suggestion.text}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      onClick={() => setMessage(suggestion.query)}
                      className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all text-left group"
                    >
                      <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        {suggestion.text}
                      </p>
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              <AnimatePresence mode="wait" initial={false}>
                {currentChat.messages.map((msg, index) => (
                  <motion.div
                    key={`${currentChat._id}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.3,
                      ease: "easeOut",
                      layout: { duration: 0.2 }
                    }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 ml-3' 
                            : 'bg-gradient-to-br from-gray-200 to-gray-300 mr-3'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <span className="text-white font-bold text-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                          </span>
                        ) : (
                          <Bot className="w-5 h-5 text-gray-600" />
                        )}
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className={`rounded-2xl p-4 shadow-md transition-all ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">{renderMessageContent(msg.content)}</p>
                        <p className={`text-xs mt-3 ${
                          msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-lg">
                      <Bot className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md">
                      <div className="flex space-x-1">
                        <motion.div 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-blue-500 rounded-full"
                        />
                        <motion.div 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-blue-500 rounded-full"
                        />
                        <motion.div 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-blue-500 rounded-full"
                        />
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
        <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What can I help with?"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 pr-14 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-3 mt-4">
              <span className="text-xs text-gray-500">Quick actions:</span>
              {[
                " Pizza near me",
                " Healthy options",
                " Bakeries",
                " Delivery available"
              ].map((action) => (
                <motion.button
                  key={action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMessage(action.split(' ').slice(1).join(' '))}
                  className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-all"
                >
                  {action}
                </motion.button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;