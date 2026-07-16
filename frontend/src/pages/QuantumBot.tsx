import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Lightbulb } from 'lucide-react';
import { chatbotService } from '@/services/complianceCommunityService';
import type { ChatMessage } from '@/types/compliance-community-chatbot.types';

export default function QuantumBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'Hello! I\'m QuantumBot, your AI assistant for all things quantum cryptography and post-quantum migration. I can help you understand post-quantum algorithms, migration strategies, compliance requirements, and more. What would you like to know?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const sug = await chatbotService.getSuggestions();
        setSuggestions(sug);
      } catch (err) {
        console.error('Failed to load chatbot suggestions', err);
      }
    };
    loadSuggestions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue;
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    // Get bot response
    try {
      const botResponse = await chatbotService.sendMessage(content);
      
      if (botResponse) {
        setMessages(prev => [...prev, botResponse]);
      }
    } catch (err: any) {
      // Fallback response on error
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: err.response?.data?.message || 'I encountered an issue processing your question. Please verify your connection or try again.',
        timestamp: new Date().toISOString()
      }]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-blue-400" />
            QuantumBot
          </h1>
          <p className="text-gray-300 text-lg">
            AI assistant for quantum cryptography questions and post-quantum migration guidance
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-gray-100 border border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-gray-100 border border-slate-700 rounded-lg p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (show when no messages or after welcome) */}
          {messages.length === 1 && suggestions.length > 0 && (
            <div className="border-t border-slate-700 p-4 bg-slate-800 bg-opacity-50">
              <div className="flex items-center gap-2 mb-3 text-gray-400">
                <Lightbulb className="w-4 h-4" />
                <span className="text-sm font-semibold">Popular Questions:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestions.slice(0, 4).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-gray-300 text-sm transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-700 p-4 bg-slate-800">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                placeholder="Ask about quantum cryptography, migration strategies, compliance..."
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 placeholder-gray-500"
                disabled={loading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputValue.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-slate-800 border-t border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-500 text-center">
            QuantumBot provides information about quantum cryptography and post-quantum migration strategies. 
            For critical security decisions, consult with cryptography experts and security professionals.
          </p>
        </div>
      </div>
    </div>
  );
}
