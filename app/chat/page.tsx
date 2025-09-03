'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const ChatRedirectPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://server-test-steel.vercel.app';

    useEffect(() => {
    const redirectToNewChat = () => {
      if (!user || authLoading) return;
      
      // Simply redirect to the new chat page without creating database entry
      router.replace('/chat/new');
    };

    redirectToNewChat();
  }, [user, authLoading, router]);

  // Show loading while redirecting
  if (authLoading || !user) {
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
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Creating new chat...</p>
        </div>
    </div>
  );
};

export default ChatRedirectPage;
