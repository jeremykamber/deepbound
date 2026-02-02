'use client'

import React from 'react'
import { Persona } from '@/domain/entities/Persona'
import { PricingAnalysis } from '@/domain/entities/PricingAnalysis'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PersonaChatInterface } from './dashboard/shared/PersonaChatInterface'

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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] w-[calc(100%-2rem)] h-[85vh] flex flex-col p-0 overflow-hidden bg-background border border-white/15 shadow-3xl rounded-xl transform-gpu">
        <DialogHeader className="p-6 md:p-10 pb-4 md:pb-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="size-10 md:size-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary/60 shadow-inner shrink-0">
              <User className="size-5" />
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-md border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold tracking-widest text-[9px] uppercase">Connected</Badge>
              </div>
              <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight text-foreground line-clamp-1">
                {analysis ? `Chat with ${persona.name}` : `Interviewing ${persona.name}`}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <PersonaChatInterface persona={persona} analysis={analysis} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
