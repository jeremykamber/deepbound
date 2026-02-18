'use client'

import React from 'react'
import { Persona } from '@/domain/entities/Persona'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Info, ChevronDown, MessageSquare } from 'lucide-react'

interface PersonaCardProps {
  persona: Persona
  onChat?: (persona: Persona) => void
  onViewProfile?: (persona: Persona) => void
  showChatButton?: boolean
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  onChat,
  onViewProfile,
  showChatButton = true
}) => {
  return (
    <Card className="rounded-lg border-white/10 bg-white/[0.03] group transition-colors duration-200 overflow-hidden relative">
      {onViewProfile && (
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 bg-white/5 text-muted-foreground hover:text-white"
            onClick={() => onViewProfile?.(persona)}
          >
            <Info className="size-4" />
          </Button>
        </div>
      )}
      <CardHeader className="px-5 pb-2 pt-5 border-b-2 border-white/10">
        <div className="flex items-start gap-4">
          <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary/60 shrink-0 mt-0.5">
            <Users className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-bold tracking-tight mb-0.5 truncate">{persona.name}</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 line-clamp-1">{persona.occupation}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4 space-y-4">
        <div
          onClick={() => onViewProfile?.(persona)}
          className="group/about relative border-2 border-white/5 rounded-lg p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 group-hover/about:text-primary transition-colors">
              Backstory
            </span>
            <ChevronDown className="size-3 text-muted-foreground/20 group-hover/about:text-primary transition-colors" />
          </div>

          <div className="grid grid-rows-[0fr] group-hover/about:grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-out">
            <div className="overflow-hidden">
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 line-clamp-2">
                {persona.backstory}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {persona.personalityTraits.slice(0, 3).map((trait, idx) => (
            <Badge key={idx} variant="outline" className="rounded-md border-white/10 bg-white/5 text-muted-foreground font-bold">
              {trait}
            </Badge>
          ))}
        </div>

        {showChatButton && (
          <Button
            variant="ghost"
            className="w-full rounded-lg text-[10px] h-9 font-bold uppercase tracking-[0.2em] text-primary/60 hover:text-primary hover:bg-primary/5 border-2 border-primary/10 transition-colors duration-150 group"
            onClick={() => onChat?.(persona)}
          >
            <MessageSquare className="size-3 mr-2 opacity-50" />
            Talk to them
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
