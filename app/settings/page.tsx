'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Mail,
  Globe,
  Shield,
  Bell,
  Moon,
  Sun,
  MapPin,
  Smartphone,
  Save,
  Eye,
  EyeOff,
  Edit3,
  Check,
  X,
  Trash2,
  Download,
  Upload,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  preferredLanguage: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  locationSharing: boolean;
  language: string;
  autoSave: boolean;
}

const SettingsPage = () => {
  const { user, logout, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile states
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || '',
    email: user?.email || '',
    preferredLanguage: user?.preferredLanguage || 'en'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<UserProfile>(profile);
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // App settings states
  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'light',
    notifications: true,
    locationSharing: false,
    language: 'en',
    autoSave: true
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    setMounted(true);
    if (user) {
      setProfile({
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage
      });
      setOriginalProfile({
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage
      });
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/settings`);
      if (response.data) {
        setAppSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const saveProfile = async () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/user/profile`, profile);
      updateUser(profile);
      setOriginalProfile(profile);
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelProfileEdit = () => {
    setProfile(originalProfile);
    setIsEditingProfile(false);
  };

  const changePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/user/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      toast.success('Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAppSettings = async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...appSettings, ...newSettings };
    setAppSettings(updatedSettings);
    
    try {
      await axios.put(`${API_BASE_URL}/api/user/settings`, updatedSettings);
      toast.success('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const exportData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/export`);
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-ai-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    setIsLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/user/account`);
      logout();
      router.push('/');
      toast.success('Account deleted successfully');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.error || 'Failed to delete account');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Download }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/chat')}
                className="text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                <p className="text-sm text-gray-500">Manage your account and preferences</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </nav>
              
              {/* Logout Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200"
              >
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
                      {!isEditingProfile && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </motion.button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-2xl">
                            {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-800">{profile.name}</h3>
                          <p className="text-sm text-gray-500">Profile picture is automatically generated</p>
                        </div>
                      </div>

                      {/* Profile Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              value={profile.name}
                              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                              disabled={!isEditingProfile}
                              className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                !isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white text-gray-800'
                              }`}
                              placeholder="Enter your full name"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="email"
                              value={profile.email}
                              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                              disabled={!isEditingProfile}
                              className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                !isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white text-gray-800'
                              }`}
                              placeholder="Enter your email address"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Language
                          </label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                              value={profile.preferredLanguage}
                              onChange={(e) => setProfile(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                              disabled={!isEditingProfile}
                              className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                !isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white text-gray-800'
                              }`}
                            >
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="fr">French</option>
                              <option value="de">German</option>
                              <option value="it">Italian</option>
                              <option value="pt">Portuguese</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {isEditingProfile && (
                        <div className="flex items-center space-x-4 pt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={saveProfile}
                            disabled={isLoading}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={cancelProfileEdit}
                            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </motion.button>
                        </div>
                      )}

                      {/* Password Change Section */}
                      <div className="pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-800">Password</h3>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            Change Password
                          </motion.button>
                        </div>

                        <AnimatePresence>
                          {showPasswordForm && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-4"
                            >
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Current Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter current password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  New Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter new password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Confirm New Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Confirm new password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={changePassword}
                                  disabled={isLoading}
                                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                  {isLoading ? 'Changing...' : 'Change Password'}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setShowPasswordForm(false);
                                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                  }}
                                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-all"
                                >
                                  Cancel
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">App Preferences</h2>
                    
                    <div className="space-y-6">
                      {/* Theme Setting */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Sun className="w-5 h-5 text-gray-600" />
                          <div>
                            <h3 className="font-medium text-gray-800">Theme</h3>
                            <p className="text-sm text-gray-500">Choose your preferred theme</p>
                          </div>
                        </div>
                        <select
                          value={appSettings.theme}
                          onChange={(e) => saveAppSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                          className="bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>

                      {/* Notifications Setting */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Bell className="w-5 h-5 text-gray-600" />
                          <div>
                            <h3 className="font-medium text-gray-800">Notifications</h3>
                            <p className="text-sm text-gray-500">Receive notifications about updates</p>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => saveAppSettings({ notifications: !appSettings.notifications })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            appSettings.notifications ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              appSettings.notifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </motion.button>
                      </div>

                      {/* Location Sharing Setting */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-gray-600" />
                          <div>
                            <h3 className="font-medium text-gray-800">Location Sharing</h3>
                            <p className="text-sm text-gray-500">Allow location-based recommendations</p>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => saveAppSettings({ locationSharing: !appSettings.locationSharing })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            appSettings.locationSharing ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              appSettings.locationSharing ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </motion.button>
                      </div>

                      {/* Auto Save Setting */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Save className="w-5 h-5 text-gray-600" />
                          <div>
                            <h3 className="font-medium text-gray-800">Auto Save</h3>
                            <p className="text-sm text-gray-500">Automatically save chat conversations</p>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => saveAppSettings({ autoSave: !appSettings.autoSave })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            appSettings.autoSave ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              appSettings.autoSave ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </motion.button>
                      </div>

                      {/* Location Management */}
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-gray-600" />
                            <div>
                              <h3 className="font-medium text-gray-800">Location Data</h3>
                              <p className="text-sm text-gray-500">Manage your saved location information</p>
                            </div>
                          </div>
                        </div>
                        
                        {user?.location ? (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-600">
                              <p><span className="font-medium">Address:</span> {user.location.address || 'No address available'}</p>
                              <p><span className="font-medium">Coordinates:</span> {user.location.latitude.toFixed(6)}, {user.location.longitude.toFixed(6)}</p>
                              <p><span className="font-medium">Last updated:</span> {new Date(user.location.lastUpdated).toLocaleDateString()}</p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                try {
                                  await axios.delete(`${API_BASE_URL}/api/user/location`);
                                  updateUser({ ...user, location: undefined });
                                  toast.success('Location data cleared');
                                } catch (error) {
                                  console.error('Error clearing location:', error);
                                  toast.error('Failed to clear location data');
                                }
                              }}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Clear Location Data
                            </motion.button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No location data saved. Enable location in the chat to save your location.</p>
                        )}
                      </div>

                      {/* Language Setting */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Globe className="w-5 h-5 text-gray-600" />
                          <div>
                            <h3 className="font-medium text-gray-800">App Language</h3>
                            <p className="text-sm text-gray-500">Choose your preferred language</p>
                          </div>
                        </div>
                        <select
                          value={appSettings.language}
                          onChange={(e) => saveAppSettings({ language: e.target.value })}
                          className="bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="it">Italian</option>
                          <option value="pt">Portuguese</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy & Security Tab */}
                {activeTab === 'privacy' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Privacy & Security</h2>
                    
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-blue-800 mb-1">Data Protection</h3>
                            <p className="text-sm text-blue-700">
                              Your conversations are encrypted and stored securely. We never share your personal data with third parties.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-medium text-gray-800 mb-3">Account Security</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Two-factor authentication</span>
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Login notifications</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-medium text-gray-800 mb-3">Data Usage</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>• Location data is only used for local business recommendations</p>
                          <p>• Chat history is stored locally and encrypted</p>
                          <p>• Analytics data is anonymized and aggregated</p>
                          <p>• You can export or delete your data at any time</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Management Tab */}
                {activeTab === 'data' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Data Management</h2>
                    
                    <div className="space-y-6">
                      {/* Export Data */}
                      <div className="border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Download className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-2">Export Your Data</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Download all your chat conversations, settings, and profile data in JSON format.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={exportData}
                              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                            >
                              <Download className="w-4 h-4" />
                              <span>Export Data</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      {/* Import Data */}
                      <div className="border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Upload className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-2">Import Data</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Import previously exported chat data to restore your conversations.
                            </p>
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                          </div>
                        </div>
                      </div>

                      {/* Delete Account */}
                      <div className="border border-red-200 rounded-xl p-6 bg-red-50">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <Trash2 className="w-6 h-6 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-red-800 mb-2">Delete Account</h3>
                            <p className="text-sm text-red-600 mb-4">
                              Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={deleteAccount}
                              disabled={isLoading}
                              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>{isLoading ? 'Deleting...' : 'Delete Account'}</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
