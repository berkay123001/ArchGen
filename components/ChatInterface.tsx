
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Markdown } from './Markdown';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  lang: 'en' | 'tr';
}

export const ChatInterface: React.FC<Props> = ({ messages, onSendMessage, isLoading, lang }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const t = {
    title: lang === 'tr' ? 'Mimar Asistanı' : 'Architect Assistant',
    subtitle: lang === 'tr' ? 'Gemini 3 Pro ile Güçlendirildi' : 'Powered by Gemini 3 Pro',
    aiRole: lang === 'tr' ? 'AI MİMAR' : 'AI ARCHITECT',
    placeholder: lang === 'tr' ? 'Sistemin hakkında sor...' : 'Ask about your system...',
    send: lang === 'tr' ? 'Gönder' : 'Send'
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 border-l border-slate-700">
      <div className="p-4 border-b border-slate-700 bg-slate-900/50">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <span className="material-icons text-blue-400">smart_toy</span>
          {t.title}
        </h3>
        <p className="text-xs text-slate-400">{t.subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-xl p-4 text-sm shadow-md ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-200 border border-slate-600'
            }`}>
               {msg.role === 'model' && (
                  <div className="flex items-center gap-1 mb-2 text-xs text-blue-300 font-bold uppercase tracking-wider border-b border-slate-600 pb-1">
                     {t.aiRole}
                  </div>
               )}
               <div className="font-sans">
                   <Markdown content={msg.text} />
               </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-lg p-3 flex gap-2 items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 font-medium text-sm transition-colors"
          >
            {t.send}
          </button>
        </div>
      </form>
    </div>
  );
};
