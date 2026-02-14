import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Eraser, Cpu } from 'lucide-react';

const OPEN_SOURCE_MODELS = [
  "Llama-3-70B-Instruct",
  "Mistral-Large",
  "Qwen1.5-72B-Chat",
  "Yi-34B-Chat",
  "Gemma-7B-IT"
];

interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const AIAnalysis = () => {
  const [selectedModel, setSelectedModel] = useState(OPEN_SOURCE_MODELS[0]);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'ai',
      content: '主人，有什么奴才可以为你效劳？',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const newAiMsg: Message = {
        id: Date.now() + 1,
        role: 'ai',
        content: '演示而已，需求都还没提',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, newAiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if(window.confirm("确定要清空聊天记录吗？")) {
        setMessages([{
            id: 1,
            role: 'ai',
            content: '主人，有什么奴才可以为你效劳？',
            timestamp: new Date().toLocaleTimeString()
        }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-black text-slate-800 text-lg">AI 智能分析</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Powered by Open Source LLMs</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
             <Cpu size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors"/>
             <select 
               value={selectedModel}
               onChange={(e) => setSelectedModel(e.target.value)}
               className="h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 hover:border-indigo-300 transition-all cursor-pointer shadow-sm appearance-none min-w-[180px]"
             >
               {OPEN_SOURCE_MODELS.map(model => (
                 <option key={model} value={model}>{model}</option>
               ))}
             </select>
           </div>
           <button 
             onClick={handleClearHistory}
             className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
             title="清空会话"
           >
             <Eraser size={18} />
           </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${msg.role === 'ai' ? 'bg-white border-indigo-100' : 'bg-slate-900 border-slate-800'}`}>
              {msg.role === 'ai' ? <Bot size={20} className="text-indigo-600" /> : <User size={20} className="text-white" />}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
               <div className={`px-5 py-3.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                 msg.role === 'user' 
                   ? 'bg-slate-900 text-white rounded-tr-none' 
                   : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
               }`}>
                 {msg.content}
               </div>
               <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">{msg.timestamp}</span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
               <Bot size={20} className="text-indigo-600" />
            </div>
            <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative max-w-4xl mx-auto">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入指令给奴才..."
            className="w-full h-14 pl-6 pr-14 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 top-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all active:scale-95 shadow-md shadow-indigo-200"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-bold">
          AI generated content may be inaccurate. Please verify important information.
        </p>
      </div>
    </div>
  );
};

export default AIAnalysis;