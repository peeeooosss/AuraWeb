import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { authFetch } from '../../lib/api';

function ChatBubble({ role, text }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
        role === 'user'
          ? 'bg-[#F3F0FF] text-[#191919] rounded-br-md'
          : 'bg-[#FAFBFC] border border-[#EDEEEF] text-[#191919] rounded-bl-md'
      }`}>
        {role === 'assistant' ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        ) : (
          <p className="leading-relaxed">{text}</p>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({ presentationId, outlines, onRefreshOutlines, disabled }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || disabled) return;
    setInput('');
    setSending(true);

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Step 1: Save current outlines before sending chat
      if (outlines && outlines.length > 0) {
        const slides = outlines.map(s => ({ content: s.content || '' }));
        await authFetch(`/api/v1/ppt/outlines/${presentationId}`, {
          method: 'PUT',
          body: JSON.stringify({ slides }),
        });
      }

      // Step 2: Send chat message
      const res = await authFetch('/api/v1/ppt/chat/message', {
        method: 'POST',
        body: JSON.stringify({ presentation_id: presentationId, message: text }),
      });
      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.response || 'Done!' }]);

      // Step 3: Refresh outlines after AI modifies them
      const outRes = await authFetch(`/api/v1/ppt/outlines/${presentationId}`);
      if (outRes.ok) {
        const outData = await outRes.json();
        if (outData?.slides) {
          onRefreshOutlines(outData.slides.map((s, i) => ({
            _key: `s-${i}`, content: s.content || '', title: s.title || '',
          })));
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Try again.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDEEEF] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D5CAFC] to-[#FDE4C2] flex items-center justify-center">
            <Sparkles size={12} className="text-[#7A5AF8]" />
          </div>
          <span className="font-syne text-sm font-semibold text-[#191919]">AI Assistant</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 p-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles size={24} className="text-[#808080]/40 mx-auto mb-3" />
            <p className="text-xs text-[#808080]">Ask the AI to modify your outline.</p>
            <p className="text-[10px] text-[#808080]/60 mt-1">e.g., "Add a slide about budget"</p>
          </div>
        ) : (
          messages.map((m, i) => <ChatBubble key={i} role={m.role} text={m.text} />)
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-[#EDEEEF] shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={disabled ? 'Outline still streaming...' : 'Ask AI to modify your outline...'}
            disabled={disabled || sending}
            className="flex-1 text-xs rounded-xl border border-[#EDEEEF] px-3 py-2.5 text-[#191919] placeholder:text-[#808080]/60 disabled:bg-gray-50 focus:outline-none focus:border-[#7A5AF8]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || disabled}
            className="shrink-0 w-9 h-9 rounded-xl bg-[#7A5AF8] text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
