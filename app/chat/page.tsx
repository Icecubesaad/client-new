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
    if (!authLoading && user) {
      console.log('📱 Redirecting to new chat...');
      router.replace('/chat/new');
    } else if (!authLoading && !user) {
      console.log('🔒 No user, redirecting to login...');
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Show loading while redirecting
  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {authLoading ? 'Loading...' : user ? 'Redirecting to chat...' : 'Redirecting to login...'}
        </p>
      </div>
    </div>
  );
};

export default ChatRedirectPage;
