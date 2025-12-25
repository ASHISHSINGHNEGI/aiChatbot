'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, X, MessageCircle } from 'lucide-react';

/**
 * API CONFIGURATION
 * Update this URL to match your backend port (defaulting to 3001)
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Message {
  _id: string;
  role: string;
  content: string;
}

const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<null | string>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Session & Load History
  useEffect(() => {
    const savedId = localStorage.getItem('chat_conversation_id');
    if (savedId) {
      setConversationId(savedId);
      fetchHistory(savedId);
    }
  }, []);

  // 2. Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchHistory = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }     
  };

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {   
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Optimistic Update: Add user message to UI immediately
    const tempUserMsg = { _id: Date.now().toString(), role: 'user', content: userMessage };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
          message: userMessage
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save conversationId if this was the first message
        if (!conversationId && data.sessionId) {
          setConversationId(data.sessionId);
          localStorage.setItem('chat_conversation_id', data.sessionId);
        }
        
        // Add AI response to UI
        setMessages(prev => [...prev, data.message]);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        _id: 'error', 
        role: 'ai', 
        content: "I'm sorry, I'm having trouble connecting to the server. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">GadgetStore Demo</h1>
        <p className="text-gray-600">Click the chat bubble in the bottom right to talk to our AI Support Agent.</p>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-50 ${
          isOpen ? 'bg-red-500 rotate-90' : 'bg-indigo-600 hover:bg-indigo-700'
        } text-white`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Widget Container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="bg-indigo-600 p-4 text-white flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-sm">GadgetStore Support</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-xs text-indigo-100">AI Agent Online</span>
              </div>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-10 px-6">
                <Bot size={40} className="mx-auto text-indigo-200 mb-3" />
                <p className="text-gray-500 text-sm italic">
                  Hi! I'm your GadgetStore assistant. Ask me about shipping, returns, or support hours!
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-gray-300' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                    <Loader2 size={16} className="animate-spin text-indigo-400" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full pl-4 pr-12 py-3 border-none rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:text-indigo-600 transition-all outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Powered by GadgetStore AI Support
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default App;