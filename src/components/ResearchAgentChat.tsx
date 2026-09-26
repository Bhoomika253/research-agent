import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, MessageSquare, Terminal } from 'lucide-react';
import { PaperAnalysis, StudentOpportunity } from '../types/paper';

interface ResearchAgentChatProps {
  paper: PaperAnalysis;
  selectedProject?: StudentOpportunity | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export const ResearchAgentChat: React.FC<ResearchAgentChatProps> = ({ paper, selectedProject }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'agent',
      text: `Hello! I am your CS Research Advisor. We've synthesized "${paper.title}". You can ask me how to implement any of the 3 student extensions in PyTorch, questions about the math, or how to benchmark these on Google Colab or consumer GPUs.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // If selected project changes, suggest quick prompt
  useEffect(() => {
    if (selectedProject) {
      setInput(`How would I write the PyTorch forward loop for: "${selectedProject.title}"?`);
    }
  }, [selectedProject]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperTitle: paper.title,
          question: userMsg.text,
          currentAnalysis: paper,
          selectedProject,
        }),
      });

      const data = await res.json();
      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        text: data.answer || "I've reviewed your question. Could you clarify which layer or metric you want to zoom into?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: "I couldn't process that question right now. Please verify your connection or try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What GPU specs do I need to reproduce this on a student budget?",
    "Explain the loss function and gradient flow in plain English.",
    "How can I highlight this paper in a FAANG SWE / AI engineering interview?",
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-indigo-400 uppercase">Research Advisor Q&A</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">Interactive</span>
            </div>
            <h4 className="text-xs text-slate-300 font-medium">Deep-Dive Implementation & Mentorship</h4>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-indigo-300 border border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
              <span
                className={`block text-[10px] mt-1.5 font-mono ${
                  msg.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Consulting research agent...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/60 overflow-x-auto flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">Suggested:</span>
        {sampleQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-full whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a technical question about the paper, equations, or PyTorch code..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-sans"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
