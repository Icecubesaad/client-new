'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
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
  Pencil,
  Navigation,
  Check,
  AlertCircle,
  ExternalLink,
  Phone,
  Globe as GlobeIcon
} from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface PlaceData {
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number;
  phoneNumber?: string;
  website?: string;
  photos?: string[];
  openingHours?: string[];
  types?: string[];
  placeId?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
  location?: Location;
  placesData?: PlaceData[];
}

interface Chat {
  _id: string;
  title: string;
  messages?: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const NewChatPage = () => {
  const { user: authUser, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const user = authUser;
  
  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://server-test-steel.vercel.app';

  useEffect(() => {
    setMounted(true);
    if (user) {
      loadChats();
      loadUserLocation();
    }
  }, [user]);

  useEffect(() => {
    if (mounted) {
      scrollToBottom();
    }
  }, [mounted]);

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  const loadChats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chats`);
      setChats(response.data);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    }
  };

  const loadUserLocation = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/location`);
      if (response.data) {
        setCurrentLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          address: response.data.address
        });
        setLocationEnabled(true);
      }
    } catch (error: any) {
      // Location not found is normal for new users
      if (error.response?.status !== 404) {
        console.error('Error loading user location:', error);
      }
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || 'demo_key'}`
          );
          const data = await response.json();
          const address = data.results?.[0]?.formatted || `${latitude}, ${longitude}`;
          
          const location = { latitude, longitude, address };
          setCurrentLocation(location);
          setLocationEnabled(true);
          
          // Save location to user profile
          if (user) {
            try {
              await axios.post(`${API_BASE_URL}/api/user/location`, location);
              toast.success('Location saved and enabled successfully!');
            } catch (saveError) {
              console.error('Error saving location:', saveError);
              toast.success('Location enabled (but not saved to profile)');
            }
          } else {
            toast.success('Location enabled successfully!');
          }
        } catch (error) {
          console.error('Error getting address:', error);
          const location = { latitude, longitude };
          setCurrentLocation(location);
          setLocationEnabled(true);
          
          // Save location to user profile even without address
          if (user) {
            try {
              await axios.post(`${API_BASE_URL}/api/user/location`, location);
              toast.success('Location saved and enabled!');
            } catch (saveError) {
              console.error('Error saving location:', saveError);
              toast.success('Location enabled (but not saved to profile)');
            }
          } else {
            toast.success('Location enabled!');
          }
        }
        
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to get your location. Please enable location services.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const clearLocation = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/user/location`);
      setCurrentLocation(null);
      setLocationEnabled(false);
      toast.success('Location data cleared');
    } catch (error) {
      console.error('Error clearing location:', error);
      toast.error('Failed to clear location data');
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const createNewChat = () => {
    // If already on new chat page, just focus the input
    if (window.location.pathname === '/chat/new') {
      inputRef.current?.focus();
      return;
    }
    
    // Navigate to new chat page
    router.push('/chat/new');
    setSidebarOpen(false);
  };

  const selectChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
    setSidebarOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const foundChat = chats.find(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.messages && chat.messages.some(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    );
    
    if (foundChat) {
      selectChat(foundChat._id);
      setSearchQuery('');
      toast.success('Chat found!');
    } else {
      toast.error('No chat found with that search term');
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.messages && chat.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  const startEditingTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const saveEditedTitle = async () => {
    if (!editingChatId || !editTitle.trim()) return;
    
    try {
      await axios.put(`${API_BASE_URL}/api/chats/${editingChatId}/title`, {
        title: editTitle.trim()
      });
      
      setChats(prev => prev.map(chat => 
        chat._id === editingChatId 
          ? { ...chat, title: editTitle.trim(), updatedAt: new Date() }
          : chat
      ));
      
      moveChatToTop(editingChatId);
      setEditingChatId(null);
      setEditTitle('');
      toast.success('Chat title updated');
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update chat title');
    }
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

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/chats/${chatId}`);
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      // First create the chat since this is the first message
      const chatResponse = await axios.post(`${API_BASE_URL}/api/chats`);
      const newChat = chatResponse.data;
      
      // Then send the message to the newly created chat
      const messageResponse = await axios.post(`${API_BASE_URL}/api/chats/${newChat._id}/messages`, {
        message: userMessage,
        location: currentLocation
      });

      // Update the chats list with the new chat
      const updatedChat = {
        ...newChat,
        messages: [messageResponse.data.userMessage, messageResponse.data.assistantMessage],
        title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
        updatedAt: new Date()
      };
      
      setChats(prev => [updatedChat, ...prev]);
      
      // Redirect to the new chat page
      router.push(`/chat/${newChat._id}`);
      
      toast.success('Chat created and message sent');
    } catch (error) {
      console.error('Error creating chat and sending message:', error);
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

  const navigateToSettings = () => {
    router.push('/settings');
  };

  const renderPlaceRecommendations = (placesData: PlaceData[]) => {
    if (!placesData || placesData.length === 0) return null;

    return (
      <div className="mt-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">📍 Places Found:</h4>
        {placesData.slice(0, 3).map((place, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-800 mb-1">{place.name}</h5>
                <p className="text-sm text-gray-600 mb-2">{place.address}</p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {place.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{place.rating}</span>
                    </div>
                  )}
                  {place.priceLevel && (
                    <span>{'$'.repeat(place.priceLevel)}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  {place.phoneNumber && (
                    <a href={`tel:${place.phoneNumber}`} className="text-blue-500 hover:text-blue-600">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {place.website && (
                    <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              
              {place.photos && place.photos.length > 0 && (
                <img 
                  src={place.photos[0]} 
                  alt={place.name}
                  className="w-16 h-16 rounded-lg object-cover ml-3"
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Show loading while authentication is being checked
  if (!mounted || authLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login');
    return null;
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
                    {filteredChats.map((chat, index) => (
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
                        className="p-3 rounded-xl cursor-pointer transition-all duration-200 group flex items-start justify-between hover:bg-gray-50 border border-transparent"
                      >
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5 transition-colors duration-200 text-gray-400" />
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
                                <p className="text-sm leading-5 line-clamp-2 font-medium transition-colors duration-200 text-gray-800">
                                  {chat.title}
                                </p>
                                <p className="text-xs mt-1 transition-colors duration-200 text-gray-500">
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
                              <Check className="w-4 h-4" />
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
                    ))}
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
              </div>
            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
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
              <h1 className="text-lg font-bold text-gray-800">New Chat</h1>
              <p className="text-sm text-gray-500">
                Start a conversation • Local Business Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Location Status */}
            <div className="flex items-center space-x-2">
              <MapPin className={`w-4 h-4 ${locationEnabled ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {locationEnabled ? 'Location enabled' : 'Location disabled'}
              </span>
            </div>
            <div className="text-sm text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Messages Area - Always show empty state for new chat */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white" style={{ scrollBehavior: 'smooth' }}>
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
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Find Local Businesses & Services</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  I help you discover restaurants, shops, and services near you with detailed information, reviews, and contact details!
                </p>
                
                {!locationEnabled && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center space-x-2 text-amber-800 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Location Required</span>
                    </div>
                    <p className="text-amber-700 text-sm">
                      Enable location sharing to get personalized recommendations for businesses near you.
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Suggestion Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8"
              >
                {[
                  { text: "Find pizza places nearby", query: "Best pizza places near me with menu and prices" },
                  { text: "Local bakeries", query: "List all bakeries near me with their specialties" },
                  { text: "Clothing stores", query: "Find clothing stores near me" },
                  { text: "Electronics shops", query: "Electronics stores near me with phone numbers" }
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
                placeholder="Ask me about local businesses, restaurants, shops..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 pr-28 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                disabled={isLoading}
              />
              
              {/* Location Toggle */}
              <div className="absolute right-16 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    locationEnabled 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  } ${locationLoading ? 'animate-pulse' : ''}`}
                  title={locationEnabled ? 'Location enabled' : 'Click to enable location'}
                >
                  {locationLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Navigation className={`w-4 h-4 ${locationEnabled ? 'text-green-600' : 'text-gray-500'}`} />
                  )}
                </motion.button>
              </div>
              
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
              <span className="text-xs text-gray-500">Try asking:</span>
              {[
                "Pizza near me with menu",
                "Bakeries with prices",
                "Clothing stores nearby",
                "Electronics shops"
              ].map((action) => (
                <motion.button
                  key={action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMessage(action)}
                  className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-all"
                >
                  {action}
                </motion.button>
              ))}
            </div>

            {/* Location Permission Notice */}
            {!locationEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center"
              >
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  💡 Enable location for personalized local business recommendations
                </p>
              </motion.div>
            )}
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

export default NewChatPage;
