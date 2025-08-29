'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MessageSquare, Zap, Globe, Shield, ArrowRight } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/chat');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-gradient overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-bounce-light"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="bg-black/20 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">A</span>
                </div>
                <span className="text-white text-xl font-bold">AI GPT</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-8">
                Your AI-Powered
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Shopping Assistant
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Find the best deals, discover local businesses, and get personalized recommendations 
                with our intelligent chatbot that understands your needs in multiple languages.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link href="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center space-x-2 hover:from-purple-600 hover:to-indigo-700 transition-all shadow-2xl"
                  >
                    <span>Start Chatting</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="border-2 border-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:border-purple-500 hover:bg-white/5 transition-all backdrop-blur-xl"
                  >
                    Sign In
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-32"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
              <p className="text-gray-400 text-lg">Everything you need for smart shopping and local discovery</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: MessageSquare,
                  title: 'Smart Conversations',
                  description: 'Natural language understanding with context-aware responses'
                },
                {
                  icon: Globe,
                  title: 'Multilingual Support',
                  description: 'Communicate in your preferred language with automatic detection'
                },
                {
                  icon: Zap,
                  title: 'Instant Recommendations',
                  description: 'Get personalized suggestions based on your location and preferences'
                },
                {
                  icon: Shield,
                  title: 'Secure & Private',
                  description: 'Your conversations are encrypted and your privacy is protected'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                  className="bg-card-gradient backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center hover:border-purple-500/30 transition-all"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-32 text-center"
          >
            <div className="bg-card-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-12 max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-white mb-6">Ready to get started?</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of users who are already discovering amazing deals and local businesses 
                with our AI assistant.
              </p>
              
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-12 py-4 rounded-2xl font-semibold text-xl flex items-center space-x-3 mx-auto hover:from-purple-600 hover:to-indigo-700 transition-all shadow-2xl"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="bg-black/20 backdrop-blur-xl border-t border-white/10 mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <span className="text-white text-lg font-bold">AI GPT</span>
              </div>
              <p className="text-gray-400">
                © 2024 AI GPT. All rights reserved. | Your intelligent shopping companion.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}