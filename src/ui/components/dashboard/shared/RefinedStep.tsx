import React from 'react'
import { Badge } from "@/components/ui/badge"
import { LucideIcon } from 'lucide-react'

export interface Step {
  id: string
  label: string
  icon: LucideIcon
  description: string
}

interface RefinedStepProps {
  step: Step
  isActive: boolean
  isDone: boolean
  screenshot?: string
  subText?: string
  streamingText?: string
}

export const RefinedStep: React.FC<RefinedStepProps> = ({ step, isActive, isDone, screenshot, subText, streamingText }) => {
  return (
    <div className={`flex gap-4 md:gap-8 transition-all duration-300 ${isActive || isDone ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-1'}`}>
      <div className={`mt-2 size-2.5 rounded-full ring-[4px] transition-all duration-300 ${isActive ? 'bg-primary ring-primary/20 animate-pulse' : isDone ? 'bg-emerald-500 ring-emerald-500/10' : 'bg-white/10 ring-transparent'}`} />
      <div className="flex-1">
        <p className={`text-sm font-bold uppercase tracking-widest mb-1.5 ${isActive || isDone ? 'text-foreground' : 'text-muted-foreground/30'}`}>{step.label}</p>
        <p className="text-xs text-muted-foreground/50 font-medium tracking-tight leading-relaxed">{subText || step.description}</p>
        {isActive && screenshot && (
          <div className="mt-8 rounded-lg overflow-hidden border-2 border-white/10 shadow-3xl aspect-video bg-black relative group/screenshot">
            <img src={`data:image/jpeg;base64,${screenshot}`} alt="Trace Feed" className="object-cover w-full h-full opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
            <div className="absolute bottom-4 right-4">
              <Badge variant="outline" className="bg-black/80 backdrop-blur-xl rounded-md px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest border-white/10 text-muted-foreground/60 shadow-2xl">Live Feed</Badge>
            </div>
          </div>
        )}
        {isActive && (step.id === 'THINKING' || step.id === 'BRAINSTORMING_PERSONAS' || step.id === 'GENERATING_BACKSTORIES') && streamingText && (
          <div key={streamingText.length > 0 ? 'active' : 'inactive'} className="mt-6 p-5 rounded-lg bg-white/[0.02] border-2 border-white/10 font-mono text-[10px] text-primary/60 overflow-hidden break-words max-h-[250px] overflow-y-auto custom-scrollbar shadow-inner relative group/stream animate-in fade-in slide-in-from-bottom-1 duration-200">
            <div className="flex items-center gap-2 mb-3 opacity-40">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="uppercase tracking-[0.2em] text-[8px] font-black">
                {step.id === 'BRAINSTORMING_PERSONAS' ? 'Synthesizing Profiles' : step.id === 'GENERATING_BACKSTORIES' ? 'Writing Narrative' : 'Incoming Thoughts'}
              </span>
            </div>
            <div className="leading-relaxed whitespace-pre-wrap transition-opacity duration-200 antialiased">
              {streamingText.length > 3000
                ? `...[truncated for performance]\n\n${streamingText.slice(-2500)}`
                : streamingText}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  )
}
