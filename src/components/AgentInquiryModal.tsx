import React, { useState } from 'react';
import { ExchangeCycle, SMEProfile } from '../agent/types';
import { Bot, Sparkles, Send, X, ShieldCheck, AlertCircle, ArrowRight, CornerDownLeft, RefreshCw, MessageSquare } from 'lucide-react';

interface AgentInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: ExchangeCycle | null;
  smes: Map<string, SMEProfile>;
  onRunSubstitute?: (declinedSmeId: string) => void;
}

export const AgentInquiryModal: React.FC<AgentInquiryModalProps> = ({
  isOpen,
  onClose,
  cycle,
  smes,
  onRunSubstitute,
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{
    sender: 'user' | 'agent';
    text: string;
    model?: string;
    durationMs?: number;
    risk?: string;
    citations?: string[];
  }>>([
    {
      sender: 'agent',
      text: cycle
        ? `Jambo! I am Cyclewise AI Coordinator powered by Gemini. I have verified facts for this ${cycle.cycle_length}-business rescue loop (KES ${cycle.estimated_value_unlocked.toLocaleString()} unlocked). You can ask me how delivery works, how parity is calculated, how participants are protected, or ask questions in English, Kiswahili, or Sheng.`
        : 'Jambo! I am Cyclewise AI Coordinator powered by Gemini. Ask me any question about the SME exchange network, trust verification, or how reciprocal barter loops prevent debt.',
      citations: ['Cyclewise Verified Graph Engine', 'National Registry Verification'],
    },
  ]);

  if (!isOpen) return null;

  const quickQuestions = [
    { label: 'Why no debt?', q: 'How does this cycle protect SMEs from emergency cash loans or bad debt?' },
    { label: 'Amina details', q: 'What does Amina Foods give and receive in this exchange cycle?' },
    { label: 'Kiswahili summary', q: 'Eleza kwa Kiswahili jinsi biashara hizi 4 zinavyosaidiana bila mkopo.' },
    { label: 'Late delivery risk', q: 'What happens if a participant like GreenPack or SwiftMove delivers late?' },
  ];

  const handleAsk = async (userQ?: string) => {
    const textToAsk = userQ || question;
    if (!textToAsk.trim() || isLoading) return;

    setQuestion('');
    setMessages((prev) => [...prev, { sender: 'user', text: textToAsk }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/agent/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToAsk,
          cycle: cycle || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Inquiry error: HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: data.answer,
          model: data.model_used,
          durationMs: data.duration_ms,
          risk: data.risk_assessment,
          citations: data.grounded_citations,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inquiry request failed';
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `Samahani, network error occurred: ${msg}. Please retry.`,
          risk: 'Transient connection error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FAF9F5] border border-[#E3E0D7] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#18243A] text-white flex items-center justify-between border-b border-[#253654]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#233554] border border-[#E7B84B]/30 flex items-center justify-center text-[#E7B84B]">
              <Bot className="w-5 h-5 text-[#E7B84B]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white">Cyclewise AI Coordinator</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2E8B68]/30 text-[#86E4B9] font-medium border border-[#2E8B68]/40">
                  Gemini Grounded Agent
                </span>
              </div>
              <p className="text-xs text-[#A6B2C3]">
                Strict Grounding &bull; Multilingual EN / SW / Sheng &bull; Zero Fake Data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A6B2C3] hover:text-white hover:bg-[#253752] transition-colors"
            aria-label="Close Agent modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cycle context bar if cycle is present */}
        {cycle && (
          <div className="bg-[#EFECE4] px-4 py-2 border-b border-[#E3E0D7] flex flex-wrap items-center justify-between text-xs gap-1">
            <div className="flex items-center gap-1.5 text-[#18243A]">
              <span className="font-bold">Active Context:</span>
              <span>{cycle.cycle_length}-SME Loop (KES {cycle.estimated_value_unlocked.toLocaleString()})</span>
            </div>
            <div className="text-[11px] text-[#68727D]">
              Participants: {cycle.sme_sequence.map((id) => smes.get(id)?.name || id).join(' → ')}
            </div>
          </div>
        )}

        {/* Conversation transcript */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 sm:p-3.5 space-y-1.5 ${
                  m.sender === 'user'
                    ? 'bg-[#18243A] text-white rounded-br-xs'
                    : 'bg-white border border-[#E3E0D7] text-[#17202A] rounded-bl-xs shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] pb-1 border-b border-black/5">
                  <span className={`font-semibold ${m.sender === 'user' ? 'text-[#E7B84B]' : 'text-[#68727D]'}`}>
                    {m.sender === 'user' ? 'You (SME Owner)' : 'Cyclewise Agent (Gemini)'}
                  </span>
                  {m.durationMs !== undefined && (
                    <span className="text-[#68727D] font-mono text-[9px]">
                      {m.model} &bull; {m.durationMs}ms
                    </span>
                  )}
                </div>

                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                {m.risk && (
                  <div className="pt-1.5 mt-1 border-t border-[#EFECE4] flex items-start space-x-1.5 text-[11px] text-[#D8783D]">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#2E8B68]" />
                    <span>Risk Check: {m.risk}</span>
                  </div>
                )}

                {m.citations && m.citations.length > 0 && (
                  <div className="text-[10px] text-[#68727D] pt-1">
                    Citations: {m.citations.join(' &bull; ')}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-[#68727D] py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2E8B68]" />
              <span>Cyclewise Agent is analyzing exchange graph facts with Gemini...</span>
            </div>
          )}
        </div>

        {/* Quick query chips */}
        <div className="p-2 sm:px-4 bg-[#F2EFE8] border-t border-[#E3E0D7] flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-[#68727D] shrink-0 font-medium text-[10px] uppercase">Ask:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q.q)}
              disabled={isLoading}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#E3E0D7] text-[#18243A] border border-[#D5D1C4] transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E3E0D7] flex items-center space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk();
            }}
            placeholder="Uliza chochote kuhusu mzunguko huu (Ask in English, Swahili or Sheng)..."
            className="flex-1 p-2.5 rounded-xl border border-[#E3E0D7] text-xs sm:text-sm text-[#17202A] focus:ring-2 focus:ring-[#18243A] focus:border-transparent outline-hidden bg-[#FAF9F5]"
            disabled={isLoading}
          />
          <button
            onClick={() => handleAsk()}
            disabled={isLoading || !question.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#18243A] hover:bg-[#253752] text-[#E7B84B] font-semibold text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask Agent</span>
          </button>
        </div>
      </div>
    </div>
  );
};
