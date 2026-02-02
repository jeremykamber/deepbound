'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { Persona } from '@/domain/entities/Persona'
import { PricingAnalysis } from '@/domain/entities/PricingAnalysis'
import { chatWithPersonaAction } from '@/actions/chatWithPersona'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, User, Bot, Loader2, BrainCircuit } from 'lucide-react'
import { readStreamableValue } from '@ai-sdk/rsc'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PersonaChatInterfaceProps {
  persona: Persona
  analysis: PricingAnalysis | null
}

export const PersonaChatInterface: React.FC<PersonaChatInterfaceProps> = ({
  persona,
  analysis
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState(true)

  // Smart Scrolling Logic
  useEffect(() => {
    if (isAutoScrollLocked && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isAutoScrollLocked])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsAutoScrollLocked(isAtBottom)
  }

  const handleSend = (overrideMessage?: string) => {
    const messageToSend = (overrideMessage || input).trim()
    if (!messageToSend || isPending) return

    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: messageToSend }]
    setMessages(newMessages)
    setIsAutoScrollLocked(true) // Re-lock on send

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    startTransition(async () => {
      try {
        const { streamData } = await chatWithPersonaAction(
          persona,
          analysis,
          messageToSend,
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

  const MarkdownComponent = ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(uri) => uri}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
          li: ({ children }) => <li className="font-light">{children}</li>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
          hr: () => <hr className="my-6 border-t border-border/10" />,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }: any) => {
            if (href?.startsWith('persona:')) {
              const context = decodeURIComponent(href.replace('persona:', ''));
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="underline decoration-dotted decoration-primary/50 cursor-help font-semibold text-primary hover:text-white transition-all duration-300 px-1.5 bg-primary/10 rounded-md border border-primary/20">
                      {children}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm p-6 bg-background border border-primary/20 text-foreground shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150 relative z-[100]">
                    <span className="block space-y-4">
                      <span className="flex items-center gap-3 border-b border-border/10 pb-3">
                        <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Buyer Logic</span>
                      </span>
                      <span className="block text-sm leading-relaxed italic text-muted-foreground font-light">
                        {context ? `"${context}"` : "This point is specifically rooted in their unique background and psychological profile."}
                      </span>
                    </span>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">{children}</a>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }

  const prepareContent = (content: string) => {
    return content.replace(/<%([^%]+)%>/g, (_, match) => {
      const [display, context] = match.split('|').map((s: string) => s.trim());
      return `[${display || '...'}](persona:${encodeURIComponent(context || '')})`;
    });
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-12 bg-white/[0.01] custom-scrollbar scroll-smooth"
        >
          <div className="space-y-8 pb-4">
            {messages.length === 0 && (
              <div className="text-center py-32 space-y-6 opacity-30">
                <div className="size-12 rounded-lg border border-white/10 inline-flex items-center justify-center bg-white/[0.02]">
                  <MessageSquare className="size-5 text-muted-foreground" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] max-w-xs mx-auto text-muted-foreground/60">
                  {analysis
                    ? "The audit is ready. Ask anything."
                    : `Introduce yourself to ${persona.name}.`
                  }
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 md:gap-6 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  } animate-in fade-in duration-300`}
              >
                <div
                  className={`flex-shrink-0 mt-1 size-8 rounded-lg flex items-center justify-center text-[10px] font-black tracking-tighter transition-all ${message.role === 'user'
                    ? 'border border-white/10 text-muted-foreground/60 bg-white/[0.02]'
                    : 'bg-primary/20 text-primary border border-primary/20'
                    }`}
                >
                  {message.role === 'user' ? 'YOU' : 'AI'}
                </div>
                <div
                  className={`max-w-[90%] md:max-w-[85%] rounded-lg px-4 py-3 md:px-8 md:py-5 border ${message.role === 'user'
                    ? 'bg-white/[0.03] border-white/10 text-foreground font-medium shadow-sm'
                    : 'bg-white/[0.02] border-white/5 text-foreground/90 font-normal leading-relaxed text-sm md:text-[15px] shadow-sm'
                    }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="antialiased">
                      <MarkdownComponent content={prepareContent(message.content)} />
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap tracking-tight leading-relaxed">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex gap-4 items-center pl-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse border border-primary/20">
                  <Bot className="size-4 text-primary/60" />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-primary/80 uppercase tracking-[0.2em]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        <div className="p-4 md:p-8 border-t border-white/10 bg-background/95 backdrop-blur-xl relative z-10">
          <div className="flex gap-2 md:gap-3 pb-4 md:pb-6 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            {[
              "Why this price point?",
              "Identify trust flags",
              "What's missing here?",
              "Would you buy this?"
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSend(preset)}
                className="whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground transition-colors duration-150"
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
            className="flex gap-3 relative"
          >
            <Input
              placeholder={analysis ? `Ask about the pricing...` : `Ask ${persona.name} a question...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isPending}
              className="flex-1 h-12 bg-white/[0.02] border-white/10 px-6 text-sm rounded-lg focus:border-white/20 transition-colors font-normal placeholder:text-muted-foreground/10 shadow-inner"
            />
            <Button
              type="submit"
              disabled={isPending || !input.trim()}
              variant="premium"
              className="h-12 px-6 rounded-lg shadow-none shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </TooltipProvider>
  )
}
