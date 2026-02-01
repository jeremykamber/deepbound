'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { Persona } from '@/domain/entities/Persona'
import { PricingAnalysis } from '@/domain/entities/PricingAnalysis'
import { chatWithPersonaAction } from '@/actions/chatWithPersona'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MessageSquare, Send, User, Bot, Loader2, Sparkles, BrainCircuit, ShieldCheck } from 'lucide-react'
import { readStreamableValue } from '@ai-sdk/rsc'
import { Badge } from '@/components/ui/badge'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PersonaChatProps {
  persona: Persona
  analysis: PricingAnalysis | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const PersonaChat: React.FC<PersonaChatProps> = ({
  persona,
  analysis,
  isOpen,
  onOpenChange,
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState(true)

  // Smart Scrolling Logic
  useEffect(() => {
    if (isAutoScrollLocked) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAutoScrollLocked])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsAutoScrollLocked(isAtBottom)
  }

  const handleSend = () => {
    if (!input.trim() || isPending) return

    const userMessage = input.trim()
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsAutoScrollLocked(true) // Re-lock on send

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    startTransition(async () => {
      try {
        const { streamData } = await chatWithPersonaAction(
          persona,
          analysis,
          userMessage,
          messages
        )

        for await (const content of readStreamableValue(streamData)) {
          if (content) {
            setMessages((prev) => {
              const last = prev[prev.length - 1]
              if (last && last.role === 'assistant') {
                return [...prev.slice(0, -1), { role: 'assistant', content }]
              }
              return prev
            })
          }
        }
      } catch (error) {
        console.error('Chat error:', error)
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.role === 'assistant' && last.content === '') {
            return [...prev.slice(0, -1), { role: 'assistant', content: 'Connection lost. Please try again.' }]
          }
          return [...prev, { role: 'assistant', content: 'Connection lost. Please try again.' }]
        })
      }
    })
  }

  const parseMessageContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    let buffer = content;
    let keyIndex = 0;

    while (buffer.length > 0) {
      const openIndex = buffer.indexOf('<%');

      if (openIndex === -1) {
        parts.push(<span key={keyIndex++}>{buffer}</span>);
        break;
      }

      if (openIndex > 0) {
        parts.push(<span key={keyIndex++}>{buffer.slice(0, openIndex)}</span>);
      }

      const rest = buffer.slice(openIndex + 2);
      const closeIndex = rest.indexOf('%>');

      if (closeIndex === -1) {
        parts.push(
          <span key={keyIndex++} className="inline-flex items-center gap-1.5 font-medium text-primary italic animate-pulse">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>forming consensus...</span>
          </span>
        );
        break;
      }

      const tagContent = rest.slice(0, closeIndex);
      const [displayText, context] = tagContent.split('|').map(s => s.trim());

      parts.push(
        <TooltipProvider key={keyIndex++}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="underline decoration-dotted decoration-primary/50 cursor-help font-semibold text-primary hover:text-white transition-all duration-300 px-1.5 bg-primary/10 rounded-md border border-primary/20">
                {displayText || "..."}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm p-6 bg-background/95 backdrop-blur-xl border-primary/20 text-foreground shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-500 relative z-[100]">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border/10 pb-3">
                  <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Contextual Proof</p>
                </div>
                <p className="text-sm leading-relaxed italic text-muted-foreground font-light">
                  {context ? `"${context}"` : "This point is specifically rooted in their unique background and psychological profile."}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      buffer = rest.slice(closeIndex + 2);
    }
    return parts;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[950px] h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border/10 shadow-3xl rounded-[2.5rem]">
        <DialogHeader className="p-8 md:p-10 pb-4 border-b border-border/5 bg-background">
          <div className="flex items-center gap-6">
            <div className="size-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/40 shadow-inner">
              <User className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[8px] font-bold uppercase tracking-widest border-emerald-500/30 text-emerald-500 bg-emerald-500/10">Connected</Badge>
              </div>
              <DialogTitle className="text-xl font-medium tracking-tight text-foreground">
                {analysis ? `Consulting ${persona.name}` : `About ${persona.name}`}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-8 bg-white/[0.01] custom-scrollbar scroll-smooth"
        >
          <div className="space-y-6 pb-2">
            {messages.length === 0 && (
              <div className="text-center py-24 space-y-6 opacity-30">
                <div className="size-10 rounded-full border border-border/40 inline-flex items-center justify-center">
                  <MessageSquare className="size-4" />
                </div>
                <p className="text-muted-foreground text-xs font-light max-w-xs mx-auto leading-relaxed italic">
                  {analysis
                    ? "Deep-dive into their decision making process."
                    : `Ask ${persona.name} about their motivations.`
                  }
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  } animate-in fade-in slide-in-from-bottom-2 duration-500`}
              >
                <div
                  className={`flex-shrink-0 mt-1 size-7 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all ${message.role === 'user'
                    ? 'border border-border/20 text-muted-foreground/40'
                    : 'bg-primary/10 text-primary border border-primary/20'
                    }`}
                >
                  {message.role === 'user' ? 'YOU' : 'AI'}
                </div>
                <div
                  className={`max-w-[90%] rounded-[1.4rem] px-6 py-4 shadow-sm border ${message.role === 'user'
                    ? 'bg-white/[0.03] border-border/10 text-foreground font-medium rounded-tr-none'
                    : 'bg-background border-primary/10 text-foreground/90 rounded-tl-none font-light leading-relaxed text-base'
                    }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="whitespace-pre-wrap">
                      {parseMessageContent(message.content)}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap tracking-tight">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex gap-4 items-center">
                <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
                  <Bot className="size-3 text-primary/40" />
                </div>
                <div className="flex items-center gap-3 text-[9px] font-bold text-primary uppercase tracking-[0.2em]">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  Synthesizing
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>

        <div className="p-4 border-t border-border/10 bg-background/80 backdrop-blur-md relative z-10">
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
            {[
              "Why do you feel that way?",
              "What's your main priority?",
              "Is the price fair to you?",
              "What would make you buy instantly?"
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  if (isPending) return;
                  setInput(preset);
                }}
                className="whitespace-nowrap px-4 py-2 rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary/70 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-4 relative"
          >
            <Input
              placeholder={analysis ? `Ask ${persona.name} anything...` : `Chat with ${persona.name}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isPending}
              className="flex-1 h-14 bg-white/[0.03] border-border/20 px-8 text-base rounded-full focus:border-primary/40 focus:ring-0 transition-colors font-light placeholder:text-muted-foreground/20"
            />
            <Button
              type="submit"
              disabled={isPending || !input.trim()}
              variant="premium"
              className="size-14 rounded-full shadow-none shrink-0"
            >
              <Send className="size-5" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog >
  )
}
