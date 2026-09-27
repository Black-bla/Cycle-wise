import React, { useState } from 'react';
import { ExchangeCycle, SMEProfile } from '../agent/types';
import { Bot, Send, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import { Message, MessageContent, MessageHeader } from '@/components/ui/message';
import { Bubble, BubbleContent } from '@/components/ui/bubble';

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
}) => {
  const [question, setQuestion] = useState('');
  const modelPreference = 'auto';
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{
    sender: 'user' | 'agent';
    text: string;
    risk?: string;
  }>>([
    {
      sender: 'agent',
      text: cycle
        ? `Jambo! Ask me anything about this trade — how delivery works, how the value was split, or what happens if someone backs out. English, Kiswahili, or Sheng all work.`
        : 'Jambo! Ask me anything about how Cyclewise trades work, or how businesses are verified.',
    },
  ]);

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
          model_preference: modelPreference,
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
          risk: data.risk_assessment,
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 bg-primary text-primary-foreground gap-1">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground">
              <Bot className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-primary-foreground">Ask About This Trade</DialogTitle>
              <DialogDescription className="text-primary-foreground/70">
                Answers only use facts from this exchange — nothing made up.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {cycle && (
          <div className="bg-muted px-4 py-2 border-b text-xs">
            <span className="text-muted-foreground">
              This trade: {cycle.sme_sequence.map((id) => smes.get(id)?.name || id).join(' → ')}
            </span>
          </div>
        )}

        <MessageScrollerProvider>
        <MessageScroller className="flex-1 min-h-[280px]">
          <MessageScrollerViewport className="px-4 sm:px-5 py-4">
            <MessageScrollerContent>
              {messages.map((m, idx) => (
                <MessageScrollerItem key={idx}>
                  <Message align={m.sender === 'user' ? 'end' : 'start'}>
                    <MessageContent>
                      <MessageHeader>
                        {m.sender === 'user' ? 'You' : 'Cyclewise'}
                      </MessageHeader>
                      <Bubble align={m.sender === 'user' ? 'end' : 'start'} variant={m.sender === 'user' ? 'default' : 'outline'}>
                        <BubbleContent className="space-y-1.5">
                          <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                          {m.risk && (
                            <div className="pt-1.5 mt-1 border-t border-current/10 flex items-start gap-1.5 text-[11px] opacity-80">
                              <ShieldCheck className="size-3.5 shrink-0" />
                              <span>{m.risk}</span>
                            </div>
                          )}
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
        </MessageScrollerProvider>

        <div className="px-3 sm:px-4 py-2 bg-muted border-t flex items-center gap-1.5 overflow-x-auto">
          {quickQuestions.map((q, idx) => (
            <Button
              key={idx}
              size="xs"
              variant="secondary"
              className="shrink-0 rounded-full"
              disabled={isLoading}
              onClick={() => handleAsk(q.q)}
            >
              {q.label}
            </Button>
          ))}
        </div>

        <div className="p-3 sm:p-4 bg-background border-t flex items-center gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk();
            }}
            placeholder="Ask in English, Swahili or Sheng..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={() => handleAsk()} disabled={isLoading || !question.trim()}>
            <Send data-icon="inline-start" />
            <span className="hidden sm:inline">Ask</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
